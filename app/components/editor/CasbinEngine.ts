import { newEnforcer, newModel, StringAdapter, DefaultRoleManager, Util as CasbinUtil } from 'casbin';
import { remoteEnforcer } from './hooks/useRemoteEnforcer';
import { parseABACRequest } from '../../utils/utils';
import { newEnforceContext } from '@/app/components/editor/hooks/useSetupEnforceContext';

interface EnforceResult {
  allowed: boolean;
  reason: string[];
  error: string | null;
}

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

// Node.js
export class NodeCasbinEngine implements ICasbinEngine {
  async enforce(params) {
    try {
      const e = await newEnforcer(newModel(params.model), params.policy ? new StringAdapter(params.policy) : undefined);

      if (!e.getRoleManager()) {
        const roleManager = new DefaultRoleManager(10);
        e.setRoleManager(roleManager);
      }

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
              } else if (typeof config.matchingForGFunction === 'string' && config.matchingForGFunction in config.functions) {
                await rm.addMatchingFunc(config.functions[config.matchingForGFunction]);
              }
            }

            // 处理域匹配函数
            if (config.matchingDomainForGFunction) {
              if (typeof config.matchingDomainForGFunction === 'function') {
                await rm.addDomainMatchingFunc(config.matchingDomainForGFunction);
              } else if (typeof config.matchingDomainForGFunction === 'string' && config.matchingDomainForGFunction in config.functions) {
                await rm.addDomainMatchingFunc(config.functions[config.matchingDomainForGFunction]);
              }
            }
          }
        } catch (error) {
          throw new Error(`Please check syntax in Custom Function Editor: ${error as any}`);
        }
      }

      const requests = params.request.split('\n').filter((line) => {
        return line.trim();
      });
      const results = await Promise.all(
        requests.map(async (request) => {
          if (!request || request[0] === '#') {
            return { request, okEx: false, reason: ['ignored'] };
          }

          const rvals = parseABACRequest(request);
          const ctx = newEnforceContext(params.enforceContextData);
          const [okEx, reason] = await e.enforceEx(ctx, ...rvals);
          return { request, okEx, reason };
        }),
      );

      return {
        allowed: results[0].okEx,
        reason: results[0].reason,
        error: null,
      };
    } catch (error) {
      throw error;
    }
  }

  getVersion(): string {
    return process.env.CASBIN_VERSION || '';
  }

  getType(): 'node' {
    return 'node';
  }
}

// RemoteCasbinEngine
export class RemoteCasbinEngine implements ICasbinEngine {
  constructor(private engine: 'java' | 'go') {}

  async enforce(params) {
    try {
      const result = await remoteEnforcer({
        model: params.model,
        policy: params.policy,
        request: params.request,
        engine: this.engine,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        allowed: result.allowed,
        reason: result.reason,
        error: null,
      };
    } catch (error) {
      throw error;
    }
  }

  getVersion(): string {
    return '';
  }

  getType(): 'java' | 'go' {
    return this.engine;
  }
}

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
