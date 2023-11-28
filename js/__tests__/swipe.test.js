import { getSwipe } from '../swipe.js';

describe('getSwipe', () => {
    let el;
    let swipeCb;

    beforeEach(() => {
        swipeCb = jest.fn();
        el = document.createElement('div');
    });

    test('should invoke swipeCb with "left" on a left swipe', () => {
        const cleanup = getSwipe(el, swipeCb);

        el.dispatchEvent(new TouchEvent('touchstart', {
            touches: [{ clientX: 100, clientY: 100 }],
            view: window,
        }));
        el.dispatchEvent(new TouchEvent('touchmove', {
            touches: [{ clientX: 190, clientY: 100 }],
        }));
        el.dispatchEvent(new TouchEvent('touchend'));

        expect(swipeCb).toHaveBeenCalledWith('left');

        cleanup();
    });

    test('should invoke swipeCb with "right" on a right swipe', () => {
        const cleanup = getSwipe(el, swipeCb);

        el.dispatchEvent(new TouchEvent('touchstart', {
            touches: [{ clientX: 100, clientY: 100 }],
            view: window,
        }));
        el.dispatchEvent(new TouchEvent('touchmove', {
            touches: [{ clientX: 10, clientY: 100 }],
        }));
        el.dispatchEvent(new TouchEvent('touchend'));

        expect(swipeCb).toHaveBeenCalledWith('right');

        cleanup();
    });
});
