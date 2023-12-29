import { del, get, keys, set } from './thirdparty/idb-keyval.js';

const POS_PREFIX = 'pos-';
const CURRENT_BOOK_KEY = 'current-book-key';
const BOOK_PREFIX = 'book-';

const cache = new WeakMap();

/**
 * @param {string} message
 * @param {AlgorithmIdentifier} algorithm
 * @returns {Promise<string>}
 */
const digestMessage = (message, algorithm = 'sha-256') =>
    crypto.subtle.digest(algorithm, new TextEncoder().encode(message)).then(
        data => Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, "0")).join("")
    );


/**
 * @param {Fb2Meta} meta
 * @returns {Promise<string>}
 */
async function createBookId(meta) {
    if (cache.has(meta)) {
        return cache.get(meta);
    }

    const bookId = await digestMessage([
        meta.title,
        ...meta.authors,
        meta.sequenceName ?? '',
        String(meta.sequenceNumber)
    ].join('###'));

    if (!cache.has(meta)) {
        cache.set(meta, bookId);
    }

    return bookId;
}


/**
 * @param {Fb2Meta} bookMeta
 * @param {number} position
 * @returns {Promise<void>}
 */
export async function saveBookPosition(bookMeta, position = 0) {
    const id = await createBookId(bookMeta);

    return set(POS_PREFIX + id, position);
}

/**
 * @param {Fb2Meta} bookMeta
 * @returns {Promise<number>}
 */
export async function loadBookPosition(bookMeta) {
    const bookId = await createBookId(bookMeta);
    const position = await get(POS_PREFIX + bookId);

    return position ? (Number(position) || 0) : 0;
}

export async function saveBook(meta, htmlBook, isCurrent = false) {
    const id = await createBookId(meta);

    await set(BOOK_PREFIX + id, { meta, htmlBook: htmlBook.outerHTML ?? htmlBook });
    if (isCurrent) {
        await setCurrentBookId(id);
    }
}

export async function clearCurrentBook() {
    await del(CURRENT_BOOK_KEY);
}

export async function getCurrentBookId() {
    return get(CURRENT_BOOK_KEY);
}

export async function setCurrentBookId(id) {
    await set(CURRENT_BOOK_KEY, id);
}

/**
 * @param {string} id
 * @returns {Promise<undefined|{ meta: Fb2Meta, htmlBook: string }>}
 */
export async function loadBook(id) {
    if (!id || id.startsWith(POS_PREFIX)) return;

    return get(BOOK_PREFIX + id);
}

export async function removeBook(id) {
    if (!id || id.startsWith(POS_PREFIX)) return;

    await del(BOOK_PREFIX + id);
    await del(POS_PREFIX + id);
    const currentId = await getCurrentBookId();
    if (currentId === id) {
        await clearCurrentBook();
    }
}

export async function getStoredBookIds() {
    const k = await keys();

    return k.filter(v => v.startsWith(BOOK_PREFIX)).map(v => v.replace(BOOK_PREFIX, ''));
}
