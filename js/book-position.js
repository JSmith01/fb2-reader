class BookPosition {
    /** @private */
    _bookSpreadSize = 0;

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

    _updatePageDims() {
        this._bookSpreadSize = this._htmlBook.getBoundingClientRect().width;
        const gapFromStyle = parseInt(window.getComputedStyle(this._htmlBook).columnGap);
        if (gapFromStyle > 0) this._gap = gapFromStyle;
    }

    calcPagination() {
        this._updatePageDims();
        const rawBookSpreads = (this._htmlBook.scrollWidth + this._gap) / (this._bookSpreadSize + this._gap);
        this._totalPages = Math.ceil(rawBookSpreads * this._pagesPerSpread);
        this._bookSpreads = Math.ceil(rawBookSpreads);
        this._applyBookSpreadLimits();
    }

    adjustScrollPosition() {
        this._htmlBook.scrollLeft = this._currentBookSpread * (this._bookSpreadSize + this._gap);
    }

    _applyBookSpreadLimits() {
        if (this._currentBookSpread > this._bookSpreads - 1) {
            this._currentBookSpread = this._bookSpreads - 1;
        }
        if (this._currentBookSpread < 0) {
            this._currentBookSpread = 0;
        }
    }

    goToPage(n) {
        if (n != null) {
            this._currentBookSpread = Math.floor(n / this._pagesPerSpread);
            this._applyBookSpreadLimits();
        } else {
            this.calcPagination();
        }

        this.adjustScrollPosition();

        return this.getCurrentPage();
    }

    goToPercent(p) {
        const k = Math.min(1, Math.max(0, p / 100));

        return this.goToPage((this._totalPages - 1) * k);
    }

    handleDomChanges() {
        const percent = this.getCurrentPercent();
        this.calcPagination();
        this.goToPercent(percent);
    }

    getCurrentPageFromScroll() {
        const curScrollPosition = this._htmlBook.scrollLeft;
        return Math.ceil(Math.max(0, (curScrollPosition - this._gap / 10)) / (this._bookSpreadSize + this._gap)) * this._pagesPerSpread;
    }

    goToLinkName(name) {
        const aEl = this._htmlBook.querySelector(`a[name=${name}]`);
        if (!aEl) return false;
        if (!aEl.innerText) {
            aEl.nextElementSibling.scrollIntoView();
        }
        else {
            aEl.scrollIntoView();
        }
        const newPage = this.getCurrentPageFromScroll();
        this.goToPage(newPage);
    }
}

export default BookPosition;
