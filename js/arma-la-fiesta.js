import {
    checkPuzzleResult,
    saveBestPuzzleResult,
    getPuzzleRanking
} from "./firebase-ranking.js";

const GAME_ID = "arma-la-fiesta";

/*
 * Este juego no tiene "vidas" reales (no hay condición de
 * derrota, solo reiniciar el salón si te atascas), pero la
 * función de ranking espera un valor de "lives" para poder
 * reutilizar exactamente el mismo índice de Firestore que ya
 * usa Rompecabezas. Usamos un valor constante.
 */
const RANKING_LIVES = 3;

/* ==================================================
   PLANTILLAS DE SALÓN (# = pared, . = piso)
================================================== */

const TEMPLATES = [

    [
        "########",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "########"
    ],

    [
        "########",
        "#......#",
        "#......#",
        "#..##..#",
        "#..##..#",
        "#......#",
        "#......#",
        "########"
    ],

    [
        "########",
        "#......#",
        "#......#",
        "#.####.#",
        "#......#",
        "#......#",
        "#......#",
        "########"
    ]

];

const DIRECTIONS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};

const DIRECTION_LIST = [
    DIRECTIONS.up,
    DIRECTIONS.down,
    DIRECTIONS.left,
    DIRECTIONS.right
];

const LEVEL_CONFIGS = [
    { numBoxes: 2, scrambleSteps: 15, minDepth: 4 },
    { numBoxes: 2, scrambleSteps: 22, minDepth: 5 },
    { numBoxes: 3, scrambleSteps: 32, minDepth: 6 },
    { numBoxes: 3, scrambleSteps: 42, minDepth: 7 },
    { numBoxes: 4, scrambleSteps: 55, minDepth: 8 }
];

/* ==================================================
   GENERADOR DE NIVELES (generación inversa)
================================================== */

function parseTemplate(template) {

    const rows = template.length;
    const cols = template[0].length;
    const walls = new Set();
    const floors = [];

    for (let y = 0; y < rows; y++) {

        for (let x = 0; x < cols; x++) {

            const ch = template[y][x];

            if (ch === "#") {
                walls.add(cellKey(x, y));
            } else {
                floors.push({ x, y });
            }

        }

    }

    return { rows, cols, walls, floors };

}

function cellKey(x, y) {
    return `${x},${y}`;
}

function isWall(room, x, y) {
    return room.walls.has(cellKey(x, y));
}

function hasBoxAt(boxes, x, y) {
    return boxes.some((box) => box.x === x && box.y === y);
}

function boxesKey(boxes) {

    return boxes
        .map((box) => cellKey(box.x, box.y))
        .sort()
        .join("|");

}

function shuffleArray(list) {

    const copy = list.slice();

    for (let i = copy.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];

    }

    return copy;

}

function generateRawLevel(templateIndex, numBoxes, scrambleSteps) {

    const room = parseTemplate(TEMPLATES[templateIndex]);

    const shuffledFloors = shuffleArray(room.floors);

    const targets = shuffledFloors.slice(0, numBoxes);
    const remainingFloors = shuffledFloors.slice(numBoxes);

    let player =
        remainingFloors[
            Math.floor(Math.random() * remainingFloors.length)
        ];

    let boxes = targets.map((target) => ({ x: target.x, y: target.y }));

    let successfulPulls = 0;
    let attempts = 0;
    const maxAttempts = scrambleSteps * 30;

    while (successfulPulls < scrambleSteps && attempts < maxAttempts) {

        attempts++;

        const dir =
            DIRECTION_LIST[
                Math.floor(Math.random() * DIRECTION_LIST.length)
            ];

        const newPlayer = { x: player.x + dir.dx, y: player.y + dir.dy };

        if (isWall(room, newPlayer.x, newPlayer.y)) {
            continue;
        }

        if (hasBoxAt(boxes, newPlayer.x, newPlayer.y)) {
            continue;
        }

        const boxSource = { x: player.x - dir.dx, y: player.y - dir.dy };
        const oldPlayer = player;

        let newBoxes = boxes;

        if (hasBoxAt(boxes, boxSource.x, boxSource.y)) {

            newBoxes = boxes.map((box) => {

                if (box.x === boxSource.x && box.y === boxSource.y) {
                    return { x: oldPlayer.x, y: oldPlayer.y };
                }

                return box;

            });

        }

        player = newPlayer;
        boxes = newBoxes;
        successfulPulls++;

    }

    const alreadySolved = targets.every((target) =>
        hasBoxAt(boxes, target.x, target.y)
    );

    return { room, targets, boxes, player, alreadySolved };

}

