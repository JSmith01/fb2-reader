const MIN_SWIPE_FRACTION = 10;

/**
 * Tries to recognize a swipe
 * @param {HTMLElement} el
 * @param {(swipe: 'left' | 'right') => void} swipeCb
 * @returns {() => void} cleanup function
 */
export function getSwipe(el, swipeCb) {
    /**
     * @param {TouchEvent} e
     */
    function swipeRecognition(e) {
        el.addEventListener('touchmove', move);
        el.addEventListener('touchend', finish);
        el.addEventListener('touchcancel', cleanup);
        const { clientX: startX, clientY: startY } = e.touches[0];
        const { innerWidth, innerHeight } = e.view;
        const minSwipe = Math.min(innerWidth, innerHeight) / MIN_SWIPE_FRACTION;
        let clientX, clientY;

        function move(e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        function finish(e) {
            cleanup();
            const dx = clientX - startX;
            const dy = clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dy) < minSwipe && Math.abs(dx) > minSwipe) {
                // horizontal swipe
                e.preventDefault();
                if (dx < 0) {
                    swipeCb('right');
                } else {
                    swipeCb('left');
                }
            }
        }

        function cleanup() {
            el.removeEventListener('touchmove', move);
            el.removeEventListener('touchend', finish);
            el.removeEventListener('touchcancel', cleanup);
        }
    }

    el.addEventListener('touchstart', swipeRecognition);

    return () => el.removeEventListener('touchstart', swipeRecognition);
}
