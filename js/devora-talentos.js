import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID = "devora-talentos";

const FACES = [
    { name: "Eileen", image: "../img/juegos/personajes/eileen.png" },
    { name: "Jayro", image: "../img/juegos/personajes/jayro.png" },
    { name: "Josema", image: "../img/juegos/personajes/josema.png" },
    { name: "Luis", image: "../img/juegos/personajes/luis.png" },
    { name: "Omar", image: "../img/juegos/personajes/omar.png" },
    { name: "Ricardo", image: "../img/juegos/personajes/ricardo.png" },
    { name: "Snaider", image: "../img/juegos/personajes/snaider.png" },
    { name: "Sol", image: "../img/juegos/personajes/sol.png" },
    { name: "Yanira", image: "../img/juegos/personajes/yanira.png" }
];

/* ==================================================
   GENERACIÓN DE LABERINTO
   (recursive backtracker sobre una grilla de celdas,
   más agujeros extra para crear loops de evasión)
================================================== */

function generateMazeGrid(cellCols, cellRows, rng, loopChance) {

    const tileCols = cellCols * 2 + 1;
    const tileRows = cellRows * 2 + 1;

    const grid = [];

    for (let y = 0; y < tileRows; y++) {
        grid.push(new Array(tileCols).fill("#"));
    }

    const visited = [];

    for (let cy = 0; cy < cellRows; cy++) {
        visited.push(new Array(cellCols).fill(false));
    }

    function carveCell(cx, cy) {
        grid[cy * 2 + 1][cx * 2 + 1] = ".";
    }

    function carveWallBetween(cx1, cy1, cx2, cy2) {
        const wx = cx1 + cx2 + 1;
        const wy = cy1 + cy2 + 1;
        grid[wy][wx] = ".";
    }

    const stack = [[0, 0]];
    visited[0][0] = true;
    carveCell(0, 0);

    while (stack.length > 0) {

        const [cx, cy] = stack[stack.length - 1];

        const neighbors = [
            [cx, cy - 1],
            [cx, cy + 1],
            [cx - 1, cy],
            [cx + 1, cy]
        ].filter(
            ([nx, ny]) =>
                nx >= 0 && nx < cellCols &&
                ny >= 0 && ny < cellRows &&
                !visited[ny][nx]
        );

        if (neighbors.length === 0) {
            stack.pop();
            continue;
        }

        const [nx, ny] = neighbors[Math.floor(rng() * neighbors.length)];

        visited[ny][nx] = true;
        carveCell(nx, ny);
        carveWallBetween(cx, cy, nx, ny);

        stack.push([nx, ny]);

    }

    /*
     * Agujeros extra: para cada muro interno hay una
     * probabilidad de abrirlo también, creando loops para
     * poder evadir a los integrantes en vez de quedar
     * atrapado en pasillos únicos.
     */

    for (let cy = 0; cy < cellRows; cy++) {

        for (let cx = 0; cx < cellCols; cx++) {

            if (cx + 1 < cellCols) {

                const wx = cx * 2 + 2;
                const wy = cy * 2 + 1;

                if (grid[wy][wx] === "#" && rng() < loopChance) {
                    grid[wy][wx] = ".";
                }

            }

            if (cy + 1 < cellRows) {

                const wx = cx * 2 + 1;
                const wy = cy * 2 + 2;

                if (grid[wy][wx] === "#" && rng() < loopChance) {
                    grid[wy][wx] = ".";
                }

            }

        }

    }

    return grid;

}

function isOpenTile(grid, x, y) {

    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
        return false;
    }

    return grid[y][x] !== "#";

}

const DIRECTIONS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};

const DIRECTION_NAMES = Object.keys(DIRECTIONS);

function getOpenNeighbors(grid, pos) {

    const neighbors = [];

    DIRECTION_NAMES.forEach((name) => {

        const dir = DIRECTIONS[name];
        const nx = pos.x + dir.dx;
        const ny = pos.y + dir.dy;

        if (isOpenTile(grid, nx, ny)) {
            neighbors.push({ direction: name, x: nx, y: ny });
        }

    });

    return neighbors;

}