/*
 * Búsqueda breve (BFS acotado) SOLO para descartar niveles
 * demasiado fáciles (resolubles en muy pocos movimientos).
 * No hace falta que pruebe que es resoluble: la construcción
 * por generación inversa ya lo garantiza matemáticamente.
 */
function isSolvableWithinDepth(room, targets, startPlayer, startBoxes, maxDepth, maxStates) {

    const targetSet = new Set(targets.map((t) => cellKey(t.x, t.y)));

    function isSolved(boxes) {
        return boxes.every((box) => targetSet.has(cellKey(box.x, box.y)));
    }

    function stateKey(player, boxes) {
        return `${cellKey(player.x, player.y)}#${boxesKey(boxes)}`;
    }

    if (isSolved(startBoxes)) {
        return 0;
    }

    const visited = new Set([stateKey(startPlayer, startBoxes)]);
    let frontier = [{ player: startPlayer, boxes: startBoxes }];
    let statesExplored = 0;

    for (let depth = 1; depth <= maxDepth; depth++) {

        const next = [];

        for (const state of frontier) {

            for (const dir of DIRECTION_LIST) {

                statesExplored++;

                if (statesExplored > maxStates) {
                    return null;
                }

                const newPlayer = {
                    x: state.player.x + dir.dx,
                    y: state.player.y + dir.dy
                };

                if (isWall(room, newPlayer.x, newPlayer.y)) {
                    continue;
                }

                let newBoxes = state.boxes;

                const boxAtTarget = state.boxes.find(
                    (box) => box.x === newPlayer.x && box.y === newPlayer.y
                );

                if (boxAtTarget) {

                    const pushedTo = {
                        x: newPlayer.x + dir.dx,
                        y: newPlayer.y + dir.dy
                    };

                    if (isWall(room, pushedTo.x, pushedTo.y)) {
                        continue;
                    }

                    if (hasBoxAt(state.boxes, pushedTo.x, pushedTo.y)) {
                        continue;
                    }

                    newBoxes = state.boxes.map((box) =>
                        box === boxAtTarget
                            ? { x: pushedTo.x, y: pushedTo.y }
                            : box
                    );

                }

                const key = stateKey(newPlayer, newBoxes);

                if (visited.has(key)) {
                    continue;
                }

                visited.add(key);

                if (isSolved(newBoxes)) {
                    return depth;
                }

                next.push({ player: newPlayer, boxes: newBoxes });

            }

        }

        frontier = next;

        if (frontier.length === 0) {
            return null;
        }

    }

    return null;

}

