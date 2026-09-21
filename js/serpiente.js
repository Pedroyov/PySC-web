import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID = "serpiente";

/*
 * Este juego no tiene "vidas" reales (tocar una pared o tu
 * propia cola termina la partida al instante), pero la función
 * de ranking espera un valor de "lives" para reutilizar
 * exactamente el mismo índice de Firestore que ya usa Trivia
 * Cultural. Usamos un valor constante.
 */
const RANKING_LIVES = 3;

const COLS = 16;
const ROWS = 16;

const TARGET_SCORE = 300;
const BALL_POINTS = 10;
const TROPHY_POINTS = 50;

const BALLS_PER_TROPHY = 4;
const TROPHY_LIFESPAN_MS = 6000;

const TICK_START_MS = 220;
const TICK_MIN_MS = 95;
const TICK_STEP_MS = 12;
const SPEED_STEP_SECONDS = 12;

const DIRECTIONS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};

function isOpposite(a, b) {
    return a.dx === -b.dx && a.dy === -b.dy;
}

function cellsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}

function isOutOfBounds(pos, cols, rows) {
    return pos.x < 0 || pos.y < 0 || pos.x >= cols || pos.y >= rows;
}

function getNextHeadPosition(head, dir) {
    return { x: head.x + dir.dx, y: head.y + dir.dy };
}

function isSelfCollision(pos, snake, willGrow) {

    const bodyToCheck =
        willGrow ? snake : snake.slice(0, snake.length - 1);

    return bodyToCheck.some((segment) => cellsEqual(segment, pos));

}

function computeLevel(elapsedSeconds) {

    return 1 + Math.floor(elapsedSeconds / SPEED_STEP_SECONDS);

}

function computeTickInterval(level) {

    const interval = TICK_START_MS - (level - 1) * TICK_STEP_MS;

    return Math.max(TICK_MIN_MS, interval);

}

function findRandomEmptyCell(cols, rows, occupiedCells) {

    const occupiedSet = new Set(
        occupiedCells.map((cell) => `${cell.x},${cell.y}`)
    );

    const emptyCells = [];

    for (let y = 0; y < rows; y++) {

        for (let x = 0; x < cols; x++) {

            if (!occupiedSet.has(`${x},${y}`)) {
                emptyCells.push({ x, y });
            }

        }

    }

    if (emptyCells.length === 0) {
        return null;
    }

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];

}

