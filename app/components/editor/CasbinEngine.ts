import { 
  newEnforcer, 
  newModel, 
  StringAdapter, 
  DefaultRoleManager, 
  Util as CasbinUtil
} from 'casbin';
import { remoteEnforcer } from './hooks/useRemoteEnforcer';
import { parseABACRequest } from '../../utils/utils';
import { newEnforceContext } from '@/app/components/editor/hooks/useSetupEnforceContext';

// 定义统一的执行结果接口
interface EnforceResult {
  allowed: boolean;
  reason: string[];
  error: string | null;
}

// 定义统一的 Casbin 引擎接口
export interface ICasbinEngine {
  enforce(params: {
    model: string;
    policy: string;
    request: string;
    customConfig?: string;
    enforceContextData?: Map<string, string>;
  }): Promise<EnforceResult>;

  getVersion(): string;
  getType(): 'node' | 'java' | 'go';
}

// Node.js 实现
export class NodeCasbinEngine implements ICasbinEngine {
  async enforce(params) {
    try {
      const e = await newEnforcer(
        newModel(params.model), 
        params.policy ? new StringAdapter(params.policy) : undefined
      );

      // 设置角色管理器
      if (!e.getRoleManager()) {
        const roleManager = new DefaultRoleManager(10);
        e.setRoleManager(roleManager);
      }

      // 处理自定义配置
      if (params.customConfig) {
        try {
          const builtinFunc = {
            keyMatch: CasbinUtil.keyMatchFunc,
            keyGet: CasbinUtil.keyGetFunc,
            keyMatch2: CasbinUtil.keyMatch2Func,
            keyGet2: CasbinUtil.keyGet2Func,
            keyMatch3: CasbinUtil.keyMatch3Func,
            keyMatch4: CasbinUtil.keyMatch4Func,
            regexMatch: CasbinUtil.regexMatchFunc,
            ipMatch: CasbinUtil.ipMatchFunc,
            globMatch: CasbinUtil.globMatch,
          };

          // eslint-disable-next-line
          let config = eval(params.customConfig);
          if (config) {
            config = {
              ...config,
              functions: { ...config.functions, ...builtinFunc },
            };
            
            // 添加自定义函数
            if (config?.functions) {
              Object.keys(config.functions).forEach((key) => {
                e.addFunction(key, config.functions[key]);
              });
            }

            // 处理角色匹配函数
            const rm = e.getRoleManager() as DefaultRoleManager;
            if (config.matchingForGFunction) {
              if (typeof config.matchingForGFunction === 'function') {
                await rm.addMatchingFunc(config.matchingForGFunction);
              } else if (typeof config.matchingForGFunction === 'string' && 
                        config.matchingForGFunction in config.functions) {
                await rm.addMatchingFunc(config.functions[config.matchingForGFunction]);
              }
            }

            // 处理域匹配函数
            if (config.matchingDomainForGFunction) {
              if (typeof config.matchingDomainForGFunction === 'function') {
                await rm.addDomainMatchingFunc(config.matchingDomainForGFunction);
              } else if (typeof config.matchingDomainForGFunction === 'string' && 
                        config.matchingDomainForGFunction in config.functions) {
                await rm.addDomainMatchingFunc(config.functions[config.matchingDomainForGFunction]);
              }
            }
          }
        } catch (error) {
          throw new Error(`Please check syntax in Custom Function Editor: ${error as any}`);
        }
      }

      // 处理请求
      const requests = params.request.split('\n').filter((line) => {return line.trim()});
      const results = await Promise.all(requests.map(async (request) => {
        if (!request || request[0] === '#') {
          return { request, okEx: false, reason: ['ignored'] };
        }

        const rvals = parseABACRequest(request);
        const ctx = newEnforceContext(params.enforceContextData);
        const [okEx, reason] = await e.enforceEx(ctx, ...rvals);
        return { request, okEx, reason };
      }));

      return {
        allowed: results[0].okEx,
        reason: results[0].reason,
        error: null
      };
    } catch (error) {
      return {
        allowed: false,
        reason: ["Error occurred during enforcement"],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  getVersion(): string {
    return process.env.CASBIN_VERSION || '';
  }

  getType(): 'node' {
    return 'node';
  }
}

// 远程 Casbin 实现
export class RemoteCasbinEngine implements ICasbinEngine {
  constructor(private engine: 'java' | 'go') {}

  async enforce(params) {
    return remoteEnforcer({
      model: params.model,
      policy: params.policy,
      request: params.request,
      engine: this.engine
    });
  }

  getVersion(): string {
    return '';  // TODO: 实现版本获取
  }

  getType(): 'java' | 'go' {
    return this.engine;
  }
}

// 工厂函数
export function createCasbinEngine(type: 'node' | 'java' | 'go'): ICasbinEngine {
  switch (type) {
    case 'node':
      return new NodeCasbinEngine();
    case 'java':
    case 'go':
      return new RemoteCasbinEngine(type);
    default:
      throw new Error(`Unsupported engine type: ${type}`);
  }
} 