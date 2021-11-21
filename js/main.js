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

const initialTheme = localStorage[LS_KEY_THEME] ?? THEME_OS;
const ACTIVE = 'active';
if (initialTheme !== THEME_OS) {
    if (initialTheme === THEME_LIGHT) {
        lightThemeBtn.classList.add(ACTIVE);
    } else {
        darkThemeBtn.classList.add(ACTIVE);
    }
}
lightThemeBtn.addEventListener('click', e => {
    absorb(e);
    const active = lightThemeBtn.classList.toggle(ACTIVE);
    if (active) {
        darkThemeBtn.classList.remove(ACTIVE);
        document.body.classList.add(THEME_LIGHT);
        localStorage.setItem(LS_KEY_THEME, THEME_LIGHT);
    } else {
        document.body.classList.remove(THEME_LIGHT);
        localStorage.setItem(LS_KEY_THEME, THEME_OS);
    }
    document.body.classList.remove(THEME_DARK);
});

darkThemeBtn.addEventListener('click', e => {
    absorb(e);
    const active = darkThemeBtn.classList.toggle(ACTIVE);
    if (active) {
        lightThemeBtn.classList.remove(ACTIVE);
        document.body.classList.add(THEME_DARK);
        localStorage.setItem(LS_KEY_THEME, THEME_DARK);
    } else {
        document.body.classList.remove(THEME_DARK);
        localStorage.setItem(LS_KEY_THEME, THEME_OS);
    }
    document.body.classList.remove(THEME_LIGHT);
});

function showBookInfo(meta) {
    topInfoTrigger.style.display = 'block';
    topInfoBlock.innerHTML = `
<div>Author${meta.authors.length > 1 ? 's' : ''}: ${meta.authors.join(', ')}</div>
<div>Title: ${meta.title}</div>
${meta.sequenceName ? `<div>Series: ${meta.sequenceName}, #${meta.sequenceNumber}</div>` : ''}
<div class="book-annotation">${meta.annotation.innerHTML}</div>`;
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

backLinkBtn.addEventListener('click', e => {
    absorb(e);
    if (!bookPosition || internalLinksPath.length === 0) return;
    const backRef = internalLinksPath.pop();
    if (backRef instanceof HTMLElement || typeof backRef === 'string') {
        bp.goToLinkName(backRef);
    } else if (typeof backRef === 'number') {
        bp.goToPercent(backRef);
    }
    updateFooter();
});

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

function handleFile(file) {
    processFile(file).then(([meta, htmlBook]) => {
        bookCleanup();
        showBookInfo(meta);
        bookEl.appendChild(htmlBook);
        htmlBook.addEventListener('click', handleInternalLinks, true);
        fEl.style.visibility = 'hidden';
        bookPosition = new BookPosition(htmlBook);
        window.bp = bookPosition;
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

bookEl.addEventListener('dragover', absorb);
bookEl.addEventListener('drop', e => {
    absorb(e);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

function showPercent(p) {
    progressBlock.style.setProperty('--percent', p + '%');
    document.getElementById('curPercent').innerText = p;
}

function updateFooter() {
    document.getElementById('totalPages').innerText =
        String(bookPosition?.getTotalPages() ?? 0);
    document.getElementById('curPage').innerText =
        String((bookPosition?.getCurrentPage()  ?? 0) + (bookPosition ? 1 : 0));
    showPercent(bookPosition?.getCurrentPercent().toFixed(1) ?? 0);
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
        case 'PageUp': return go(-1);
        case ' ':
        case 'PageDown': return go(1);
        case 'Home': return go(-Infinity);
        case 'End': return go(+Infinity);
    }
}
