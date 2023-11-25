/**
 * @param {string} message
 * @param {AlgorithmIdentifier} algorithm
 * @returns {Promise<string>}
 */
export const digestMessage = (message, algorithm = 'sha-256') =>
    crypto.subtle.digest(algorithm, new TextEncoder().encode(message)).then(
        data => Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, "0")).join("")
    );

/**
 * @param {Event} e
 */
export function absorb(e) {
    e.preventDefault?.();
    e.stopPropagation?.();
}
