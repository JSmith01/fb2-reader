import BatteryIndicator from './battery-indicator.js';
import ClockIndicator from './clock-indicator.js';
import ThemeSelector from './theme-selector.js';
import FontSelector from './font-selector.js';
import FullscreenButton from './fullscreen-button.js';

[
    ['battery-indicator', BatteryIndicator],
    ['clock-indicator', ClockIndicator],
    ['theme-selector', ThemeSelector],
    ['font-selector', FontSelector],
    ['fullscreen-button', FullscreenButton],
].forEach(([name, constr]) => customElements.define(name, constr));
