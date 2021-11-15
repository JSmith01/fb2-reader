const toInterval = (a, b, x) => Math.min(b, Math.max(a, x));
const toIntervalCurried = (a, b) => x => toInterval(a, b, x);
const limitPercent = toIntervalCurried(0, 100);

class BookPosition {
    /** @private */
    _bookSpreadSize = 0;

    /** @private */
    _bookSpreadLeftPos = 0;

    /** @private */
    _gap = 20;

    /**
     * @type {HTMLElement}
     * @private
     */
    _htmlBook = null;

    /** @private */
    _currentBookSpread = 0;

    /** @private */
    _totalPages = 0;

    /** @private */
    _bookSpreads = 0;

    /** @private */
    _pagesPerSpread = 2;

    constructor(htmlBook, pagesPerSpread = 2) {
        this._htmlBook = htmlBook;
        this._pagesPerSpread = pagesPerSpread || 2;
    }

    getCurrentPage() {
        return this._currentBookSpread * this._pagesPerSpread;
    }

    getCurrentPercent() {
        return this._currentBookSpread / (this._bookSpreads - 1) * 100;
    }

    getPagesPerSpread() {
        return this._pagesPerSpread;
    }

    getTotalPages() {
        return this._totalPages;
    }

    get _fullSpreadSize() {
        return this._bookSpreadSize + this._gap;
    }

    _updatePageDims() {
        const boundingRect = this._htmlBook.getBoundingClientRect();
        this._bookSpreadSize = boundingRect.width;
        this._bookSpreadLeftPos = boundingRect.left;
        const gapFromStyle = parseInt(window.getComputedStyle(this._htmlBook).columnGap);
        if (gapFromStyle > 0) this._gap = gapFromStyle;
    }

    calcPagination() {
        this._updatePageDims();
        const rawBookSpreads = (this._htmlBook.scrollWidth + this._gap) / this._fullSpreadSize;
        this._totalPages = Math.ceil(rawBookSpreads * this._pagesPerSpread);
        this._bookSpreads = Math.ceil(rawBookSpreads);
        this._applyBookSpreadLimits();
    }

    _adjustScrollPosition() {
        this._htmlBook.scrollLeft = this._currentBookSpread * this._fullSpreadSize;
    }

    _applyBookSpreadLimits() {
        this._currentBookSpread = toInterval(0, this._bookSpreads - 1, this._currentBookSpread);
    }

    /**
     * @param {number} [n] page numbering 0 .. (totalPages - 1)
     * @return {number}
     */
    goToPage(n) {
        if (n != null) {
            this._currentBookSpread = Math.floor(n / this._pagesPerSpread);
            this._applyBookSpreadLimits();
        } else {
            this.calcPagination();
        }

        this._adjustScrollPosition();

        return this.getCurrentPage();
    }

    goToPercent(p) {
        const k = limitPercent(p) / 100;

        return this.goToPage(Math.floor((this._totalPages - 1) * k));
    }

    handleDomChanges() {
        const percent = this.getCurrentPercent();
        this.calcPagination();
        this.goToPercent(percent);
    }

    _getElementLeftPosition(el) {
        const elLeft = el.getBoundingClientRect().left;

        return elLeft - this._bookSpreadLeftPos + this._htmlBook.scrollLeft;
    }

    goToLinkName(name) {
        const aEl = name instanceof HTMLElement ? name : this._htmlBook.querySelector(`a[name=${name}]`);
        if (!aEl) return false;
        const actualElement = aEl.innerText ? aEl : aEl.nextElementSibling;
        actualElement.scrollIntoView();
        const spread = Math.floor(this._getElementLeftPosition(actualElement) / this._fullSpreadSize);
        this.goToPage(spread * this._pagesPerSpread);

        return true;
    }
}

export default BookPosition;
