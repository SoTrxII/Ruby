import * as memoizee from "memoizee";
/**
 * This decorator allows caching a function result to prevent re-executing with known parameters
 * @param cacheSize Max cache size for this method
 */
export const memoize = (cacheSize: number = 10): MethodDecorator => {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) => {
    propertyDescriptor.value = memoizee(propertyDescriptor.value, {
      promise: true,
      max: cacheSize
    });
  };
};
