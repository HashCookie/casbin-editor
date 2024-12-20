import { Enforcer, DefaultRoleManager, Util as CasbinUtil } from 'casbin';

/**
 * Configure custom functions and RoleManager
 * @param enforcer Casbin's Enforcer instance
 * @param customConfig Custom configuration string, including function and matcher configurations.
 */

export async function setupCustomConfig(enforcer: Enforcer, customConfig: string): Promise<void> {
  try {
    // Define built-in functions.
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

    // Use eval to parse custom configuration (assuming the format is a JavaScript object).
    let config = eval(customConfig);
    if (config) {
      // Merge custom functions and built-in functions
      config = {
        ...config,
        functions: { ...config.functions, ...builtinFunc },
      };

      // Add custom functions to Enforcer
      if (config?.functions) {
        Object.keys(config.functions).forEach((key) => {
          enforcer.addFunction(key, config.functions[key]);
        });
      }

      // Get RoleManager instance
      const rm = enforcer.getRoleManager() as DefaultRoleManager;

      // Configure role matching function
      if (config.matchingForGFunction) {
        if (typeof config.matchingForGFunction === 'function') {
          await rm.addMatchingFunc(config.matchingForGFunction);
        } else if (typeof config.matchingForGFunction === 'string' && config.matchingForGFunction in config.functions) {
          await rm.addMatchingFunc(config.functions[config.matchingForGFunction]);
        }
      }

      // Configure domain matching function
      if (config.matchingDomainForGFunction) {
        if (typeof config.matchingDomainForGFunction === 'function') {
          await rm.addDomainMatchingFunc(config.matchingDomainForGFunction);
        } else if (typeof config.matchingDomainForGFunction === 'string' && config.matchingDomainForGFunction in config.functions) {
          await rm.addDomainMatchingFunc(config.functions[config.matchingDomainForGFunction]);
        }
      }
    }
  } catch (error) {
    // Throw an error with detailed information
    throw new Error(`Error in custom configuration: ${error as any}`);
  }
}

/**
 * Initialize RoleManager
 * If RoleManager is not set, initialize it
 * @param enforcer Casbin's Enforcer instance
 */
export function setupRoleManager(enforcer: Enforcer): void {
  if (!enforcer.getRoleManager()) {
    // Create default RoleManager, supporting 10 levels of role inheritance
    const roleManager = new DefaultRoleManager(10);
    enforcer.setRoleManager(roleManager);
  }
}