function generateLevel(levelIndex) {

    const config = LEVEL_CONFIGS[levelIndex];

    const maxTries = 40;

    let bestFallback = null;

    for (let attempt = 0; attempt < maxTries; attempt++) {

        const templateIndex = Math.floor(Math.random() * TEMPLATES.length);

        const raw = generateRawLevel(
            templateIndex,
            config.numBoxes,
            config.scrambleSteps
        );

        if (raw.alreadySolved) {
            continue;
        }

        if (!bestFallback) {
            bestFallback = raw;
        }

        const tooEasy =
            isSolvableWithinDepth(
                raw.room,
                raw.targets,
                raw.player,
                raw.boxes,
                Math.max(1, config.minDepth - 1),
                4000
            ) !== null;

        if (tooEasy) {
            continue;
        }

        return raw;

    }

    // No se encontró un nivel que cumpla la dificultad mínima
    // dentro del número de intentos; usamos el mejor disponible
    // (sigue siendo 100% resoluble, solo puede que sea algo fácil).
    return bestFallback;

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

    const gameStage = document.getElementById("fiestaGameStage");
    const startButton = document.getElementById("fiestaStartButton");
    const resetButton = document.getElementById("fiestaResetButton");
    const countdown = document.getElementById("loveCountdown");
    const countdownText = document.getElementById("loveCountdownText");

    const boardWrap = document.getElementById("fiestaBoardWrap");
    const board = document.getElementById("fiestaBoard");
    const levelMessage = document.getElementById("fiestaLevelMessage");
    const controls = document.getElementById("fiestaControls");

    const levelElement = document.getElementById("fiestaLevel");
    const movesElement = document.getElementById("fiestaMoves");
    const timeElement = document.getElementById("fiestaTime");

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
    const startSound = new Audio("../audio/start.mp3");

    if (
        !gameStage || !startButton || !resetButton || !countdown ||
        !countdownText || !boardWrap || !board || !levelMessage || !controls ||
        !levelElement || !movesElement || !timeElement ||
        !resultModal || !resultIcon || !resultLabel || !resultTitle ||
        !resultText || !resultButtonText || !resultButton ||
        !rankingModal || !rankingModalTitle || !rankingModalText ||
        !rankingModalScore || !rankingNameGroup || !rankingPlayerName ||
        !rankingNameError || !rankingSaveButton ||
        !leaderboardModal || !leaderboardList || !leaderboardLoading ||
        !leaderboardEmpty || !leaderboardOpenButton || !leaderboardCloseButton
    ) {

        console.error(
            "No se encontraron todos los elementos necesarios de Arma la Fiesta."
        );

        throw new Error(
            "Faltan elementos HTML de Arma la Fiesta."
        );

    }

    const TOTAL_LEVELS = LEVEL_CONFIGS.length;

    let gameStarted = false;
    let passed = false;

    let currentLevelIndex = 0;
    let currentRoom = null;
    let currentTargets = [];
    let currentBoxes = [];
    let currentPlayer = null;
    let levelInitialState = null;

    let levelMoves = 0;
    let totalMoves = 0;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;

    let pendingRankingResult = null;

    const cellElements = new Map();
    const boxElements = [];
    let playerElement = null;

    startButton.addEventListener("click", startCountdown);
    resetButton.addEventListener("click", resetCurrentLevel);

    resultButton.addEventListener("click", () => {

        hideModal(resultModal);

        if (!passed) {
            restartGame();
        }

    });

    controls.querySelectorAll(".fiesta-dpad-button").forEach((button) => {

        button.addEventListener("click", () => {

            const directionName = button.dataset.direction;
            const dir = DIRECTIONS[directionName];

            if (dir) {
                attemptMove(dir);
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

        const SWIPE_THRESHOLD = 24;

        if (
            Math.abs(deltaX) < SWIPE_THRESHOLD &&
            Math.abs(deltaY) < SWIPE_THRESHOLD
        ) {
            return;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            attemptMove(deltaX > 0 ? DIRECTIONS.right : DIRECTIONS.left);
        } else {
            attemptMove(deltaY > 0 ? DIRECTIONS.down : DIRECTIONS.up);
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
                RANKING_LIVES,
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

    function startGame() {

        gameStarted = true;
        passed = false;

        currentLevelIndex = 0;
        totalMoves = 0;
        totalGameSeconds = 0;
        pendingRankingResult = null;

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        movesElement.textContent = "0";
        timeElement.textContent = formatTime(0);

        clearInterval(totalTimerInterval);

        totalTimerInterval = setInterval(() => {

            totalGameSeconds++;

            timeElement.textContent = formatTime(totalGameSeconds);

        }, 1000);

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        loadLevel(currentLevelIndex);

    }

    function loadLevel(levelIndex) {

        const level = generateLevel(levelIndex);

        currentRoom = level.room;
        currentTargets = level.targets;
        currentBoxes = level.boxes.map((box) => ({ ...box }));
        currentPlayer = { ...level.player };

        levelInitialState = {
            boxes: currentBoxes.map((box) => ({ ...box })),
            player: { ...currentPlayer }
        };

        levelMoves = 0;

        levelElement.textContent = `${levelIndex + 1} / ${TOTAL_LEVELS}`;
        movesElement.textContent = `${totalMoves}`;

        levelMessage.textContent = "";

        renderBoard();

    }

    function renderBoard() {

        board.innerHTML = "";
        cellElements.clear();
        boxElements.length = 0;
        playerElement = null;

        board.style.gridTemplateColumns =
            `repeat(${currentRoom.cols}, var(--fiesta-cell-size, 46px))`;

        board.style.gridTemplateRows =
            `repeat(${currentRoom.rows}, var(--fiesta-cell-size, 46px))`;

        const targetSet = new Set(
            currentTargets.map((t) => cellKey(t.x, t.y))
        );

        for (let y = 0; y < currentRoom.rows; y++) {

            for (let x = 0; x < currentRoom.cols; x++) {

                const cell = document.createElement("div");

                const wall = isWall(currentRoom, x, y);
                const isTarget = targetSet.has(cellKey(x, y));

                cell.className =
                    "fiesta-cell " +
                    (wall ? "is-wall" : "is-floor") +
                    (isTarget ? " is-target" : "");

                cell.style.gridColumn = `${x + 1}`;
                cell.style.gridRow = `${y + 1}`;

                board.appendChild(cell);
                cellElements.set(cellKey(x, y), cell);

            }

        }

        currentBoxes.forEach((box) => {

            const boxElement = document.createElement("div");

            boxElement.className = "fiesta-box";
            boxElement.innerHTML = '<i class="fa-solid fa-gift"></i>';

            positionElement(boxElement, box.x, box.y);
            updateBoxPlacedState(boxElement, box);

            board.appendChild(boxElement);
            boxElements.push(boxElement);

        });

        playerElement = document.createElement("div");
        playerElement.className = "fiesta-player";
        playerElement.innerHTML = '<i class="fa-solid fa-person"></i>';

        positionElement(playerElement, currentPlayer.x, currentPlayer.y);

        board.appendChild(playerElement);

    }

    function positionElement(element, x, y) {
        element.style.gridColumn = `${x + 1}`;
        element.style.gridRow = `${y + 1}`;
    }

    function updateBoxPlacedState(boxElement, box) {

        const onTarget = currentTargets.some(
            (t) => t.x === box.x && t.y === box.y
        );

        boxElement.classList.toggle("is-placed", onTarget);

    }

    function bounce(element) {

        element.classList.remove("just-moved");
        void element.offsetWidth;
        element.classList.add("just-moved");

    }

    function attemptMove(dir) {

        if (!gameStarted) {
            return;
        }

        const newPlayer = {
            x: currentPlayer.x + dir.dx,
            y: currentPlayer.y + dir.dy
        };

        if (isWall(currentRoom, newPlayer.x, newPlayer.y)) {
            return;
        }

        const boxIndex = currentBoxes.findIndex(
            (box) => box.x === newPlayer.x && box.y === newPlayer.y
        );

        if (boxIndex !== -1) {

            const pushedTo = {
                x: newPlayer.x + dir.dx,
                y: newPlayer.y + dir.dy
            };

            if (isWall(currentRoom, pushedTo.x, pushedTo.y)) {
                return;
            }

            const blockingBox = currentBoxes.some(
                (box) => box.x === pushedTo.x && box.y === pushedTo.y
            );

            if (blockingBox) {
                return;
            }

            currentBoxes[boxIndex] = { x: pushedTo.x, y: pushedTo.y };

            const boxElement = boxElements[boxIndex];
            positionElement(boxElement, pushedTo.x, pushedTo.y);
            updateBoxPlacedState(boxElement, currentBoxes[boxIndex]);
            bounce(boxElement);

        }

        currentPlayer = newPlayer;
        positionElement(playerElement, newPlayer.x, newPlayer.y);
        bounce(playerElement);

        levelMoves++;
        totalMoves++;
        movesElement.textContent = `${totalMoves}`;

        checkDeadlock();

        if (isLevelSolved()) {
            handleLevelSolved();
        }

    }

    function isLevelSolved() {

        return currentTargets.every((target) =>
            currentBoxes.some(
                (box) => box.x === target.x && box.y === target.y
            )
        );

    }

    function checkDeadlock() {

        const stuckBox = currentBoxes.find((box) => {

            const onTarget = currentTargets.some(
                (t) => t.x === box.x && t.y === box.y
            );

            if (onTarget) {
                return false;
            }

            const wallLeft = isWall(currentRoom, box.x - 1, box.y);
            const wallRight = isWall(currentRoom, box.x + 1, box.y);
            const wallUp = isWall(currentRoom, box.x, box.y - 1);
            const wallDown = isWall(currentRoom, box.x, box.y + 1);

            const cornerDeadlock =
                (wallLeft || wallRight) && (wallUp || wallDown);

            return cornerDeadlock;

        });

        if (stuckBox) {

            levelMessage.textContent =
                "¡Una caja quedó atascada! Usa \"Reiniciar salón\".";

        } else {

            levelMessage.textContent = "";

        }

    }

    function handleLevelSolved() {

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        if (currentLevelIndex >= TOTAL_LEVELS - 1) {

            finishGame(true);
            return;

        }

        levelMessage.textContent = `¡Salón ${currentLevelIndex + 1} listo!`;

        gameStarted = false;

        setTimeout(() => {

            currentLevelIndex++;
            gameStarted = true;
            loadLevel(currentLevelIndex);

        }, 1100);

    }

    function resetCurrentLevel() {

        if (!levelInitialState) {
            return;
        }

        currentBoxes = levelInitialState.boxes.map((box) => ({ ...box }));
        currentPlayer = { ...levelInitialState.player };
        levelMoves = 0;

        levelMessage.textContent = "";

        renderBoard();

    }

    function formatTime(totalSeconds) {

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );

    }

    async function finishGame(didWin) {

        gameStarted = false;
        passed = didWin;

        clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        const finalTime = totalGameSeconds;
        const finalMoves = totalMoves;
        const formattedTime = formatTime(finalTime);

        localStorage.setItem("tenthGameUnlocked", "true");

        victorySound.currentTime = 0;
        victorySound.play().catch(() => { });

        resultIcon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
        resultLabel.textContent = "Desafío completado";
        resultTitle.textContent = "¡La fiesta está lista!";

        resultText.textContent =
            `Completaste los ${TOTAL_LEVELS} salones en ${formattedTime} ` +
            `con ${finalMoves} movimientos.`;

        resultButtonText.textContent = "Continuar";

        const rankingOpened = await processRankingResult(finalTime, finalMoves);

        if (rankingOpened) {
            return;
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
                RANKING_LIVES
            );

            if (!result.newPersonalRecord) {
                return false;
            }

            pendingRankingResult = {
                ...result,
                time: finalTime,
                moves: finalMoves
            };

            rankingModalScore.textContent =
                `${formatTime(finalTime)} · ${finalMoves} movimientos`;

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
                        : "Has superado tu mejor resultado anterior.";

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
            ${formatTime(player.time)} · ${player.moves} movimientos
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

        currentLevelIndex = 0;
        totalMoves = 0;
        totalGameSeconds = 0;
        pendingRankingResult = null;

        clearInterval(totalTimerInterval);
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

        levelElement.textContent = `1 / ${TOTAL_LEVELS}`;
        movesElement.textContent = "0";
        timeElement.textContent = formatTime(0);
        levelMessage.textContent = "";

        board.innerHTML = "";

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
