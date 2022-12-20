import BatteryIndicator from './battery-indicator.js';
import ClockIndicator from './clock-indicator.js';
import ThemeSelector from './theme-selector.js';
import FontSelector from './font-selector.js';

[
    ['battery-indicator', BatteryIndicator],
    ['clock-indicator', ClockIndicator],
    ['theme-selector', ThemeSelector],
    ['font-selector', FontSelector],
].forEach(([name, constr]) => customElements.define(name, constr));
