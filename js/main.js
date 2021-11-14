import { unzip, setOptions } from './unzipit.module.js';
import BookPosition from './book-position.js';
import { getMeta, readFb2File, parseFb2ToHtml, getImageSrc } from './fb2-utils.js';

setOptions({
    workerURL: '/js/unzipit-worker.module.js',
    numWorkers: 2,
});

const fEl = document.getElementById('f');
const bookEl = document.getElementById('book');
let xml;

function showBookInfo(xml) {
    const meta = getMeta(xml);

    const info = document.getElementById('top-book-info');
    info.innerHTML = `
<div>Автор${meta.authors.length > 1 ? 'ы' : ''}: ${meta.authors.join(', ')}</div>
<div>Название: ${meta.title}</div>
${meta.sequenceName ? `<div>Серия: ${meta.sequenceName}, том ${meta.sequenceNumber}</div>` : ''}
<div class="book-annotation">${meta.annotation.innerHTML}</div>`;
}

async function unzipFb2(file) {
    const { entries } = await unzip(file);
    const fb2FileName = Object.keys(entries).find(name => name.endsWith('.fb2'));
    if (!fb2FileName) throw new DOMException('No FB2 inside zip', 'ZIP-NONFB2');

    return entries[fb2FileName].blob();
}

/**
 * @param {File} file
 * @return {Promise<HTMLElement>}
 */
async function processFile(file) {
    const fb2File = file.name.endsWith('.zip') ? await unzipFb2(file) : file;
    xml = await readFb2File(fb2File);
    if (!xml.querySelector('FictionBook')) throw new DOMException('Non-FB2 document detected', 'NONFB2');

    showBookInfo(xml);

    return renderBook(xml);
}

function bookCleanup() {
    if (!bookPosition) return;

    if (finalizeBookTo) {
        clearTimeout(finalizeBookTo);
        finalizeBookTo = null;
    }
    bookResizeObserver?.disconnect();
    bookResizeObserver = null;
    window.removeEventListener('keyup', pageControl);
    bookPosition = null;
    if (bookEl.hasChildNodes()) {
        bookEl.removeChild(bookEl.firstChild);
    }
}

/** @type {BookPosition} */
let bookPosition = null;
let finalizeBookTo = null;
/** @type {ResizeObserver} */
let bookResizeObserver = null;

function handleFile(file) {
    processFile(file).then(htmlBook => {
        bookEl.appendChild(htmlBook);
        fEl.style.visibility = 'hidden';
        bookPosition = new BookPosition(htmlBook);
        window.addEventListener('keyup', pageControl);
        finalizeBookTo = setTimeout(() => {
            bookPosition.calcPagination();
            updateFooter();
            bookResizeObserver = new ResizeObserver(() => {
                bookPosition.handleDomChanges();
                updateFooter();
            });
            bookResizeObserver.observe(htmlBook);
            finalizeBookTo = null;
        }, 20);
    }, e => {
        console.log(e);
        alert(e.message);
    })
}

fEl.addEventListener('change', () => {
    if (fEl.files.length > 0) handleFile(fEl.files[0]);
});

function updateFooter() {
    document.getElementById('totalPages').innerText = bookPosition.getTotalPages();
    document.getElementById('curPage').innerText = bookPosition.getCurrentPage() + 1;
    document.getElementById('curPercent').innerText = bookPosition.getCurrentPercent().toFixed(1);
}

function pageControl(e) {
    function go(delta) {
        e.preventDefault();
        e.stopPropagation();
        let page = bookPosition.getCurrentPage();
        const pagesPerSpread = bookPosition.getPagesPerSpread();
        bookPosition.goToPage(page + delta * pagesPerSpread);
        updateFooter();
    }

    switch (e.key) {
        case 'PageUp': return go(-1);
        case ' ':
        case 'PageDown': return go(1);
        case 'Home': return go(-Infinity);
        case 'End': return go(+Infinity);
    }
}

async function renderBook(xml) {
    const doc = await parseFb2ToHtml(xml);

    const images = doc.querySelectorAll('img[data-src]');
    const binaries = Array.from(xml.getElementsByTagName('binary'));
    const binariesMap = Object.fromEntries(binaries.map(binary => [binary.id, binary]));

    images.forEach(image => {
        image.src = getImageSrc(binariesMap[image.dataset.src]);
    });

    const htmlBook = doc.body.firstChild;

    return htmlBook;
}