function bfsDistances(grid, start) {

    const distances = {};
    const key = (x, y) => `${x},${y}`;

    distances[key(start.x, start.y)] = 0;

    const queue = [start];
    let head = 0;

    while (head < queue.length) {

        const current = queue[head];
        head++;

        const currentDistance = distances[key(current.x, current.y)];

        getOpenNeighbors(grid, current).forEach((neighbor) => {

            const neighborKey = key(neighbor.x, neighbor.y);

            if (distances[neighborKey] === undefined) {
                distances[neighborKey] = currentDistance + 1;
                queue.push({ x: neighbor.x, y: neighbor.y });
            }

        });

    }

    return distances;

}

function countOpenTiles(grid) {

    let count = 0;

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] !== "#") {
                count++;
            }
        }
    }

    return count;

}

function isFullyConnected(grid) {

    let start = null;

    for (let y = 0; y < grid.length && !start; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] !== "#") {
                start = { x, y };
                break;
            }
        }
    }

    if (!start) {
        return false;
    }

    const distances = bfsDistances(grid, start);

    return Object.keys(distances).length === countOpenTiles(grid);

}

function bfsNextStepToward(grid, from, to) {

    if (from.x === to.x && from.y === to.y) {
        return null;
    }

    const key = (x, y) => `${x},${y}`;

    const cameFrom = {};
    const visited = new Set([key(from.x, from.y)]);

    const queue = [from];
    let head = 0;

    let found = false;

    while (head < queue.length && !found) {

        const current = queue[head];
        head++;

        const neighbors = getOpenNeighbors(grid, current);

        for (const neighbor of neighbors) {

            const neighborKey = key(neighbor.x, neighbor.y);

            if (visited.has(neighborKey)) {
                continue;
            }

            visited.add(neighborKey);
            cameFrom[neighborKey] = { from: current, direction: neighbor.direction };

            if (neighbor.x === to.x && neighbor.y === to.y) {
                found = true;
                break;
            }

            queue.push({ x: neighbor.x, y: neighbor.y });

        }

    }

    if (!found) {
        return null;
    }

    let stepKey = key(to.x, to.y);
    let step = cameFrom[stepKey];

    while (step && !(step.from.x === from.x && step.from.y === from.y)) {

        stepKey = key(step.from.x, step.from.y);
        step = cameFrom[stepKey];

    }

    return step ? step.direction : null;

}

function chooseEnemyDirection(grid, enemyPos, playerPos, mode) {

    const neighbors = getOpenNeighbors(grid, enemyPos);

    if (neighbors.length === 0) {
        return null;
    }

    if (mode === "chase") {

        const step = bfsNextStepToward(grid, enemyPos, playerPos);

        if (step) {
            return step;
        }

        return neighbors[0].direction;

    }

    if (mode === "flee") {

        const distances = bfsDistances(grid, playerPos);

        let best = neighbors[0];
        let bestDistance = -1;

        neighbors.forEach((neighbor) => {

            const distance = distances[`${neighbor.x},${neighbor.y}`];
            const effectiveDistance = distance === undefined ? Infinity : distance;

            if (effectiveDistance > bestDistance) {
                bestDistance = effectiveDistance;
                best = neighbor;
            }

        });

        return best.direction;

    }

    return neighbors[Math.floor(Math.random() * neighbors.length)].direction;

}

/* ==================================================
   PUNTUACIÓN
================================================== */

const PELLET_POINTS = 10;
const POWER_PELLET_POINTS = 50;
const CHAIN_POINTS = [200, 400, 800, 1600];

function computeChainPoints(chainIndex) {
    const index = Math.min(chainIndex, CHAIN_POINTS.length - 1);
    return CHAIN_POINTS[index];
}

/* ==================================================
   NIVELES
================================================== */

