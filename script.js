const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const timerDisplay = document.querySelector('.timer');
const highScoreBoard = document.querySelector('.high-score');
const moles = document.querySelectorAll('.mole');
const countdownOverlay = document.getElementById('countdown');
const countdownText = document.querySelector('.countdown-text');
const gameOverOverlay = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const decreaseTimeBtn = document.getElementById('decrease-time');
const increaseTimeBtn = document.getElementById('increase-time');
const durationValue = document.getElementById('duration-value');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const playAgainBtn = document.querySelector('.play-again-btn');
const closeModalBtn = document.querySelector('.close-modal-btn');

const difficultySettings = {
    easy: { duration: 15, minPeep: 650, maxPeep: 1250 },
    normal: { duration: 10, minPeep: 400, maxPeep: 950 },
    hard: { duration: 7, minPeep: 230, maxPeep: 650 }
};

let lastHole;
let timeUp = true;
let isPaused = false;
let score = 0;
let selectedDifficulty = 'easy';
let selectedDuration = difficultySettings[selectedDifficulty].duration;
let timeLeft = selectedDuration;
let timer;
let peepTimeout;
let countdownInterval;
let highScore = localStorage.getItem('whackAMoleHighScore') || 0;
let isStarting = false;

highScoreBoard.textContent = highScore;
timerDisplay.textContent = selectedDuration;
durationValue.textContent = selectedDuration;

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    if (timeUp || isPaused) return;

    const { minPeep, maxPeep } = difficultySettings[selectedDifficulty];
    const time = randomTime(minPeep, maxPeep);
    const hole = randomHole(holes);
    hole.classList.add('up');
    peepTimeout = setTimeout(() => {
        hole.classList.remove('up');
        if (!timeUp) peep();
    }, time);
}

function startGame() {
    if (isStarting) return;

    isStarting = true;
    gameOverOverlay.style.display = 'none';
    gameOverOverlay.setAttribute('aria-hidden', 'true');
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    restartBtn.disabled = false;
    setSettingsDisabled(true);
    pauseBtn.textContent = 'Pause';
    
    countdownOverlay.style.display = 'flex';
    countdownOverlay.setAttribute('aria-hidden', 'false');
    let count = 3;
    countdownText.textContent = count;
    
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else if (count === 0) {
            countdownText.textContent = 'GO!';
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.style.display = 'none';
            countdownOverlay.setAttribute('aria-hidden', 'true');
            beginGame();
        }
    }, 800);
}

function beginGame() {
    resetGame();
    isStarting = false;
    timeUp = false;
    isPaused = false;
    pauseBtn.disabled = false;
    peep();
    
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function resetGame() {
    score = 0;
    timeLeft = selectedDuration;
    scoreBoard.textContent = 0;
    timerDisplay.textContent = timeLeft;
    clearInterval(timer);
    clearInterval(countdownInterval);
    clearTimeout(peepTimeout);
    holes.forEach(hole => hole.classList.remove('up'));
    moles.forEach(mole => mole.classList.remove('hit'));
}

function endGame() {
    timeUp = true;
    isPaused = false;
    clearInterval(timer);
    clearInterval(countdownInterval);
    clearTimeout(peepTimeout);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    restartBtn.disabled = true;
    setSettingsDisabled(false);
    pauseBtn.textContent = 'Pause';
    showGameOver();
}

function pauseGame() {
    if (timeUp || isStarting) return;

    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';

    if (isPaused) {
        clearInterval(timer);
        clearTimeout(peepTimeout);
        holes.forEach(hole => hole.classList.remove('up'));
        return;
    }

    peep();
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function restartGame() {
    clearInterval(timer);
    clearInterval(countdownInterval);
    clearTimeout(peepTimeout);
    timeUp = true;
    isPaused = false;
    isStarting = false;
    pauseBtn.textContent = 'Pause';
    startGame();
}

function showGameOver() {
    finalScoreDisplay.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreBoard.textContent = highScore;
        localStorage.setItem('whackAMoleHighScore', highScore);
    }
    gameOverOverlay.style.display = 'flex';
    gameOverOverlay.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    gameOverOverlay.style.display = 'none';
    gameOverOverlay.setAttribute('aria-hidden', 'true');
}

function setSettingsDisabled(disabled) {
    difficultyBtns.forEach(button => {
        button.disabled = disabled;
    });
    decreaseTimeBtn.disabled = disabled || selectedDuration <= 5;
    increaseTimeBtn.disabled = disabled || selectedDuration >= 30;
}

function updateDurationDisplay() {
    durationValue.textContent = selectedDuration;
    if (timeUp && !isStarting) {
        timeLeft = selectedDuration;
        timerDisplay.textContent = selectedDuration;
    }
    setSettingsDisabled(false);
}

function setDifficulty(difficulty) {
    if (isStarting || !timeUp) return;

    selectedDifficulty = difficulty;
    selectedDuration = difficultySettings[difficulty].duration;
    difficultyBtns.forEach(button => {
        button.classList.toggle('is-active', button.dataset.difficulty === difficulty);
    });
    updateDurationDisplay();
}

function changeDuration(amount) {
    if (isStarting || !timeUp) return;

    selectedDuration = Math.min(30, Math.max(5, selectedDuration + amount));
    updateDurationDisplay();
}

function showHitScore(hole) {
    const pop = document.createElement('span');
    pop.className = 'hit-pop';
    pop.textContent = '+1';
    hole.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove(), { once: true });
}

function bonk(e) {
    if (!e.isTrusted) return; // cheater!
    if (isPaused || timeUp) return;
    
    if (this.parentNode.classList.contains('up')) {
        score++;
        this.parentNode.classList.remove('up');
        this.classList.add('hit');
        showHitScore(this.parentNode);
        scoreBoard.textContent = score;
        setTimeout(() => this.classList.remove('hit'), 180);
        
        // Screen shake juice
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 200);
    }
}

moles.forEach(mole => mole.addEventListener('click', bonk));
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', startGame);
closeModalBtn.addEventListener('click', closeModal);
decreaseTimeBtn.addEventListener('click', () => changeDuration(-1));
increaseTimeBtn.addEventListener('click', () => changeDuration(1));
difficultyBtns.forEach(button => {
    button.addEventListener('click', () => setDifficulty(button.dataset.difficulty));
});
