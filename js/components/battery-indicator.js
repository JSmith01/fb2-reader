const BATTERY_INDICATOR_STYLES = `
:host {
    line-height: 35px;
    display: inline-block;
    pointer-events: none;
    font-size: 14px;
}
`;

export default class BatteryIndicator extends HTMLElement {
    constructor() {
        super();
        const style = document.createElement('style');
        const block = document.createElement('span');

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(block);
        style.textContent = BATTERY_INDICATOR_STYLES;
    }

    connectedCallback() {
        if (!'getBattery' in navigator || typeof navigator.getBattery !== 'function') return;

        this._batteryPromise = navigator.getBattery().then(batteryManager => {
            this._batteryManager = batteryManager;
            batteryManager.onlevelchange = this.updateContent;
            batteryManager.onchargingchange = this.updateContent;
            this.updateContent();
            document.addEventListener('visibilitychange', this.updateContent);
        });
    }

    updateContent = () => {
        if (!this._batteryManager || document.hidden) return;

        const { charging, level } = this._batteryManager;
        this.shadowRoot.lastChild.innerText =
            (charging ? '🔌' : '🔋') + ' ' + Math.round(level * 100) + '%';
    }

    disconnectedCallback() {
        if (!this._batteryPromise) return;

        this._batteryPromise.then(() => {
            if (!this._batteryManager) return;
            this._batteryManager.onlevelchange = null;
            this._batteryManager.onchargingchange = null;
            this._batteryManager = null;
            this._batteryPromise = null;
            document.removeEventListener('visibilitychange', this.updateContent);
        });
    }
}
