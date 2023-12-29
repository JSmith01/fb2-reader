/**
 * @param {Event} e
 */
export function absorb(e) {
    e.preventDefault?.();
    e.stopPropagation?.();
}
