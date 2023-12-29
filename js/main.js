import processFile from './process-fb2.js';
import BookPosition from './book-position.js';
import { getSwipe } from './swipe.js';
import { absorb } from './utils.js';
import { openBookshelf } from './bookshelf.js';
import {
    clearCurrentBook,
    getCurrentBookId,
    loadBook,
    loadBookPosition,
    saveBook,
    saveBookPosition,
    setCurrentBookId,
} from './book-storage.js';

const Fb2ReaderTitle = 'FB2 Reader';

const welcomeEl = document.getElementById('welcome');
const fEl = document.getElementById('f');
const bookEl = document.getElementById('book');
const topInfoTrigger = document.getElementById('top-book-info-trigger');
const closeBookBtn = document.getElementById('close-book');
const backLinkBtn = document.getElementById('back-link');
const bookInfoBlock = document.getElementById('book-info-block');
const topInfoBlock = document.getElementById('top-book-info');
const progressBlock = document.getElementById('progress');


getCurrentBookId().then(id => {
    if (id) {
        preloadSavedFile(id);
    }
});

fEl.addEventListener('change', () => {
    if (fEl.files.length > 0) handleFile(fEl.files[0]);
});

welcomeEl.querySelector('.open-shelf').onclick = () => {
    openBookshelf(key => {
        preloadSavedFile(key).then(() => setCurrentBookId(key));
    });
}

