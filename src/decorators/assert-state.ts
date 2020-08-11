import {
  InvalidStateError,
  Jukebox,
  JUKEBOX_STATE
} from "../components/jukebox";

/**
 * Restricts a Jukebox command by only allowing the method to proceed if the Jukebox is one of the target state
 */
export function assertState(...states: JUKEBOX_STATE[]) {
  return (
    target: Jukebox,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) => {
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function(...args: any[]) {
      if (!states.includes(this.state)) {
        throw new InvalidStateError();
      }
      originalMethod.apply(this, args);
    };
  };
}
