import { addListener } from './utils.js';

const LS_KEY_FONT = 'font-size'
const PROP_FONT_SIZE = '--base-font';

const initialFontSize = parseInt(document.documentElement.style.getPropertyValue(PROP_FONT_SIZE));
let currentFontSize = parseInt(localStorage.getItem(LS_KEY_FONT) ?? initialFontSize);

const setFontSize = value => {
    document.documentElement.style.setProperty(PROP_FONT_SIZE, value + 'px');
    currentFontSize = value;
    localStorage.setItem(LS_KEY_FONT, value);
}

if (currentFontSize !== initialFontSize)  {
    setFontSize(currentFontSize);
}

const FONT_SELECTOR_STYLES = `
:host {
    display: inline-block;
}
div.font-selector {
    line-height: 30px;
    height: 30px;
}
button {
    width: 30px;
    height: 30px;
    text-align: center;
    padding: 0;
    border-radius: 0;
    line-height: 18px;
    vertical-align: top;
}
button:first-child {
    border-radius: 50% 0 0 50%;
}
button:last-child {
    border-radius: 0 50% 50% 0;
}
`;

export default class FontSelector extends HTMLElement {
    constructor() {
        super();
        const style = document.createElement('style');
        const block = document.createElement('div');
        block.className = 'font-selector';

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(block);
        style.textContent = FONT_SELECTOR_STYLES;

        const btnSmaller = document.createElement('button');
        btnSmaller.textContent = '-a';
        btnSmaller.title = 'Decrease Font Size (smaller font)'

        const btnReset = document.createElement('button');
        btnReset.textContent = '∅';
        btnReset.title = 'Reset Font Size to Initial';

        const btnLarger = document.createElement('button');
        btnLarger.textContent = 'A+';
        btnLarger.title = 'Increase Font Size (larger font)';

        block.append(btnSmaller, btnReset, btnLarger);

        addListener(btnSmaller,() => setFontSize(Math.max(8, currentFontSize - 2)));
        addListener(btnReset,() => setFontSize(initialFontSize));
        addListener(btnLarger,() => setFontSize(Math.min(40, currentFontSize + 2)));
    }
}