const LEVEL_CONFIGS = [
    { cellCols: 6, cellRows: 6, loopChance: 0.12, enemyCount: 3, enemyTickMs: 320, powerDurationMs: 8000 },
    { cellCols: 7, cellRows: 6, loopChance: 0.14, enemyCount: 4, enemyTickMs: 280, powerDurationMs: 6500 },
    { cellCols: 7, cellRows: 7, loopChance: 0.16, enemyCount: 4, enemyTickMs: 240, powerDurationMs: 5500 }
];

const TOTAL_LEVELS = LEVEL_CONFIGS.length;
const PLAYER_TICK_MS = 170;
const POWER_WARNING_MS = 2000;
const HIT_FREEZE_MS = 900;

/* ==================================================
   ARMADO COMPLETO DE UN NIVEL
================================================== */

function buildLevel(config, rng) {

    const grid = generateMazeGrid(config.cellCols, config.cellRows, rng, config.loopChance);

    if (!isFullyConnected(grid)) {
        throw new Error("El laberinto generado no está completamente conectado.");
    }

    const openTiles = [];

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] !== "#") {
                openTiles.push({ x, y });
            }
        }
    }

    const centerX = Math.floor(grid[0].length / 2);
    const centerY = Math.floor(grid.length / 2);

    let playerStart = openTiles[0];
    let bestCenterDistance = Infinity;

    openTiles.forEach((tile) => {

        const distance = Math.abs(tile.x - centerX) + Math.abs(tile.y - centerY);

        if (distance < bestCenterDistance) {
            bestCenterDistance = distance;
            playerStart = tile;
        }

    });

    const distancesFromPlayer = bfsDistances(grid, playerStart);

    const sortedByDistance = openTiles
        .filter((tile) => !(tile.x === playerStart.x && tile.y === playerStart.y))
        .map((tile) => ({
            tile,
            distance: distancesFromPlayer[`${tile.x},${tile.y}`] || 0
        }))
        .sort((a, b) => b.distance - a.distance);

    const enemyStarts = [];
    const minSeparation = 2;

    for (const candidate of sortedByDistance) {

        if (enemyStarts.length >= config.enemyCount) {
            break;
        }

        const tooClose = enemyStarts.some((existing) => {
            const dx = Math.abs(existing.x - candidate.tile.x);
            const dy = Math.abs(existing.y - candidate.tile.y);
            return (dx + dy) < minSeparation;
        });

        if (!tooClose) {
            enemyStarts.push(candidate.tile);
        }

    }

    while (enemyStarts.length < config.enemyCount && sortedByDistance.length > 0) {
        enemyStarts.push(sortedByDistance[enemyStarts.length % sortedByDistance.length].tile);
    }

    const cornerTargets = [
        { x: 0, y: 0 },
        { x: grid[0].length - 1, y: 0 },
        { x: 0, y: grid.length - 1 },
        { x: grid[0].length - 1, y: grid.length - 1 }
    ];

    const powerPelletCandidates = cornerTargets.map((corner) => {

        let best = openTiles[0];
        let bestDistance = Infinity;

        openTiles.forEach((tile) => {

            const distance = Math.abs(tile.x - corner.x) + Math.abs(tile.y - corner.y);

            if (distance < bestDistance) {
                bestDistance = distance;
                best = tile;
            }

        });

        return best;

    });

    const occupied = new Set([
        `${playerStart.x},${playerStart.y}`,
        ...enemyStarts.map((tile) => `${tile.x},${tile.y}`)
    ]);

    const uniquePowerPellets = [];
    const seenPower = new Set();

    powerPelletCandidates.forEach((tile) => {

        const key = `${tile.x},${tile.y}`;

        if (!seenPower.has(key) && !occupied.has(key)) {
            seenPower.add(key);
            uniquePowerPellets.push(tile);
        }

    });

    const powerKeySet = new Set(uniquePowerPellets.map((tile) => `${tile.x},${tile.y}`));

    const pellets = new Set();

    openTiles.forEach((tile) => {

        const key = `${tile.x},${tile.y}`;

        if (!occupied.has(key) && !powerKeySet.has(key)) {
            pellets.add(key);
        }

    });

    return {
        grid,
        playerStart,
        enemyStarts,
        powerPellets: uniquePowerPellets,
        pellets,
        totalCollectibles: pellets.size + uniquePowerPellets.length
    };

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

    const gameStage = document.getElementById("devoraGameStage");
    const startButton = document.getElementById("devoraStartButton");
    const resetButton = document.getElementById("devoraResetButton");
    const countdown = document.getElementById("loveCountdown");
    const countdownText = document.getElementById("loveCountdownText");

    const boardWrap = document.getElementById("devoraBoardWrap");
    const board = document.getElementById("devoraBoard");
    const controls = document.getElementById("devoraControls");

    const levelElement = document.getElementById("devoraLevel");
    const scoreElement = document.getElementById("devoraScore");
    const livesElement = document.getElementById("devoraLives");
    const timeElement = document.getElementById("devoraTime");
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
        !levelElement || !scoreElement || !livesElement || !timeElement ||
        !scoreAnimation ||
        !resultModal || !resultIcon || !resultLabel || !resultTitle ||
        !resultText || !resultButtonText || !resultButton ||
        !rankingModal || !rankingModalTitle || !rankingModalText ||
        !rankingModalScore || !rankingNameGroup || !rankingPlayerName ||
        !rankingNameError || !rankingSaveButton ||
        !leaderboardModal || !leaderboardList || !leaderboardLoading ||
        !leaderboardEmpty || !leaderboardOpenButton || !leaderboardCloseButton
    ) {

        console.error(
            "No se encontraron todos los elementos necesarios de Pac-Mac."
        );

        throw new Error(
            "Faltan elementos HTML de Pac-Mac."
        );

    }

    let gameStarted = false;
    let passed = false;
    let frozen = false;

    let currentLevelIndex = 0;
    let level = null;

    let playerPos = { x: 0, y: 0 };
    let playerDirection = "right";
    let playerPendingDirection = "right";

    let enemies = [];
    let memberRoster = [];

    let lives = 3;
    const MAX_LIVES = 3;

    let score = 0;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;

    let playerTickIntervalId = null;
    let enemyTickIntervalId = null;

    let powerModeActive = false;
    let powerModeTimeoutId = null;
    let powerWarningTimeoutId = null;
    let chainIndex = 0;

    let pendingRankingResult = null;

    let playerElement = null;

    startButton.addEventListener("click", startCountdown);
    resetButton.addEventListener("click", restartGame);

    resultButton.addEventListener("click", () => {

        hideModal(resultModal);

        if (!passed) {
            restartGame();
        }

    });

    controls.querySelectorAll(".devora-dpad-button").forEach((button) => {

        button.addEventListener("click", () => {

            const directionName = button.dataset.direction;

            if (DIRECTIONS[directionName]) {
                queueDirection(directionName);
            }

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
            queueDirection(deltaX > 0 ? "right" : "left");
        } else {
            queueDirection(deltaY > 0 ? "down" : "up");
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
                pendingRankingResult.levelsCleared,
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

        playerPendingDirection = dir;

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

    function pickMemberRoster() {

        const shuffled = [...FACES];

        for (let index = shuffled.length - 1; index > 0; index--) {

            const swapIndex = Math.floor(Math.random() * (index + 1));

            [shuffled[index], shuffled[swapIndex]] =
                [shuffled[swapIndex], shuffled[index]];

        }

        return shuffled.slice(0, 4);

    }

    function startGame() {

        gameStarted = true;
        passed = false;
        frozen = false;

        currentLevelIndex = 0;

        score = 0;
        lives = MAX_LIVES;
        totalGameSeconds = 0;
        pendingRankingResult = null;

        memberRoster = pickMemberRoster();

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        scoreElement.textContent = "0";
        timeElement.textContent = formatTime(0);
        updateLivesDisplay();

        startTotalTimer();
        startLevel(currentLevelIndex);

    }

    function startLevel(levelIndex) {

        const config = LEVEL_CONFIGS[levelIndex];

        let built = null;

        for (let attempt = 0; attempt < 5 && !built; attempt++) {

            try {
                built = buildLevel(config, Math.random);
            } catch (error) {
                built = null;
            }

        }

        level = built;

        playerPos = { ...level.playerStart };
        playerDirection = "right";
        playerPendingDirection = "right";

        powerModeActive = false;
        chainIndex = 0;

        window.clearTimeout(powerModeTimeoutId);
        window.clearTimeout(powerWarningTimeoutId);

        levelElement.textContent = `${levelIndex + 1} / ${TOTAL_LEVELS}`;

        renderBoard(config);

        enemies = level.enemyStarts.map((start, index) => ({
            pos: { ...start },
            home: { ...start },
            member: memberRoster[index % memberRoster.length],
            element: null
        }));

        createEntityElements();

        window.clearInterval(playerTickIntervalId);
        window.clearInterval(enemyTickIntervalId);

        playerTickIntervalId = window.setInterval(playerTick, PLAYER_TICK_MS);
        enemyTickIntervalId = window.setInterval(enemyTick, config.enemyTickMs);

    }

    const cellElements = new Map();

    function renderBoard(config) {

        board.innerHTML = "";
        cellElements.clear();

        const tileCols = level.grid[0].length;
        const tileRows = level.grid.length;

        board.style.gridTemplateColumns =
            `repeat(${tileCols}, var(--devora-cell-size, 30px))`;

        board.style.gridTemplateRows =
            `repeat(${tileRows}, var(--devora-cell-size, 30px))`;

        for (let y = 0; y < tileRows; y++) {

            for (let x = 0; x < tileCols; x++) {

                const cell = document.createElement("div");

                const isWall = level.grid[y][x] === "#";
                const key = `${x},${y}`;

                cell.className = "devora-cell";
                cell.style.gridColumn = `${x + 1}`;
                cell.style.gridRow = `${y + 1}`;

                if (isWall) {
                    cell.classList.add("is-wall");
                } else if (level.pellets.has(key)) {
                    cell.classList.add("has-pellet");
                } else if (level.powerPellets.some((tile) => tile.x === x && tile.y === y)) {
                    cell.classList.add("has-power");
                }

                board.appendChild(cell);
                cellElements.set(key, cell);

            }

        }

    }

    function createEntityElements() {

        if (!playerElement) {

            playerElement = document.createElement("div");
            playerElement.className = "devora-player";

            const shape = document.createElement("div");
            shape.className = "devora-player-shape";

            playerElement.appendChild(shape);
            board.appendChild(playerElement);

        }

        updatePlayerElementPosition();

        enemies.forEach((enemy) => {

            const element = document.createElement("div");
            element.className = "devora-enemy";

            const shape = document.createElement("div");
            shape.className = "devora-enemy-shape";

            const img = document.createElement("img");
            img.src = enemy.member.image;
            img.alt = enemy.member.name;

            shape.appendChild(img);
            element.appendChild(shape);
            board.appendChild(element);

            enemy.element = element;

            updateEnemyElementPosition(enemy);

        });

    }

    function updatePlayerElementPosition() {

        playerElement.style.gridColumn = `${playerPos.x + 1}`;
        playerElement.style.gridRow = `${playerPos.y + 1}`;
        playerElement.dataset.direction = playerDirection;

    }

    function updateEnemyElementPosition(enemy) {

        enemy.element.style.gridColumn = `${enemy.pos.x + 1}`;
        enemy.element.style.gridRow = `${enemy.pos.y + 1}`;

        enemy.element.classList.toggle("is-vulnerable", powerModeActive);

    }

    function playerTick() {

        if (!gameStarted || frozen) {
            return;
        }

        const pendingDir = DIRECTIONS[playerPendingDirection];
        const currentDir = DIRECTIONS[playerDirection];

        let moveDir = playerDirection;

        if (pendingDir && isOpenTile(level.grid, playerPos.x + pendingDir.dx, playerPos.y + pendingDir.dy)) {
            moveDir = playerPendingDirection;
        } else if (!isOpenTile(level.grid, playerPos.x + currentDir.dx, playerPos.y + currentDir.dy)) {
            return;
        }

        const dir = DIRECTIONS[moveDir];

        playerDirection = moveDir;
        playerPos = { x: playerPos.x + dir.dx, y: playerPos.y + dir.dy };

        updatePlayerElementPosition();

        handlePelletPickup();
        checkCollisions();

        if (gameStarted && level.pellets.size === 0 && level.powerPellets.length === 0) {
            handleLevelCleared();
        }

    }

    function handlePelletPickup() {

        const key = `${playerPos.x},${playerPos.y}`;

        if (level.pellets.has(key)) {

            level.pellets.delete(key);

            const cell = cellElements.get(key);
            if (cell) {
                cell.classList.remove("has-pellet");
            }

            score += PELLET_POINTS;
            scoreElement.textContent = `${score}`;

            return;

        }

        const powerIndex = level.powerPellets.findIndex(
            (tile) => tile.x === playerPos.x && tile.y === playerPos.y
        );

        if (powerIndex !== -1) {

            level.powerPellets.splice(powerIndex, 1);

            const cell = cellElements.get(key);
            if (cell) {
                cell.classList.remove("has-power");
            }

            score += POWER_PELLET_POINTS;
            scoreElement.textContent = `${score}`;

            showScoreAnimation(`+${POWER_PELLET_POINTS}`);

            activatePowerMode();

        }

    }

    function activatePowerMode() {

        const config = LEVEL_CONFIGS[currentLevelIndex];

        powerModeActive = true;
        chainIndex = 0;

        enemies.forEach((enemy) => {
            enemy.element.classList.add("is-vulnerable");
            enemy.element.classList.remove("is-blinking");
        });

        window.clearTimeout(powerModeTimeoutId);
        window.clearTimeout(powerWarningTimeoutId);

        powerWarningTimeoutId = window.setTimeout(() => {

            enemies.forEach((enemy) => {
                enemy.element.classList.add("is-blinking");
            });

        }, Math.max(0, config.powerDurationMs - POWER_WARNING_MS));

        powerModeTimeoutId = window.setTimeout(() => {

            powerModeActive = false;

            enemies.forEach((enemy) => {
                enemy.element.classList.remove("is-vulnerable", "is-blinking");
            });

        }, config.powerDurationMs);

    }

    function checkCollisions() {

        enemies.forEach((enemy) => {

            if (enemy.pos.x !== playerPos.x || enemy.pos.y !== playerPos.y) {
                return;
            }

            if (powerModeActive) {

                const points = computeChainPoints(chainIndex);

                score += points;
                chainIndex++;

                scoreElement.textContent = `${score}`;
                showScoreAnimation(`+${points}`);

                successSound.currentTime = 0;
                successSound.play().catch(() => { });

                enemy.pos = { ...enemy.home };
                updateEnemyElementPosition(enemy);

            } else {

                handlePlayerHit();

            }

        });

    }

    function handlePlayerHit() {

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

        window.setTimeout(() => {

            playerPos = { ...level.playerStart };
            playerDirection = "right";
            playerPendingDirection = "right";

            updatePlayerElementPosition();

            enemies.forEach((enemy) => {
                enemy.pos = { ...enemy.home };
                updateEnemyElementPosition(enemy);
            });

            frozen = false;

        }, HIT_FREEZE_MS);

    }

    function enemyTick() {

        if (!gameStarted || frozen || !level) {
            return;
        }

        enemies.forEach((enemy) => {

            const mode = powerModeActive ? "flee" : "chase";
            const directionName = chooseEnemyDirection(level.grid, enemy.pos, playerPos, mode);

            if (!directionName) {
                return;
            }

            const dir = DIRECTIONS[directionName];

            enemy.pos = { x: enemy.pos.x + dir.dx, y: enemy.pos.y + dir.dy };

            updateEnemyElementPosition(enemy);

        });

        checkCollisions();

    }

    function handleLevelCleared() {

        window.clearInterval(playerTickIntervalId);
        window.clearInterval(enemyTickIntervalId);

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        const isLastLevel = currentLevelIndex === TOTAL_LEVELS - 1;

        if (isLastLevel) {
            finishGame(true);
            return;
        }

        frozen = true;

        window.setTimeout(() => {

            currentLevelIndex++;
            frozen = false;

            startLevel(currentLevelIndex);

        }, 1200);

    }

    function showScoreAnimation(text) {

        scoreAnimation.textContent = text;

        scoreAnimation.classList.remove("show", "positive", "negative");

        void scoreAnimation.offsetWidth;

        scoreAnimation.classList.add("show", "positive");

        setTimeout(() => {
            scoreAnimation.classList.remove("show");
        }, 750);

    }

    function updateLivesDisplay() {
        livesElement.textContent = "❤️".repeat(Math.max(lives, 0)) || "—";
    }

    function startTotalTimer() {

        window.clearInterval(totalTimerInterval);

        totalTimerInterval = setInterval(() => {

            totalGameSeconds++;
            timeElement.textContent = formatTime(totalGameSeconds);

        }, 1000);

    }

    async function finishGame(didWin) {

        gameStarted = false;
        passed = didWin;

        window.clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        window.clearInterval(playerTickIntervalId);
        window.clearInterval(enemyTickIntervalId);

        window.clearTimeout(powerModeTimeoutId);
        window.clearTimeout(powerWarningTimeoutId);

        const finalScore = score;
        const finalTime = totalGameSeconds;
        const formattedTime = formatTime(finalTime);
        const levelsCleared = didWin ? TOTAL_LEVELS : currentLevelIndex;

        if (didWin) {

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
            resultLabel.textContent = "Desafío superado";
            resultTitle.textContent = "¡Limpiaste los 3 salones!";

            resultText.textContent =
                `Conseguiste ${finalScore} puntos en ${formattedTime} con ${lives} ${lives === 1 ? "vida" : "vidas"} de sobra.`;

            resultButtonText.textContent = "Continuar";

            localStorage.setItem("fourteenthGameUnlocked", "true");

        } else {

            defeatSound.currentTime = 0;
            defeatSound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-heart-crack"></i>';
            resultLabel.textContent = "Fin de la partida";
            resultTitle.textContent = "¡Te atraparon!";

            resultText.textContent =
                `Llegaste al salón ${currentLevelIndex + 1} de ${TOTAL_LEVELS} con ${finalScore} puntos.`;

            resultButtonText.textContent = "Intentar nuevamente";

        }

        if (didWin) {

            const rankingOpened = await processRankingResult(finalScore, finalTime, levelsCleared);

            if (rankingOpened) {
                return;
            }

        }

        setTimeout(() => {
            showModal(resultModal);
        }, 500);

    }

    async function processRankingResult(finalScore, finalTime, levelsCleared) {

        try {

            const result = await checkTriviaResult(
                GAME_ID,
                finalScore,
                finalTime,
                lives
            );

            if (!result.newPersonalRecord) {
                return false;
            }

            pendingRankingResult = {
                ...result,
                score: finalScore,
                time: finalTime,
                lives,
                levelsCleared
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
        frozen = false;

        window.clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        window.clearInterval(playerTickIntervalId);
        window.clearInterval(enemyTickIntervalId);

        window.clearTimeout(powerModeTimeoutId);
        window.clearTimeout(powerWarningTimeoutId);

        currentLevelIndex = 0;
        score = 0;
        lives = MAX_LIVES;
        totalGameSeconds = 0;
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
        scoreElement.textContent = "0";
        timeElement.textContent = formatTime(0);
        updateLivesDisplay();

        board.innerHTML = "";
        cellElements.clear();
        playerElement = null;
        enemies = [];

    }

    function formatTime(totalSeconds) {

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );

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
