class BookPosition {
    bookSpreadSize = 0;
    gap = 20;
    /** @type {HTMLElement} */
    htmlBook = null;
    currentBookSpread = 0;
    totalPages = 0;
    bookSpreads = 0;
    columnsOnPage = 2;

    constructor(htmlBook, columnsOnPage = 2) {
        this.htmlBook = htmlBook;
        this.columnsOnPage = columnsOnPage || 2;
    }

    getCurrentPage() {
        return this.currentBookSpread * this.columnsOnPage;
    }

    getCurrentPercent() {
        return Math.min(
            100,
            this.getCurrentPage() / Math.max(1, this.getTotalPages() - 1) * 100
        );
    }

    getPagesPerSpread() {
        return this.columnsOnPage;
    }

    getTotalPages() {
        return this.totalPages;
    }

    updatePageDims() {
        this.bookSpreadSize = this.htmlBook.getBoundingClientRect().width;
        const gapFromStyle = parseInt(window.getComputedStyle(this.htmlBook).columnGap);
        if (gapFromStyle > 0) this.gap = gapFromStyle;
    }

    calcPagination() {
        this.updatePageDims();
        const rawBookSpreads = (this.htmlBook.scrollWidth + this.gap) / (this.bookSpreadSize + this.gap);
        this.totalPages = Math.ceil(rawBookSpreads * this.columnsOnPage);
        this.bookSpreads = Math.ceil(rawBookSpreads);
        this._applyBookSpreadLimits();
    }

    adjustScrollPosition() {
        this.htmlBook.scrollLeft = this.currentBookSpread * (this.bookSpreadSize + this.gap);
    }

    _applyBookSpreadLimits() {
        if (this.currentBookSpread > this.bookSpreads - 1) {
            this.currentBookSpread = this.bookSpreads - 1;
        }
        if (this.currentBookSpread < 0) {
            this.currentBookSpread = 0;
        }
    }

    goToPage(n) {
        if (n != null) {
            this.currentBookSpread = Math.floor(n / this.columnsOnPage);
            this._applyBookSpreadLimits();
        } else {
            this.calcPagination();
        }

        this.adjustScrollPosition();

        return this.currentBookSpread * this.columnsOnPage;
    }
}

export default BookPosition;
