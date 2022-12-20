/**
 * Adds event listener to target with prevented propagation and default action
 * could be called as addListener(target, handler) or addListener(target, eventType, handler)
 * @param {HTMLElement} target
 * @param {string|function} typeOrCb click by default
 * @param {function} [eventHandler]
 * @returns {function(): *} un-subscriber callback
 */
export function addListener(target, typeOrCb, eventHandler) {
    const type = typeof typeOrCb === 'string' ? typeOrCb : 'click';
    const handler = typeof typeOrCb === 'function' ? typeOrCb : eventHandler;

    const listener = e => {
        e.stopPropagation();
        e.preventDefault();
        return handler(e);
    };

    target.addEventListener(type, listener);

    return () => target.removeEventListener(type, listener);
}
