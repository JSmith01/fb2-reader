import { get, keys, del } from './thirdparty/idb-keyval.js';
import { absorb } from './utils.js';

/** @var {HTMLDialogElement} */
const modal = document.getElementById('bookshelf-manager');
const table = modal.querySelector('table');
const rowTemplate = modal.querySelector('.shelf-row');
const emptyTemplate = modal.querySelector('.shelf-empty');
const closeBtn = modal.querySelector('.close');

closeBtn.onclick = () => {
    modal.close();
    clearModal();
};

const makeOpenBookHandler = preloadSavedFile => function openBookFromShelf(e) {
    absorb(e);
    preloadSavedFile(e.target.dataset.key);
    modal.close();
}

const makeRemoveBookHandler = openBookHandler => function deleteBookFromShelf(e) {
    absorb(e);
    del(e.target.dataset.key);
    openBookshelf(openBookHandler);
}

function clearModal() {
    table.querySelectorAll('tr').forEach(el => table.removeChild(el));
}

async function updateBookshelf(openBookHandler) {
    const removeBookHandler = makeRemoveBookHandler(openBookHandler);
    clearModal();
    const bookKeys = (await keys()).filter(k => !k.startsWith('current'));
    let booksCount = 0;
    for (const bookKey of bookKeys) {
        const book = await get(bookKey);
        if (!book?.meta) continue;
        const row = rowTemplate.content.cloneNode(true);
        const td = row.querySelector('td');
        const a = document.createElement('a');
        a.dataset.key = bookKey;
        a.onclick = openBookHandler;
        a.href = '#';
        a.innerText = book.meta.title;
        td.appendChild(a);
        const btn = row.querySelector('button');
        btn.dataset.key = bookKey;
        btn.onclick = removeBookHandler;
        table.appendChild(row);
        booksCount++;
    }
    if (booksCount === 0) {
        table.appendChild(emptyTemplate.content.cloneNode(true));
    }
}

export async function openBookshelf(preloadSavedFile) {
    await updateBookshelf(makeOpenBookHandler(preloadSavedFile));
    modal.showModal();
}