bookEl.addEventListener('dragover', absorb);
bookEl.addEventListener('drop', e => {
    absorb(e);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

function showBookInfo(meta) {
    const authors = meta.authors.join(', ');
    bookInfoBlock.classList.remove('disabled');
    topInfoTrigger.style.display = 'block';
    topInfoBlock.innerHTML = `
<div>Author${meta.authors.length > 1 ? 's' : ''}: ${authors}</div>
<div>Title: ${meta.title}</div>
${meta.sequenceName ? `<div>Series: ${meta.sequenceName}, #${meta.sequenceNumber}</div>` : ''}
<div class="book-annotation">${meta.annotationHtml}</div>`;
    document.title = `${meta.title} - ${authors} / ${Fb2ReaderTitle}`;
}

let swipeCleanup = null;

function bookCleanup(full = false) {
    if (!bookPosition) return;

    if (finalizeBookTo) {
        clearTimeout(finalizeBookTo);
        finalizeBookTo = null;
    }
    /*if (full && confirm('Save current book to the bookshelf?')) {
        saveBook(bookMeta, bookEl.innerHTML);
    }*/
    bookResizeObserver?.disconnect();
    bookResizeObserver = null;
    fontChangeObserver?.disconnect();
    fontChangeObserver = null;
    window.removeEventListener('keyup', pageControl);
    swipeCleanup?.();
    swipeCleanup = null;
    bookPosition = null;
    bookMeta = null;
    updateFooter(false);
    internalLinksPath.length = 0;
    if (bookEl.hasChildNodes()) {
        bookEl.removeChild(bookEl.firstChild);
    }
    if (full) {
        topInfoTrigger.style.display = 'none';
        welcomeEl.style.visibility = 'visible';
        topInfoBlock.innerHTML = '';
        fEl.value = '';
        clearCurrentBook();
    }
    bookInfoBlock.classList.add('disabled');
    document.title = Fb2ReaderTitle;
}

closeBookBtn.addEventListener('click', () => bookCleanup(true));

const internalLinksPath = [];

/**
 * @param {MouseEvent} e
 */
function handleInternalLinks(e) {
    if (bookPosition && e.target.nodeName.toLowerCase() === 'a' &&
        e.target.attributes.href &&
        e.target.attributes.href.value[0] === '#') {
        absorb(e);
        const linkName = e.target.attributes.href.value.slice(1);
        const res = bp.goToLinkName(linkName);
        if (res) {
            internalLinksPath.push(e.target);
            updateFooter();
            console.log(`Go to link ${linkName}`);
        }
    }
}

function goBack(e) {
    absorb(e);

    if (!bookPosition || internalLinksPath.length === 0) return;
    const backRef = internalLinksPath.pop();
    if (backRef instanceof HTMLElement || typeof backRef === 'string') {
        bp.goToLinkName(backRef);
    } else if (typeof backRef === 'number') {
        bp.goToPercent(backRef);
    }
    updateFooter();
}

backLinkBtn.addEventListener('click', goBack);

function navigateByClick(e) {
    absorb(e);
    if (!bookPosition) return;

    internalLinksPath.push(bookPosition.getCurrentPercent());
    const percent = e.clientX / e.target.clientWidth * 100;
    bookPosition.goToPercent(percent);
    updateFooter();
}

progressBlock.addEventListener('click', navigateByClick);

/** @type {BookPosition} */
let bookPosition = null;
let finalizeBookTo = null;
/** @type {ResizeObserver} */
let bookResizeObserver = null;
/** @type {MutationObserver} */
let fontChangeObserver = null;
/** @type {Fb2Meta} */
let bookMeta;

async function preloadSavedFile(key) {
    const currentBook = await loadBook(key);
    if (currentBook) {
        const position = await loadBookPosition(currentBook.meta);
        showParsedFile(currentBook.meta, currentBook.htmlBook, position);
    }
}

/**
 * @param {Fb2Meta} meta
 * @param {ChildNode|string} htmlBook
 * @param {number} initialPosition
 */
function showParsedFile(meta, htmlBook, initialPosition) {
    bookCleanup();
    if (typeof htmlBook === 'string') {
        bookEl.innerHTML = htmlBook;
    } else {
        bookEl.appendChild(htmlBook);
    }
    bookMeta = meta;
    showBookInfo(meta);
    const actualHtmlBook = bookEl.firstChild;
    actualHtmlBook.addEventListener('click', handleInternalLinks, true);
    welcomeEl.style.visibility = 'hidden';
    bookPosition = new BookPosition(actualHtmlBook);
    window.bp = bookPosition;
    window.addEventListener('keyup', pageControl);
    swipeCleanup = getSwipe(bookEl, swipe => {
        if (swipe === 'left') {
            pageControl({ key: 'PageUp'});
        } else if (swipe === 'right') {
            pageControl({ key: 'PageDown'});
        }
    });
    finalizeBookTo = setTimeout(() => {
        bookPosition.calcPagination();
        updateFooter(false);
        if (initialPosition > 0) {
            bookPosition.goToPercent(initialPosition);
            updateFooter(false);
        }
        const domChangeObserver = () => {
            bookPosition.handleDomChanges();
            updateFooter(false);
        };
        bookResizeObserver = new ResizeObserver(domChangeObserver);
        bookResizeObserver.observe(actualHtmlBook);
        fontChangeObserver = new MutationObserver(domChangeObserver);
        fontChangeObserver.observe(document.documentElement, { attributes: true })
        finalizeBookTo = null;
    }, 20);
}

async function handleFile(file) {
    const { meta, book } = await processFile(file);
    if (!meta || !book) {
        alert('incorrect book contents');
        return;
    }
    const position = await loadBookPosition(meta);
    showParsedFile(meta, book, position);
    await saveBook(meta, book, true);
}

function showPercent(p) {
    progressBlock.style.setProperty('--percent', p + '%');
    document.getElementById('curPercent').innerText = p;
}

function updateFooter(savePosition = true) {
    document.getElementById('totalPages').innerText =
        String(bookPosition?.getTotalPages() ?? 0);
    document.getElementById('curPage').innerText =
        String((bookPosition?.getCurrentPage()  ?? 0) + (bookPosition ? 1 : 0));
    const currentPercent = bookPosition?.getCurrentPercent() ?? 0;
    showPercent(currentPercent?.toFixed(1) ?? 0);
    if (bookPosition && savePosition) {
        saveBookPosition(bookMeta, currentPercent);
    }
}

function pageControl(e) {
    function go(delta) {
        absorb(e);
        let page = bookPosition.getCurrentPage();
        const pagesPerSpread = bookPosition.getPagesPerSpread();
        bookPosition.goToPage(page + delta * pagesPerSpread);
        updateFooter();
    }

    switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp': return go(-1);
        case ' ':
        case 'ArrowRight':
        case 'PageDown': return go(1);
        case 'Home': return go(-Infinity);
        case 'End': return go(+Infinity);
        case 'Backspace': return goBack(e);
    }
}
