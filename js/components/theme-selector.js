const LS_KEY_THEME = 'theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const THEME_OS = '';

let themeActive = localStorage.getItem(LS_KEY_THEME) ?? THEME_OS;

const setThemeActive = valOrCb => {
    themeActive = typeof valOrCb === 'function' ? valOrCb(themeActive) : valOrCb;
    localStorage.setItem(LS_KEY_THEME, themeActive);
    syncThemeUi();

    return themeActive;
}

syncThemeUi();

const ACTIVE = 'active';

function syncThemeUi() {
    switch (themeActive) {
        case THEME_OS: {
            document.body.classList.remove(THEME_LIGHT);
            document.body.classList.remove(THEME_DARK);
            break;
        }
        case THEME_LIGHT: {
            document.body.classList.add(THEME_LIGHT);
            document.body.classList.remove(THEME_DARK);
            break;
        }
        case THEME_DARK: {
            document.body.classList.remove(THEME_LIGHT);
            document.body.classList.add(THEME_DARK);
            break;
        }
    }
}

const THEME_SELECTOR_STYLES = `
.ui-btn-big {
    width: 30px;
    height: 30px;
    text-align: center;
    padding: 0;
    border-radius: 50%;
    line-height: 18px;
}

button.active {
    background: lightblue;
}
`;

class ThemeSelector extends HTMLElement {
    constructor(props) {
        super(props);
        const style = document.createElement('style');
        const block = document.createElement('div');
        block.className = 'theme-selector';

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(block);
        style.textContent = THEME_SELECTOR_STYLES;

        const btnLight = document.createElement('button');
        btnLight.textContent = '☀';
        btnLight.title = 'light theme'
        btnLight.className = 'ui-btn-big' + (themeActive === THEME_LIGHT ? (' ' + ACTIVE) : '');

        const btnDark = document.createElement('button');
        btnDark.textContent = '🌙';
        btnDark.title = 'dark theme';
        btnDark.className = 'ui-btn-big' + (themeActive === THEME_DARK ? (' ' + ACTIVE) : '');
        block.append(btnLight, btnDark);

        function syncButtons(theme) {
            btnLight.classList[theme === THEME_LIGHT ? 'add' : 'remove'](ACTIVE);
            btnDark.classList[theme === THEME_DARK ? 'add' : 'remove'](ACTIVE);
        }

        btnLight.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const theme = setThemeActive(themeActive => themeActive === THEME_LIGHT ? THEME_OS : THEME_LIGHT);
            syncButtons(theme);
        });

        btnDark.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const theme = setThemeActive(themeActive => themeActive === THEME_DARK ? THEME_OS : THEME_DARK);
            syncButtons(theme);
        });
    }
}

customElements.define('theme-selector', ThemeSelector);
