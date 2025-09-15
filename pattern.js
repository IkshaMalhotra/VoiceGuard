document.addEventListener('DOMContentLoaded', () => {

    const PATTERN_KEY = 'voiceguard_pattern';
    const MIN_PATTERN_LENGTH = 4;

    const patternCanvas = document.getElementById('pattern-canvas');
    const enrollBtn = document.getElementById('enroll-pattern');
    const authBtn = document.getElementById('auth-pattern');
    const clearBtn = document.getElementById('clear-pattern');
    const patternResult = document.getElementById('pattern-auth-result');
    const usePatternBtn = document.getElementById('use-pattern');
    const useVoiceBtn = document.getElementById('use-voice');

    let pattern = [];
    let isDrawing = false;

    const DOTS = [];
    const DOT_RADIUS = 22;
    const GRID_SIZE = 3;
    const CANVAS_SIZE = 300;
    const DOT_SPACING = CANVAS_SIZE / (GRID_SIZE + 1);

    // Initialize dot positions
    for (let y = 1; y <= GRID_SIZE; y++) {
        for (let x = 1; x <= GRID_SIZE; x++) {
            DOTS.push({ x: x * DOT_SPACING, y: y * DOT_SPACING });
        }
    }

    // Draw the grid and lines
    function drawGrid(selected = []) {
        const ctx = patternCanvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Lines
        if (selected.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#1ecb7a';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            selected.forEach((idx, i) => {
                const dot = DOTS[idx];
                if (i === 0) ctx.moveTo(dot.x, dot.y);
                else ctx.lineTo(dot.x, dot.y);
            });
            ctx.stroke();
        }

        // Dots
        DOTS.forEach((dot, idx) => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = selected.includes(idx) ? '#1ecb7a' : '#222b3a';
            ctx.strokeStyle = '#3a4252';
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
        });
    }

    function getDotIndex(x, y) {
        for (let i = 0; i < DOTS.length; i++) {
            const dot = DOTS[i];
            if (Math.hypot(dot.x - x, dot.y - y) < DOT_RADIUS + 8) return i;
        }
        return null;
    }

    function getCanvasPos(e) {
        const rect = patternCanvas.getBoundingClientRect();
        let x, y;
        if (e.touches && e.touches.length) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        return { x, y };
    }

    function handlePointerDown(e) {
        e.preventDefault();
        isDrawing = true;
        pattern = [];
        patternResult.textContent = '';
        const pos = getCanvasPos(e);
        const idx = getDotIndex(pos.x, pos.y);
        if (idx !== null && !pattern.includes(idx)) {
            pattern.push(idx);
            drawGrid(pattern);
        }
    }

    function handlePointerMove(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getCanvasPos(e);
        const idx = getDotIndex(pos.x, pos.y);
        if (idx !== null && !pattern.includes(idx)) {
            pattern.push(idx);
            drawGrid(pattern);
        }
    }

    function handlePointerUp() {
        isDrawing = false;
    }

    function clearPattern() {
        pattern = [];
        drawGrid();
        patternResult.textContent = '';
        patternResult.className = '';
    }

    // ---- Enroll Pattern ----
    function enrollPattern() {
        if (pattern.length < MIN_PATTERN_LENGTH) {
            patternResult.textContent = 'Connect at least 4 dots';
            patternResult.className = 'fail';
            return;
        }
        localStorage.setItem(PATTERN_KEY, pattern.join('-'));
        patternResult.textContent = 'Pattern enrolled! You can now authenticate.';
        patternResult.className = 'success';
        // Do NOT clear pattern immediately; user can see it
    }

    // ---- Authenticate Pattern ----
    function authPattern() {
        const stored = localStorage.getItem(PATTERN_KEY);
        if (!stored) {
            patternResult.textContent = 'No pattern enrolled yet.';
            patternResult.className = 'fail';
            return;
        }
        if (pattern.length < MIN_PATTERN_LENGTH) {
            patternResult.textContent = 'Connect at least 4 dots';
            patternResult.className = 'fail';
            return;
        }
        const storedPattern = stored.split('-').map(Number);
        const match = arraysEqual(pattern, storedPattern);
        patternResult.textContent = match ? 'Authentication Successful!' : 'Try Again';
        patternResult.className = match ? 'success' : 'fail';
        // Clear pattern after authentication attempt
        pattern = [];
        drawGrid();
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => v === b[i]);
    }

    // ---- Event Listeners ----
    patternCanvas.addEventListener('mousedown', handlePointerDown);
    patternCanvas.addEventListener('mousemove', handlePointerMove);
    patternCanvas.addEventListener('mouseup', handlePointerUp);
    patternCanvas.addEventListener('mouseleave', handlePointerUp);
    patternCanvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    patternCanvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    patternCanvas.addEventListener('touchend', handlePointerUp);

    enrollBtn.addEventListener('click', enrollPattern);
    authBtn.addEventListener('click', authPattern);
    clearBtn.addEventListener('click', clearPattern);

    usePatternBtn.addEventListener('click', () => {
        document.getElementById('enrollment-section').style.display = 'none';
        document.getElementById('authentication-section').style.display = 'none';
        document.getElementById('pattern-section').style.display = '';
        usePatternBtn.style.display = 'none';
        useVoiceBtn.style.display = '';
        clearPattern();
    });

    useVoiceBtn.addEventListener('click', () => {
        document.getElementById('enrollment-section').style.display = '';
        document.getElementById('authentication-section').style.display = '';
        document.getElementById('pattern-section').style.display = 'none';
        usePatternBtn.style.display = '';
        useVoiceBtn.style.display = 'none';
        clearPattern();
    });

    drawGrid();

});