/* ==================================================
   JUEGO
================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const secretRoomUnlocked =
        localStorage.getItem("secretRoomUnlocked") === "true";

    if (!secretRoomUnlocked) {
        window.location.replace("../index.html");
        return;
    }

    const gameStage = document.getElementById("snakeGameStage");
    const startButton = document.getElementById("snakeStartButton");
    const resetButton = document.getElementById("snakeResetButton");
    const countdown = document.getElementById("loveCountdown");
    const countdownText = document.getElementById("loveCountdownText");

    const boardWrap = document.getElementById("snakeBoardWrap");
    const board = document.getElementById("snakeBoard");
    const controls = document.getElementById("snakeControls");

    const levelElement = document.getElementById("snakeLevel");
    const scoreElement = document.getElementById("snakeScore");
    const timeElement = document.getElementById("snakeTime");
    const scoreAnimation = document.getElementById("scoreAnimation");

    const resultModal = document.getElementById("loveUnlockModal");
    const resultIcon = document.getElementById("loveUnlockIcon");
    const resultLabel = document.getElementById("loveUnlockLabel");
    const resultTitle = document.getElementById("loveUnlockTitle");
    const resultText = document.getElementById("loveUnlockText");
    const resultButtonText = document.getElementById("loveUnlockButtonText");
    const resultButton = document.getElementById("loveUnlockButton");

    const rankingModal = document.getElementById("rankingModal");
    const rankingModalTitle = document.getElementById("rankingModalTitle");
    const rankingModalText = document.getElementById("rankingModalText");
    const rankingModalScore = document.getElementById("rankingModalScore");
    const rankingNameGroup = document.getElementById("rankingNameGroup");
    const rankingPlayerName = document.getElementById("rankingPlayerName");
    const rankingNameError = document.getElementById("rankingNameError");
    const rankingSaveButton = document.getElementById("rankingSaveButton");

    const leaderboardModal = document.getElementById("leaderboardModal");
    const leaderboardList = document.getElementById("leaderboardList");
    const leaderboardLoading = document.getElementById("leaderboardLoading");
    const leaderboardEmpty = document.getElementById("leaderboardEmpty");
    const leaderboardOpenButton = document.getElementById("leaderboardOpenButton");
    const leaderboardCloseButton = document.getElementById("leaderboardCloseButton");

    const victorySound = new Audio("../audio/victory.mp3");
    const successSound = new Audio("../audio/success.mp3");
    const defeatSound = new Audio("../audio/gameover.mp3");
    const startSound = new Audio("../audio/start.mp3");

    if (
        !gameStage || !startButton || !resetButton || !countdown ||
        !countdownText || !boardWrap || !board || !controls ||
        !levelElement || !scoreElement || !timeElement || !scoreAnimation ||
        !resultModal || !resultIcon || !resultLabel || !resultTitle ||
        !resultText || !resultButtonText || !resultButton ||
        !rankingModal || !rankingModalTitle || !rankingModalText ||
        !rankingModalScore || !rankingNameGroup || !rankingPlayerName ||
        !rankingNameError || !rankingSaveButton ||
        !leaderboardModal || !leaderboardList || !leaderboardLoading ||
        !leaderboardEmpty || !leaderboardOpenButton || !leaderboardCloseButton
    ) {

        console.error(
            "No se encontraron todos los elementos necesarios de Serpiente."
        );

        throw new Error(
            "Faltan elementos HTML de Serpiente."
        );

    }

    let gameStarted = false;
    let passed = false;

    let snake = [];
    let direction = DIRECTIONS.right;
    let pendingDirection = DIRECTIONS.right;

    let food = null;
    let ballsEatenSinceTrophy = 0;
    let trophyTimeoutId = null;

    let score = 0;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;

    let tickTimeoutId = null;

    let pendingRankingResult = null;

    const cellElements = [];
    let segmentElements = [];
    let foodElement = null;

    startButton.addEventListener("click", startCountdown);
    resetButton.addEventListener("click", restartGame);

    resultButton.addEventListener("click", () => {

        hideModal(resultModal);

        if (!passed) {
            restartGame();
        }

    });

    controls.querySelectorAll(".snake-dpad-button").forEach((button) => {

        button.addEventListener("click", () => {

            const directionName = button.dataset.direction;
            const dir = DIRECTIONS[directionName];

            if (dir) {
                queueDirection(dir);
            }

        });

    });

    window.addEventListener("keydown", (event) => {

        if (!gameStarted) {
            return;
        }

        let dir = null;

        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
            dir = DIRECTIONS.up;
        } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
            dir = DIRECTIONS.down;
        } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
            dir = DIRECTIONS.left;
        } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
            dir = DIRECTIONS.right;
        }

        if (dir) {
            event.preventDefault();
            queueDirection(dir);
        }

    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    board.addEventListener("touchstart", (event) => {

        if (!event.touches.length) {
            return;
        }

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchActive = true;

    }, { passive: true });

    board.addEventListener("touchend", (event) => {

        if (!touchActive) {
            return;
        }

        touchActive = false;

        const touch = event.changedTouches[0];

        if (!touch) {
            return;
        }

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        const SWIPE_THRESHOLD = 20;

        if (
            Math.abs(deltaX) < SWIPE_THRESHOLD &&
            Math.abs(deltaY) < SWIPE_THRESHOLD
        ) {
            return;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            queueDirection(deltaX > 0 ? DIRECTIONS.right : DIRECTIONS.left);
        } else {
            queueDirection(deltaY > 0 ? DIRECTIONS.down : DIRECTIONS.up);
        }

    }, { passive: true });

    rankingSaveButton.addEventListener("click", async () => {

        if (!pendingRankingResult) {
            return;
        }

        let playerName = pendingRankingResult.playerName;

        if (
            pendingRankingResult.qualifiesTop10 &&
            !pendingRankingResult.hasName
        ) {

            playerName = rankingPlayerName.value.trim();

            if (playerName.length < 2) {

                rankingNameError.textContent =
                    "Escribe al menos 2 caracteres.";

                rankingPlayerName.focus();

                return;

            }

        }

        rankingSaveButton.disabled = true;

        try {

            await saveBestTriviaResult(
                GAME_ID,
                pendingRankingResult.score,
                0,
                pendingRankingResult.time,
                pendingRankingResult.lives,
                playerName
            );

            hideModal(rankingModal);

            setTimeout(() => {
                showModal(resultModal);
            }, 350);

            pendingRankingResult = null;

        } catch (error) {

            console.error("No se pudo guardar el récord:", error);

            rankingNameError.textContent =
                "No se pudo guardar. Inténtalo nuevamente.";

        } finally {

            rankingSaveButton.disabled = false;

        }

    });

    leaderboardOpenButton.addEventListener("click", openLeaderboard);

    leaderboardCloseButton.addEventListener("click", () => {
        hideModal(leaderboardModal);
    });

    function queueDirection(dir) {

        if (!gameStarted) {
            return;
        }

        if (isOpposite(dir, direction)) {
            return;
        }

        pendingDirection = dir;

    }

    function showCountdownStep(text, isFinal) {

        countdownText.classList.remove("is-changing", "is-final");

        void countdownText.offsetWidth;

        countdownText.textContent = text;

        countdownText.classList.add("is-changing");

        if (isFinal) {
            countdownText.classList.add("is-final");
        }

    }

    function startCountdown() {

        if (gameStarted) {
            return;
        }

        startButton.disabled = true;

        document
            .querySelector(".love-game-welcome")
            ?.classList.add("is-hidden");

        const steps = ["3", "2", "1", "¡A jugar!"];

        let currentStep = 0;

        countdown.classList.add("is-visible");

        showCountdownStep(steps[currentStep], false);

        const countdownInterval = setInterval(() => {

            currentStep++;

            if (currentStep < steps.length) {

                showCountdownStep(
                    steps[currentStep],
                    currentStep === steps.length - 1
                );

                return;

            }

            clearInterval(countdownInterval);

            setTimeout(() => {

                countdown.classList.remove("is-visible");

                startGame();

            }, 650);

        }, 900);

    }

    function buildBoardGrid() {

        board.innerHTML = "";
        cellElements.length = 0;

        board.style.gridTemplateColumns =
            `repeat(${COLS}, var(--snake-cell-size, 28px))`;

        board.style.gridTemplateRows =
            `repeat(${ROWS}, var(--snake-cell-size, 28px))`;

        for (let y = 0; y < ROWS; y++) {

            for (let x = 0; x < COLS; x++) {

                const cell = document.createElement("div");

                cell.className = "snake-cell";
                cell.style.gridColumn = `${x + 1}`;
                cell.style.gridRow = `${y + 1}`;

                board.appendChild(cell);

            }

        }

    }

    function startGame() {

        gameStarted = true;
        passed = false;

        score = 0;
        totalGameSeconds = 0;
        ballsEatenSinceTrophy = 0;
        pendingRankingResult = null;

        window.clearTimeout(trophyTimeoutId);
        trophyTimeoutId = null;

        const centerX = Math.floor(COLS / 2);
        const centerY = Math.floor(ROWS / 2);

        snake = [
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY },
            { x: centerX - 3, y: centerY }
        ];

        direction = DIRECTIONS.right;
        pendingDirection = DIRECTIONS.right;

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        levelElement.textContent = "1";
        scoreElement.textContent = `0 / ${TARGET_SCORE}`;
        timeElement.textContent = formatTime(0);

        buildBoardGrid();
        renderSnake();

        food = null;
        spawnBallFood();

        window.clearInterval(totalTimerInterval);

        totalTimerInterval = window.setInterval(() => {

            totalGameSeconds++;

            timeElement.textContent = formatTime(totalGameSeconds);

            const level = computeLevel(totalGameSeconds);

            levelElement.textContent = `${level}`;

        }, 1000);

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        scheduleNextTick();

    }

    function scheduleNextTick() {

        window.clearTimeout(tickTimeoutId);

        const level = computeLevel(totalGameSeconds);
        const interval = computeTickInterval(level);

        tickTimeoutId = window.setTimeout(() => {

            tick();

            if (gameStarted) {
                scheduleNextTick();
            }

        }, interval);

    }

    function tick() {

        if (!gameStarted) {
            return;
        }

        direction = pendingDirection;

        const head = snake[0];
        const newHead = getNextHeadPosition(head, direction);

        if (isOutOfBounds(newHead, COLS, ROWS)) {
            finishGame(false, "pared");
            return;
        }

        const willEatBall =
            food && food.type === "ball" && cellsEqual(newHead, food);

        const willEatTrophy =
            food && food.type === "trophy" && cellsEqual(newHead, food);

        const willGrow = willEatBall || willEatTrophy;

        if (isSelfCollision(newHead, snake, willGrow)) {
            finishGame(false, "cuerpo");
            return;
        }

        snake.unshift(newHead);

        if (!willGrow) {
            snake.pop();
        }

        if (willEatBall) {
            handleEatBall();
        } else if (willEatTrophy) {
            handleEatTrophy();
        }

        renderSnake();

        if (score >= TARGET_SCORE) {
            finishGame(true);
        }

    }

    function handleEatBall() {

        score += BALL_POINTS;

        showScorePop(BALL_POINTS);

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        scoreElement.textContent =
            `${Math.min(score, TARGET_SCORE)} / ${TARGET_SCORE}`;

        ballsEatenSinceTrophy++;

        if (ballsEatenSinceTrophy >= BALLS_PER_TROPHY) {

            ballsEatenSinceTrophy = 0;
            spawnTrophyFood();

        } else {

            spawnBallFood();

        }

    }

    function handleEatTrophy() {

        score += TROPHY_POINTS;

        showScorePop(TROPHY_POINTS);

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        scoreElement.textContent =
            `${Math.min(score, TARGET_SCORE)} / ${TARGET_SCORE}`;

        window.clearTimeout(trophyTimeoutId);
        trophyTimeoutId = null;

        spawnBallFood();

    }

    function spawnBallFood() {

        const emptyCell = findRandomEmptyCell(COLS, ROWS, snake);

        if (!emptyCell) {
            return;
        }

        food = { x: emptyCell.x, y: emptyCell.y, type: "ball" };

        renderFood();

    }

    function spawnTrophyFood() {

        const emptyCell = findRandomEmptyCell(COLS, ROWS, snake);

        if (!emptyCell) {
            return;
        }

        food = { x: emptyCell.x, y: emptyCell.y, type: "trophy" };

        renderFood();

        window.clearTimeout(trophyTimeoutId);

        trophyTimeoutId = window.setTimeout(() => {

            if (food && food.type === "trophy") {
                spawnBallFood();
            }

        }, TROPHY_LIFESPAN_MS);

    }

    function renderSnake() {

        segmentElements.forEach((element) => element.remove());
        segmentElements = [];

        snake.forEach((segment, index) => {

            const element = document.createElement("div");

            element.className =
                "snake-segment" + (index === 0 ? " is-head" : "");

            element.style.gridColumn = `${segment.x + 1}`;
            element.style.gridRow = `${segment.y + 1}`;

            board.appendChild(element);
            segmentElements.push(element);

        });

    }

    function renderFood() {

        if (foodElement) {
            foodElement.remove();
            foodElement = null;
        }

        if (!food) {
            return;
        }

        foodElement = document.createElement("div");

        foodElement.className =
            "snake-food " +
            (food.type === "trophy" ? "snake-food-trophy" : "snake-food-ball");

        foodElement.innerHTML =
            food.type === "trophy"
                ? '<i class="fa-solid fa-trophy"></i>'
                : '<i class="fa-solid fa-circle"></i>';

        foodElement.style.gridColumn = `${food.x + 1}`;
        foodElement.style.gridRow = `${food.y + 1}`;

        board.appendChild(foodElement);

    }

    function showScorePop(value) {

        scoreAnimation.textContent = `+${value}`;
        scoreAnimation.className = "score-animation positive";

        scoreAnimation.classList.add("show");

        window.setTimeout(() => {
            scoreAnimation.classList.remove("show");
        }, 800);

    }

    function formatTime(totalSeconds) {

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );

    }

    async function finishGame(didWin, reason) {

        gameStarted = false;
        passed = didWin;

        window.clearTimeout(tickTimeoutId);
        tickTimeoutId = null;

        window.clearTimeout(trophyTimeoutId);
        trophyTimeoutId = null;

        window.clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        const finalScore = Math.min(score, TARGET_SCORE);
        const finalTime = totalGameSeconds;
        const formattedTime = formatTime(finalTime);

        if (didWin) {

            localStorage.setItem("tenthGameUnlocked", "true");

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
            resultLabel.textContent = "Desafío superado";
            resultTitle.textContent = "¡Qué serpiente tan hábil!";

            resultText.textContent =
                `Llegaste a ${finalScore} puntos en ${formattedTime}.`;

            resultButtonText.textContent = "Continuar";

        } else {

            defeatSound.currentTime = 0;
            defeatSound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-heart-crack"></i>';
            resultLabel.textContent = "Fin de la partida";

            resultTitle.textContent =
                reason === "cuerpo"
                    ? "¡Te mordiste la cola!"
                    : "¡Chocaste contra la pared!";

            resultText.textContent =
                `Llegaste a ${finalScore} de ${TARGET_SCORE} puntos en ${formattedTime}.`;

            resultButtonText.textContent = "Intentar nuevamente";

        }

        if (didWin) {

            const rankingOpened = await processRankingResult(finalScore, finalTime);

            if (rankingOpened) {
                return;
            }

        }

        setTimeout(() => {
            showModal(resultModal);
        }, 500);

    }

    async function processRankingResult(finalScore, finalTime) {

        try {

            const result = await checkTriviaResult(
                GAME_ID,
                finalScore,
                finalTime,
                RANKING_LIVES
            );

            if (!result.newPersonalRecord) {
                return false;
            }

            pendingRankingResult = {
                ...result,
                score: finalScore,
                time: finalTime,
                lives: RANKING_LIVES
            };

            rankingModalScore.textContent =
                `${finalScore} puntos · ${formatTime(finalTime)}`;

            rankingNameError.textContent = "";

            if (result.qualifiesTop10 && !result.hasName) {

                rankingModalTitle.textContent = "¡Entraste al Top 10!";

                rankingModalText.textContent =
                    `Tu resultado ocuparía el puesto ${result.position}. ` +
                    "Escribe tu nombre o apodo para aparecer en el Salón de la Fama.";

                rankingNameGroup.hidden = false;
                rankingPlayerName.value = "";

            } else {

                rankingModalTitle.textContent = "¡Nuevo récord personal!";

                rankingModalText.textContent =
                    result.qualifiesTop10
                        ? `Tu resultado ocuparía el puesto ${result.position} del ranking.`
                        : "Has superado tu mejor puntaje anterior.";

                rankingNameGroup.hidden = true;

            }

            showModal(rankingModal);

            return true;

        } catch (error) {

            console.error("No se pudo comprobar el ranking:", error);

            return false;

        }

    }

    async function openLeaderboard() {

        showModal(leaderboardModal);

        leaderboardLoading.hidden = false;
        leaderboardEmpty.hidden = true;

        leaderboardList.innerHTML = "";

        try {

            const ranking = await getTriviaRanking(GAME_ID);

            leaderboardLoading.hidden = true;

            if (!ranking.length) {
                leaderboardEmpty.hidden = false;
                return;
            }

            ranking.forEach((player) => {

                const item = document.createElement("li");

                item.classList.add(`leaderboard-rank-${player.position}`);

                let positionContent = player.position;

                if (player.position === 1) {
                    positionContent = "🥇";
                }

                if (player.position === 2) {
                    positionContent = "🥈";
                }

                if (player.position === 3) {
                    positionContent = "🥉";
                }

                item.innerHTML = `
          <span class="leaderboard-position">
            ${positionContent}
          </span>

          <span class="leaderboard-player">
            ${player.name}
          </span>

          <strong class="leaderboard-score">
            ${player.score} puntos · ${formatTime(player.time)}
          </strong>
        `;

                leaderboardList.appendChild(item);

            });

        } catch (error) {

            leaderboardLoading.textContent =
                "No se pudo cargar la clasificación.";

            console.error(error);

        }

    }

    function restartGame() {

        gameStarted = false;
        passed = false;

        score = 0;
        totalGameSeconds = 0;
        pendingRankingResult = null;

        window.clearTimeout(tickTimeoutId);
        tickTimeoutId = null;

        window.clearTimeout(trophyTimeoutId);
        trophyTimeoutId = null;

        window.clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        gameStage.classList.remove("is-playing");
        resetButton.classList.remove("is-visible");

        hideModal(resultModal);
        hideModal(rankingModal);
        hideModal(leaderboardModal);

        document
            .querySelector(".love-game-welcome")
            ?.classList.remove("is-hidden");

        startButton.disabled = false;

        levelElement.textContent = "1";
        scoreElement.textContent = `0 / ${TARGET_SCORE}`;
        timeElement.textContent = formatTime(0);

        board.innerHTML = "";
        segmentElements = [];
        foodElement = null;

    }

    function showModal(modal) {
        modal.classList.add("is-visible");
        modal.setAttribute("aria-hidden", "false");
    }

    function hideModal(modal) {

        if (modal.contains(document.activeElement)) {
            document.activeElement.blur();
        }

        modal.classList.remove("is-visible");
        modal.setAttribute("aria-hidden", "true");
    }

});
