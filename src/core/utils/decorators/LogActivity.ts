
import { logger } from '../../../infra/logging/LoggerService.js';

/**
 * Decorator to log method execution, arguments, result, and execution time.
 * Usage: @LogActivity('Category')
 */
export function LogActivity(category: string = 'System') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyKey;
      const start = Date.now();

      // Log Start
      logger.debug(`[Started] ${className}.${methodName}`, { args });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;

        // Log Completion
        logger.debug(`[Completed] ${className}.${methodName} in ${duration}ms`, { 
            result: typeof result === 'object' ? 'Object' : result 
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - start;
        
        // Log Error
        logger.error(`[Failed] ${className}.${methodName} in ${duration}ms`, {
            error: error.message,
            stack: error.stack,
            args
        });
        
        throw error;
      }
    };

    return descriptor;
  };
}
