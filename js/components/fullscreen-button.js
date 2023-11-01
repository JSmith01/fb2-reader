import { addListener } from './utils.js';

const ACTIVE = 'active';

const FULLSCREEN_BUTTON_STYLES = `
:host {
    display: inline-block;
}
.ui-btn-big {
    width: 30px;
    height: 30px;
    text-align: center;
    padding: 0;
    border-radius: 50%;
    line-height: 18px;
    vertical-align: top;
}

button.active {
    background: lightblue;
}
`;

export default class FullscreenButton extends HTMLElement {
    constructor() {
        super();

        const style = document.createElement('style');
        style.textContent = FULLSCREEN_BUTTON_STYLES;

        const block = document.createElement('div');
        block.className = 'fullscreen-button';

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(block);

        const btn = document.createElement('button');
        btn.textContent = '📺';
        btn.title = 'Fullscreen Mode'
        btn.className = 'ui-btn-big' + (document.fullscreenElement === null ? '': (' ' + ACTIVE));
        block.append(btn);

        if (!document.fullscreenEnabled) {
            btn.disabled = true;
            return;
        }

        document.addEventListener('fullscreenchange', () => {
            btn.className = 'ui-btn-big' + (document.fullscreenElement === null ? '': (' ' + ACTIVE));
        });

        let requestPromise;

        addListener(btn, () => {
            if (requestPromise) return;

            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                requestPromise = document.querySelector('body')
                    .requestFullscreen({ navigationUI: 'hide' }).finally(() => {
                        requestPromise = null;
                    });
            }
        });
    }
}
