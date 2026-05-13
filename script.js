const arena = document.getElementById('arena');
const target = document.getElementById('target');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const timeEl = document.getElementById('time');
const hitsEl = document.getElementById('hits');
const comboEl = document.getElementById('combo');
const accEl = document.getElementById('accuracy');
const statusEl = document.getElementById('status');
const toast = document.getElementById('toast');
const overlay = document.getElementById('overlay');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const timeInput = document.getElementById('timeInput');
const restartBtn = document.getElementById('restartBtn');
const overlayStart = document.getElementById('overlayStart');

const BEST_KEY = 'neon_reflex_best';
let best = Number(localStorage.getItem(BEST_KEY) || 0);
bestEl.textContent = best;

let score = 0;
let hits = 0;
let misses = 0;
let combo = 0;
let timeLeft = 30;
let running = false;
let paused = false;
let timerId = null;
let moveId = null;
let escapePenaltyId = null;
let currentHitWindow = true;

function setStatus(text) {
    statusEl.textContent = text;
}

function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 1100);
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function updateAccuracy() {
    const total = hits + misses;
    const accuracy = total === 0 ? 100 : Math.max(0, Math.round((hits / total) * 100));
    accEl.textContent = `${accuracy}%`;
}

function updateHud() {
    scoreEl.textContent = score;
    hitsEl.textContent = hits;
    comboEl.textContent = `x${combo}`;
    timeEl.textContent = timeLeft;
    if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem(BEST_KEY, String(best));
    }
    updateAccuracy();
}

function placeTarget() {
    const rect = arena.getBoundingClientRect();
    const pad = 52;
    const x = rand(pad, Math.max(pad, rect.width - pad));
    const y = rand(pad, Math.max(pad, rect.height - pad));
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    target.classList.add('visible');
    currentHitWindow = true;

    clearTimeout(escapePenaltyId);
    escapePenaltyId = setTimeout(() => {
    if (!running || paused) return;
    if (currentHitWindow) {
        misses += 1;
        combo = 0;
        updateHud();
        arena.classList.add('shake');
        setTimeout(() => arena.classList.remove('shake'), 180);
        showToast('Missed one');
    }
    placeTarget();
    }, Math.max(700, 1600 - score * 18));
}

function startGame() {

    if (running && !paused) return;
    if (!running) {
    score = 0;
    hits = 0;
    misses = 0;
    combo = 0;
    timeLeft = clampTime();
    updateHud();
    placeTarget();
    }
    running = true;
    paused = false;
    overlay.classList.add('hidden');
    setStatus('Playing');
    startBtn.textContent = 'Running';

    clearInterval(timerId);
    timerId = setInterval(() => {
    if (!running || paused) return;
    timeLeft -= 1;
    updateHud();

    if (timeLeft <= 0) {
        endGame();
    }
    }, 1000);
}

function pauseGame() {
    if (!running) return;
    paused = !paused;
    setStatus(paused ? 'Paused' : 'Playing');
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) placeTarget();
}
function restartGame() {
    clearInterval(timerId);
    clearTimeout(escapePenaltyId);

    running = false;
    paused = false;
    pauseBtn.textContent = 'Pause';
    startBtn.textContent = 'Start Game';

    score = 0;
    hits = 0;
    misses = 0;
    combo = 0;
    timeLeft = clampTime();

    target.classList.remove('visible');
    overlay.classList.add('hidden');
    setStatus('Ready');
    updateHud();
}

function endGame() {
    running = false;
    paused = false;
    clearInterval(timerId);
    clearTimeout(escapePenaltyId);
    target.classList.remove('visible');
    setStatus('Game Over');
    startBtn.textContent = 'Start Again';
    overlay.classList.remove('hidden');
    overlay.querySelector('h3').textContent = 'Game Over';
    overlay.querySelector('p').textContent = `Final score: ${score}. Chase the target again and beat your best.`;
    overlayStart.textContent = 'Play Again';
}

target.addEventListener('click', () => {
    if (!running || paused) return;
    currentHitWindow = false;
    score += 10 + Math.min(20, combo * 2);
    hits += 1;
    combo += 1;
    updateHud();
    showToast(`+${10 + Math.min(20, combo * 2)} points`);
    placeTarget();
});

startBtn.addEventListener('click', () => {
    if (!running && timeLeft <= 0) restartGame();
    else startGame();
});

pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
overlayStart.addEventListener('click', () => {
    overlay.querySelector('h3').textContent = 'Neon Reflex';
    overlay.querySelector('p').textContent = 'A quick reaction game built in a premium neon style. Press start and chase the best score.';
    overlayStart.textContent = 'Start Game';
    startGame();
});

window.addEventListener('resize', () => {
    if (running && !paused) placeTarget();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();

        if (!running) startGame();
        else pauseGame();
    }

    if (e.key.toLowerCase() === 'r') {
        restartGame();
    }
});

function clampTime() {
  const value = Number(timeInput.value);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

document.getElementById('minus30').onclick = () => {
  timeInput.value = Math.max(1, clampTime() - 30);
};

document.getElementById('minus1').onclick = () => {
  timeInput.value = Math.max(1, clampTime() - 1);
};

document.getElementById('plus1').onclick = () => {
  timeInput.value = clampTime() + 1;
};

document.getElementById('plus30').onclick = () => {
  timeInput.value = clampTime() + 30;
};

updateHud();
