import {
    checkPuzzleResult,
    saveBestPuzzleResult,
    getPuzzleRanking
} from "./firebase-ranking.js";

const GAME_ID = "cruzando";

/* ==================================================
   CARRILES (de arriba hacia abajo)
================================================== */

const COLS = 13;

const LANE_DEFS = [
    { type: "goal", direction: 0, baseSpeed: 0, obstacleLength: 0, gapUnits: 0 },
    { type: "river", direction: 1, baseSpeed: 1.2, obstacleLength: 2, gapUnits: 2 },
    { type: "river", direction: -1, baseSpeed: 1.6, obstacleLength: 3, gapUnits: 2 },
    { type: "river", direction: 1, baseSpeed: 1.0, obstacleLength: 2, gapUnits: 2.5 },
    { type: "safe", direction: 0, baseSpeed: 0, obstacleLength: 0, gapUnits: 0 },
    { type: "feria", direction: -1, baseSpeed: 1.4, obstacleLength: 1, gapUnits: 3 },
    { type: "feria", direction: 1, baseSpeed: 1.1, obstacleLength: 1, gapUnits: 2.5 },
    { type: "personas", direction: -1, baseSpeed: 1.3, obstacleLength: 1, gapUnits: 2 },
    { type: "safe", direction: 0, baseSpeed: 0, obstacleLength: 0, gapUnits: 0 },
    { type: "buses", direction: 1, baseSpeed: 0.9, obstacleLength: 2, gapUnits: 4 },
    { type: "buses", direction: -1, baseSpeed: 1.0, obstacleLength: 2, gapUnits: 3.5 },
    { type: "carretera", direction: 1, baseSpeed: 1.8, obstacleLength: 1, gapUnits: 2.5 },
    { type: "carretera", direction: -1, baseSpeed: 2.0, obstacleLength: 1, gapUnits: 2.5 },
    { type: "safe", direction: 0, baseSpeed: 0, obstacleLength: 0, gapUnits: 0 }
];

const TOTAL_ROWS = LANE_DEFS.length;
const GOAL_ROW = 0;
const START_ROW = TOTAL_ROWS - 1;

const LEVEL_SPEED_MULTIPLIERS = [0.8, 1.0, 1.2, 1.4];
const TOTAL_LEVELS = LEVEL_SPEED_MULTIPLIERS.length;

const MAX_LIVES = 5;
const HIT_FREEZE_MS = 900;
const LEVEL_CLEAR_PAUSE_MS = 900;
const PLAYER_WIDTH_UNITS = 0.5;
const HAZARD_VISUAL_MARGIN_RATIO = 0.15;

const ICONS_BY_TYPE = {
    river: "fa-solid fa-water",
    feria: "fa-solid fa-store",
    personas: "fa-solid fa-person-walking",
    buses: "fa-solid fa-bus",
    carretera: "fa-solid fa-car"
};

function isHazardType(type) {
    return type !== "goal" && type !== "safe";
}

/* ==================================================
   CARRIL: posiciones de obstáculos ("cinta sin fin")
================================================== */

function buildLaneRuntime(laneDef, speedMultiplier) {

    const step = laneDef.obstacleLength + laneDef.gapUnits;
    const obstacleCount = step > 0 ? Math.max(2, Math.ceil((COLS + step * 2) / step)) : 0;
    const trackLength = step * obstacleCount;

    return {
        ...laneDef,
        speed: laneDef.baseSpeed * speedMultiplier,
        step,
        obstacleCount,
        trackLength
    };

}

function getObstaclePositions(laneRuntime, timeSeconds) {

    if (laneRuntime.trackLength <= 0) {
        return [];
    }

    const traveled = laneRuntime.speed * laneRuntime.direction * timeSeconds;

    const positions = [];

    for (let index = 0; index < laneRuntime.obstacleCount; index++) {

        const basePosition = index * laneRuntime.step;

        let position = (basePosition + traveled) % laneRuntime.trackLength;

        if (position < 0) {
            position += laneRuntime.trackLength;
        }

        position -= laneRuntime.step;

        positions.push({
            start: position,
            end: position + laneRuntime.obstacleLength
        });

    }

    return positions.sort((a, b) => a.start - b.start);

}

function rangesOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}

function isColumnHitByObstacle(positions, playerCenterUnit, playerWidthUnits) {

    const half = playerWidthUnits / 2;
    const playerStart = playerCenterUnit - half;
    const playerEnd = playerCenterUnit + half;

    return positions.some((obstacle) =>
        rangesOverlap(playerStart, playerEnd, obstacle.start, obstacle.end)
    );

}

function buildLevelRuntime(levelIndex) {

    const speedMultiplier = LEVEL_SPEED_MULTIPLIERS[levelIndex];

    return LANE_DEFS.map((laneDef) => buildLaneRuntime(laneDef, speedMultiplier));

}

function formatDecimalSeconds(totalMs) {
    return `${(totalMs / 1000).toFixed(1)} s`;
}

function clampColumn(col) {
    return Math.max(0, Math.min(COLS - 1, col));
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

    const gameStage = document.getElementById("cruzandoGameStage");
    const startButton = document.getElementById("cruzandoStartButton");
    const resetButton = document.getElementById("cruzandoResetButton");
    const countdown = document.getElementById("loveCountdown");
    const countdownText = document.getElementById("loveCountdownText");

    const boardWrap = document.getElementById("cruzandoBoardWrap");
    const board = document.getElementById("cruzandoBoard");
    const controls = document.getElementById("cruzandoControls");

    const levelElement = document.getElementById("cruzandoLevel");
    const movesElement = document.getElementById("cruzandoMoves");
    const livesElement = document.getElementById("cruzandoLives");
    const timeElement = document.getElementById("cruzandoTime");

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
        !levelElement || !movesElement || !livesElement || !timeElement ||
        !resultModal || !resultIcon || !resultLabel || !resultTitle ||
        !resultText || !resultButtonText || !resultButton ||
        !rankingModal || !rankingModalTitle || !rankingModalText ||
        !rankingModalScore || !rankingNameGroup || !rankingPlayerName ||
        !rankingNameError || !rankingSaveButton ||
        !leaderboardModal || !leaderboardList || !leaderboardLoading ||
        !leaderboardEmpty || !leaderboardOpenButton || !leaderboardCloseButton
    ) {

        console.error(
            "No se encontraron todos los elementos necesarios de Cruzando."
        );

        throw new Error(
            "Faltan elementos HTML de Cruzando."
        );

    }

    let gameStarted = false;
    let passed = false;
    let frozen = false;

    let currentLevelIndex = 0;
    let levelRuntime = null;
    let laneClockSeconds = 0;
    let latestPositionsByRow = [];

    let playerRow = START_ROW;
    let playerCol = Math.floor(COLS / 2);
    let lastSafeRow = START_ROW;

    let lives = MAX_LIVES;
    let movesCount = 0;
    let totalElapsedMs = 0;

    let cellSize = 42;
    let rafId = null;
    let lastFrameTime = 0;

    let pendingRankingResult = null;

    let playerElement = null;
    let rowObstacleElements = [];

    startButton.addEventListener("click", startCountdown);
    resetButton.addEventListener("click", restartGame);

    resultButton.addEventListener("click", () => {

        hideModal(resultModal);

        if (!passed) {
            restartGame();
        }

    });

    controls.querySelectorAll(".cruzando-dpad-button").forEach((button) => {

        button.addEventListener("click", () => {
            attemptMove(button.dataset.direction);
        });

    });

    window.addEventListener("keydown", (event) => {

        if (!gameStarted) {
            return;
        }

        let dir = null;

        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
            dir = "up";
        } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
            dir = "down";
        } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
            dir = "left";
        } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
            dir = "right";
        }

        if (dir) {
            event.preventDefault();
            attemptMove(dir);
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
            attemptMove(deltaX > 0 ? "right" : "left");
        } else {
            attemptMove(deltaY > 0 ? "down" : "up");
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

            await saveBestPuzzleResult(
                GAME_ID,
                pendingRankingResult.time,
                pendingRankingResult.moves,
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

    function getCellSize() {
        return window.innerWidth <= 620 ? 26 : 38;
    }

    function startGame() {

        gameStarted = true;
        passed = false;
        frozen = false;

        currentLevelIndex = 0;
        lives = MAX_LIVES;
        movesCount = 0;
        totalElapsedMs = 0;
        pendingRankingResult = null;

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        movesElement.textContent = "0";
        timeElement.textContent = formatDecimalSeconds(0);
        updateLivesDisplay();

        startLevel(currentLevelIndex);

        lastFrameTime = performance.now();
        rafId = window.requestAnimationFrame(gameLoop);

    }

    function startLevel(levelIndex) {

        levelRuntime = buildLevelRuntime(levelIndex);
        laneClockSeconds = 0;

        playerRow = START_ROW;
        playerCol = Math.floor(COLS / 2);
        lastSafeRow = START_ROW;

        levelElement.textContent = `${levelIndex + 1} / ${TOTAL_LEVELS}`;

        renderBoard();
        updatePlayerElementPosition();

    }

    function renderBoard() {

        cellSize = getCellSize();

        board.innerHTML = "";
        rowObstacleElements = [];

        board.style.width = `${COLS * cellSize}px`;
        board.style.height = `${TOTAL_ROWS * cellSize}px`;

        levelRuntime.forEach((lane, rowIndex) => {

            const row = document.createElement("div");

            row.className = `cruzando-row type-${lane.type}`;
            row.style.top = `${rowIndex * cellSize}px`;
            row.style.height = `${cellSize}px`;

            board.appendChild(row);

            const elements = [];

            if (isHazardType(lane.type)) {

                for (let index = 0; index < lane.obstacleCount; index++) {

                    const obstacle = document.createElement("div");

                    obstacle.className = `cruzando-obstacle type-${lane.type}`;
                    obstacle.style.height = `${cellSize * 0.84}px`;

                    const icon = document.createElement("i");
                    icon.className = ICONS_BY_TYPE[lane.type] || "";

                    obstacle.appendChild(icon);
                    row.appendChild(obstacle);

                    elements.push(obstacle);

                }

            }

            rowObstacleElements.push(elements);

        });

        playerElement = document.createElement("div");
        playerElement.className = "cruzando-player";
        playerElement.style.width = `${cellSize}px`;
        playerElement.style.height = `${cellSize}px`;

        const shape = document.createElement("div");
        shape.className = "cruzando-player-shape";
        shape.innerHTML = '<i class="fa-solid fa-person"></i>';

        playerElement.appendChild(shape);
        board.appendChild(playerElement);

        latestPositionsByRow = levelRuntime.map(() => []);

    }

    function updatePlayerElementPosition() {

        if (!playerElement) {
            return;
        }

        playerElement.style.left = `${playerCol * cellSize}px`;
        playerElement.style.top = `${playerRow * cellSize}px`;
        playerElement.classList.toggle("is-frozen", frozen);

    }

    function updateObstaclePositions() {

        levelRuntime.forEach((lane, rowIndex) => {

            if (!isHazardType(lane.type)) {
                return;
            }

            const rawPositions = getObstaclePositions(lane, laneClockSeconds);

            /*
             * Para que el choque se sienta justo, el área que
             * realmente golpea es un poco más chica que el
             * bloque completo del obstáculo, y se dibuja
             * exactamente del mismo tamaño que esa área (lo que
             * se ve es lo que puede tocarte, ni más ni menos).
             * En el río no se achica: ahí el tronco completo
             * debe servir de apoyo.
             */

            const positions = lane.type === "river"
                ? rawPositions
                : rawPositions.map((position) => {

                    const length = position.end - position.start;
                    const margin = length * HAZARD_VISUAL_MARGIN_RATIO;

                    return {
                        start: position.start + margin,
                        end: position.end - margin
                    };

                });

            latestPositionsByRow[rowIndex] = positions;

            const elements = rowObstacleElements[rowIndex];

            positions.forEach((position, index) => {

                const element = elements[index];

                if (!element) {
                    return;
                }

                element.style.left = `${position.start * cellSize}px`;
                element.style.width = `${(position.end - position.start) * cellSize}px`;

            });

        });

    }

    function attemptMove(directionName) {

        if (!gameStarted || frozen) {
            return;
        }

        let moved = false;

        if (directionName === "up") {

            if (playerRow > GOAL_ROW) {
                playerRow -= 1;
                moved = true;
            }

        } else if (directionName === "down") {

            if (playerRow < START_ROW) {
                playerRow += 1;
                moved = true;
            }

        } else if (directionName === "left") {

            const newCol = clampColumn(Math.round(playerCol) - 1);

            if (newCol !== Math.round(playerCol)) {
                playerCol = newCol;
                moved = true;
            }

        } else if (directionName === "right") {

            const newCol = clampColumn(Math.round(playerCol) + 1);

            if (newCol !== Math.round(playerCol)) {
                playerCol = newCol;
                moved = true;
            }

        }

        if (!moved) {
            return;
        }

        movesCount++;
        movesElement.textContent = `${movesCount}`;

        if (levelRuntime[playerRow].type === "safe") {
            lastSafeRow = playerRow;
        }

        updatePlayerElementPosition();

        if (playerRow === GOAL_ROW) {
            handleLevelCleared();
        }

    }

    function gameLoop(now) {

        if (!gameStarted) {
            return;
        }

        rafId = window.requestAnimationFrame(gameLoop);

        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;

        laneClockSeconds += deltaSeconds;
        totalElapsedMs += deltaSeconds * 1000;

        timeElement.textContent = formatDecimalSeconds(totalElapsedMs);

        updateObstaclePositions();

        if (!frozen) {

            updatePlayerRiverDrift(deltaSeconds);
            checkCurrentRowHazard();

        }

        updatePlayerElementPosition();

    }

    function updatePlayerRiverDrift(deltaSeconds) {

        if (!levelRuntime || playerRow === GOAL_ROW || playerRow === START_ROW) {
            return;
        }

        const lane = levelRuntime[playerRow];

        if (lane.type !== "river") {
            return;
        }

        const positions = latestPositionsByRow[playerRow];
        const supported = isColumnHitByObstacle(positions, playerCol + 0.5, PLAYER_WIDTH_UNITS);

        if (!supported) {
            handlePlayerHit("rio");
            return;
        }

        playerCol += lane.speed * lane.direction * deltaSeconds;

        if (playerCol < -0.5 || playerCol > COLS - 0.5) {
            handlePlayerHit("rio");
        }

    }

    function checkCurrentRowHazard() {

        if (!levelRuntime || playerRow === GOAL_ROW || playerRow === START_ROW) {
            return;
        }

        const lane = levelRuntime[playerRow];

        if (!isHazardType(lane.type) || lane.type === "river") {
            return;
        }

        const positions = latestPositionsByRow[playerRow];

        if (isColumnHitByObstacle(positions, playerCol + 0.5, PLAYER_WIDTH_UNITS)) {
            handlePlayerHit(lane.type);
        }

    }

    function handlePlayerHit(reason) {

        if (frozen) {
            return;
        }

        lives--;
        updateLivesDisplay();

        if (lives <= 0) {
            finishGame(false);
            return;
        }

        frozen = true;

        defeatSound.currentTime = 0;
        defeatSound.play().catch(() => { });

        updatePlayerElementPosition();

        window.setTimeout(() => {

            playerRow = lastSafeRow;
            playerCol = Math.floor(COLS / 2);

            frozen = false;

            updatePlayerElementPosition();

        }, HIT_FREEZE_MS);

    }

    function handleLevelCleared() {

        frozen = true;

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        const isLastLevel = currentLevelIndex === TOTAL_LEVELS - 1;

        if (isLastLevel) {
            finishGame(true);
            return;
        }

        window.setTimeout(() => {

            currentLevelIndex++;
            frozen = false;

            startLevel(currentLevelIndex);

        }, LEVEL_CLEAR_PAUSE_MS);

    }

    function updateLivesDisplay() {
        livesElement.textContent = "❤️".repeat(Math.max(lives, 0)) || "—";
    }

    async function finishGame(didWin) {

        gameStarted = false;
        passed = didWin;

        if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        const finalTime = Number((totalElapsedMs / 1000).toFixed(1));
        const finalMoves = movesCount;
        const formattedTime = formatDecimalSeconds(totalElapsedMs);

        if (didWin) {

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
            resultLabel.textContent = "Desafío superado";
            resultTitle.textContent = `¡Cruzaste los ${TOTAL_LEVELS} recorridos!`;

            resultText.textContent =
                `Llegaste en ${formattedTime} con ${finalMoves} movimientos ` +
                `y ${lives} ${lives === 1 ? "vida" : "vidas"} de sobra.`;

            resultButtonText.textContent = "Continuar";

            localStorage.setItem("fifteenthGameUnlocked", "true");

        } else {

            defeatSound.currentTime = 0;
            defeatSound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-heart-crack"></i>';
            resultLabel.textContent = "Fin de la partida";
            resultTitle.textContent = "¡No lo lograste esta vez!";

            resultText.textContent =
                `Llegaste al recorrido ${currentLevelIndex + 1} de ${TOTAL_LEVELS} ` +
                `en ${formattedTime}.`;

            resultButtonText.textContent = "Intentar nuevamente";

        }

        if (didWin) {

            const rankingOpened = await processRankingResult(finalTime, finalMoves);

            if (rankingOpened) {
                return;
            }

        }

        setTimeout(() => {
            showModal(resultModal);
        }, 500);

    }

    async function processRankingResult(finalTime, finalMoves) {

        try {

            const result = await checkPuzzleResult(
                GAME_ID,
                finalTime,
                finalMoves,
                lives
            );

            if (!result.newPersonalRecord) {
                return false;
            }

            pendingRankingResult = {
                ...result,
                time: finalTime,
                moves: finalMoves,
                lives
            };

            rankingModalScore.textContent =
                `${finalTime.toFixed(1)} s · ${finalMoves} movimientos`;

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
                        : "Has superado tu mejor tiempo anterior.";

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

            const ranking = await getPuzzleRanking(GAME_ID);

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
            ${player.time.toFixed(1)} s · ${player.moves} movim
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
        frozen = false;

        if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        currentLevelIndex = 0;
        lives = MAX_LIVES;
        movesCount = 0;
        totalElapsedMs = 0;
        pendingRankingResult = null;

        gameStage.classList.remove("is-playing");
        resetButton.classList.remove("is-visible");

        hideModal(resultModal);
        hideModal(rankingModal);
        hideModal(leaderboardModal);

        document
            .querySelector(".love-game-welcome")
            ?.classList.remove("is-hidden");

        startButton.disabled = false;

        levelElement.textContent = `1 / ${TOTAL_LEVELS}`;
        movesElement.textContent = "0";
        timeElement.textContent = formatDecimalSeconds(0);
        updateLivesDisplay();

        board.innerHTML = "";
        rowObstacleElements = [];
        playerElement = null;

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
