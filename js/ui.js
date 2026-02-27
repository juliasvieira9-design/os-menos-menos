export const WindowManager = {
    init() {
        document.querySelectorAll('.draggable, .window').forEach(win => {
            const header = win.querySelector('.window-header');
            if (!header) return;
            header.onmousedown = (e) => {
                let shiftX = e.clientX - win.getBoundingClientRect().left;
                let shiftY = e.clientY - win.getBoundingClientRect().top;
                win.style.position = 'absolute';
                win.style.zIndex = 1000;
                const moveAt = (x, y) => {
                    win.style.left = x - shiftX + 'px';
                    win.style.top = y - shiftY + 'px';
                };
                const onMouseMove = (e) => moveAt(e.pageX, e.pageY);
                document.addEventListener('mousemove', onMouseMove);
                document.onmouseup = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.onmouseup = null;
                };
            };
        });
    }
};