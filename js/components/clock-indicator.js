const CLOCK_STYLES = `
:host {
    line-height: 35px;
    display: inline-block;
    pointer-events: none;
    font-size: 14px;
    padding-left: 15px;
    padding-right: 15px;
}
.nop {
    opacity: 1;
}
.op {
    opacity: 0;
}
`;

class ClockIndicator extends HTMLElement {
    constructor() {
        super();
        const style = document.createElement('style');
        const block = document.createElement('span');

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(block);
        style.textContent = CLOCK_STYLES;
    }

    _update() {
        const d = new Date();
        const c = d.getSeconds() % 2 === 0 ? 'op' : 'nop';
        this.shadowRoot.lastElementChild.innerHTML = (''+d.getHours()).padStart(2, '0') +
            `<span class="${c}">:</span>` +
            (''+d.getMinutes()).padStart(2, '0');
    }

    connectedCallback() {
        this._timer = setInterval(() => this._update(), 1000);
    }

    disconnectedCallback() {
        clearInterval(this._timer);
    }
}

customElements.define('clock-indicator', ClockIndicator);
