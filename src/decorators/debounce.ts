export function debounce(timeout: number, isImmediate=false) {
    // store timeout value for cancel the timeout
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

    return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        descriptor.value = function(...args) {
            const context = this;

            const doLater = function() {
                timeoutId = undefined;
                if (!isImmediate) {
                     original.apply(context, args);
                }
            };

            const shouldCallNow = isImmediate && timeoutId === undefined;

            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(doLater, timeout);

            if (shouldCallNow) {
                 original.apply(context, args);
            }
        }
        return descriptor;
    }
}