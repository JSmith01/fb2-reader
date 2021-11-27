import { set, get } from './idb-keyval.js';
import processFile from './process-fb2.js';
import BookPosition from './book-position.js';

const LS_KEY_THEME = 'theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const THEME_OS = '';

const fEl = document.getElementById('f');
const bookEl = document.getElementById('book');
const topInfoTrigger = document.getElementById('top-book-info-trigger');
const closeBookBtn = document.getElementById('close-book');
const backLinkBtn = document.getElementById('back-link');
const lightThemeBtn = document.getElementById('light-theme');
const darkThemeBtn = document.getElementById('dark-theme');
const topInfoBlock = document.getElementById('top-book-info');
const progressBlock = document.getElementById('progress');

function absorb(e) {
    e.preventDefault();
    e.stopPropagation();
}

let themeActive = THEME_OS;
const setThemeActive = valOrCb => {
    themeActive = typeof valOrCb === 'function' ? valOrCb(themeActive) : valOrCb;
    localStorage.setItem(LS_KEY_THEME, themeActive);
    syncThemeUi();
}

setThemeActive(localStorage[LS_KEY_THEME] ?? THEME_OS);

function syncThemeUi() {
    const ACTIVE = 'active';

    switch (themeActive) {
        case THEME_OS: {
            document.body.classList.remove(THEME_LIGHT);
            document.body.classList.remove(THEME_DARK);
            lightThemeBtn.classList.remove(ACTIVE);
            darkThemeBtn.classList.remove(ACTIVE);
            break;
        }
        case THEME_LIGHT: {
            document.body.classList.add(THEME_LIGHT);
            document.body.classList.remove(THEME_DARK);
            lightThemeBtn.classList.add(ACTIVE);
            darkThemeBtn.classList.remove(ACTIVE);
            break;
        }
        case THEME_DARK: {
            document.body.classList.remove(THEME_LIGHT);
            document.body.classList.add(THEME_DARK);
            lightThemeBtn.classList.remove(ACTIVE);
            darkThemeBtn.classList.add(ACTIVE);
            break;
        }
    }
}

syncThemeUi();

lightThemeBtn.addEventListener('click', e => {
    absorb(e);
    setThemeActive(themeActive => themeActive === THEME_LIGHT ? THEME_OS : THEME_LIGHT);
});

darkThemeBtn.addEventListener('click', e => {
    absorb(e);
    setThemeActive(themeActive => themeActive === THEME_DARK ? THEME_OS : THEME_DARK);
});

preloadSavedFile();

fEl.addEventListener('change', () => {
    if (fEl.files.length > 0) handleFile(fEl.files[0]);
});

bookEl.addEventListener('dragover', absorb);
bookEl.addEventListener('drop', e => {
    absorb(e);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

function showBookInfo(meta) {
    topInfoTrigger.style.display = 'block';
    topInfoBlock.innerHTML = `
<div>Author${meta.authors.length > 1 ? 's' : ''}: ${meta.authors.join(', ')}</div>
<div>Title: ${meta.title}</div>
${meta.sequenceName ? `<div>Series: ${meta.sequenceName}, #${meta.sequenceNumber}</div>` : ''}
<div class="book-annotation">${meta.annotationHtml}</div>`;
}

function bookCleanup(full = false) {
    if (!bookPosition) return;

    if (finalizeBookTo) {
        clearTimeout(finalizeBookTo);
        finalizeBookTo = null;
    }
    bookResizeObserver?.disconnect();
    bookResizeObserver = null;
    window.removeEventListener('keyup', pageControl);
    bookPosition = null;
    updateFooter();
    internalLinksPath.length = 0;
    if (bookEl.hasChildNodes()) {
        bookEl.removeChild(bookEl.firstChild);
    }
    if (full) {
        topInfoTrigger.style.display = 'none';
        fEl.style.visibility = 'visible';
        topInfoBlock.innerHTML = '';
        fEl.value = '';
    }
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

async function preloadSavedFile() {
    const currentBook = await get('current-book');
    const currentBookPosition = await get('current-book-position');
    if (currentBook) {
        const position = currentBookPosition != null ? parseFloat(currentBookPosition) : 0;
        showParsedFile([currentBook.meta, currentBook.htmlBook], position);
    }
}

function saveFile([meta, htmlBook]) {
    set('current-book', { meta, htmlBook: htmlBook.outerHTML });
    return [meta, htmlBook];
}

function showParsedFile([meta, htmlBook], initialPosition = 0) {
    bookCleanup();
    if (typeof htmlBook === 'string') {
        bookEl.innerHTML = htmlBook;
    } else {
        bookEl.appendChild(htmlBook);
    }
    showBookInfo(meta);
    const actualHtmlBook = bookEl.firstChild;
    actualHtmlBook.addEventListener('click', handleInternalLinks, true);
    fEl.style.visibility = 'hidden';
    bookPosition = new BookPosition(actualHtmlBook);
    window.bp = bookPosition;
    window.addEventListener('keyup', pageControl);
    finalizeBookTo = setTimeout(() => {
        bookPosition.calcPagination();
        updateFooter();
        if (initialPosition > 0) {
            bookPosition.goToPercent(initialPosition);
        }
        bookResizeObserver = new ResizeObserver(() => {
            bookPosition.handleDomChanges();
            updateFooter();
        });
        bookResizeObserver.observe(actualHtmlBook);
        finalizeBookTo = null;
    }, 20);
}

function handleFile(file) {
    processFile(file).then(saveFile).then(
        showParsedFile,
        e => {
            console.log(e);
            alert(e.message);
        }
    );
}

function memorizePosition(pos) {
    set('current-book-position', pos);
}

function showPercent(p) {
    progressBlock.style.setProperty('--percent', p + '%');
    document.getElementById('curPercent').innerText = p;
}

function updateFooter() {
    document.getElementById('totalPages').innerText =
        String(bookPosition?.getTotalPages() ?? 0);
    document.getElementById('curPage').innerText =
        String((bookPosition?.getCurrentPage()  ?? 0) + (bookPosition ? 1 : 0));
    const currentPercent = bookPosition?.getCurrentPercent() ?? 0;
    showPercent(currentPercent?.toFixed(1) ?? 0);
    memorizePosition(currentPercent);
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
