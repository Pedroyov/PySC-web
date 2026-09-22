import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID = "arkanoid";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 640;

const BRICK_COLS = 14;
const BRICK_ROWS = 8;
const BRICK_WIDTH = 36;
const BRICK_HEIGHT = 18;
const BRICK_GAP = 4;
const BRICK_MARGIN_X = 20;
const BRICK_MARGIN_TOP = 40;

const PADDLE_WIDTH_DEFAULT = 90;
const PADDLE_HEIGHT = 14;
const PADDLE_BOTTOM_OFFSET = 30;
const KEYBOARD_PADDLE_SPEED = 480; // px/s

const BALL_RADIUS = 8;
const BALL_BASE_SPEED = 260; // px/s en el nivel 1
const BALL_SPEED_PER_LEVEL = 18; // incremento por nivel

const MAX_LIVES_START = 3;
const MAX_LIVES_CAP = 5;

const BRICK_POINTS = 10;

const POWERUP_DROP_CHANCE = 0.22;
const POWERUP_SIZE = 26;
const POWERUP_FALL_SPEED = 150; // px/s

const PIERCE_DURATION_MS = 8000;
const BIG_PADDLE_DURATION_MS = 12000;
const FAST_BALL_DURATION_MS = 10000;

const BIG_PADDLE_MULTIPLIER = 1.6;
const FAST_BALL_MULTIPLIER = 1.35;

const POWERUP_TYPES = [
    { id: "multiball", color: "#e53935", icon: "×2" },
    { id: "bigPaddle", color: "#43a047", icon: "▭" },
    { id: "fastBall", color: "#1e88e5", icon: "»" },
    { id: "pierce", color: "#fdd835", icon: "◆" },
    { id: "extraLife", color: "#8e24aa", icon: "♥" }
];

/*
 * Cada nivel es una figura de bloques dibujada como una grilla
 * de 14×8 celdas ("1" = bloque, "0" = espacio vacío).
 */
const LEVEL_SHAPES = [

    // Nivel 1: estrella
    [
        "00000011000000",
        "00000011000000",
        "00100001100100",
        "00010111101000",
        "11111111111111",
        "00010111101000",
        "00100001100100",
        "00000011000000"
    ],

    // Nivel 2: rombo
    [
        "00000011000000",
        "00000111100000",
        "00001111110000",
        "00011111111000",
        "00111111111100",
        "00011111111000",
        "00001111110000",
        "00000111100000"
    ],

    // Nivel 3: cruz
    [
        "00000111100000",
        "00000111100000",
        "11111111111111",
        "11111111111111",
        "11111111111111",
        "11111111111111",
        "00000111100000",
        "00000111100000"
    ],

    // Nivel 4: corazón
    [
        "01100000000110",
        "11110000001111",
        "11111000111111",
        "11111101111111",
        "11111111111111",
        "01111111111110",
        "00111111111100",
        "00011111111000"
    ],

    // Nivel 5: corona
    [
        "11001100110011",
        "11001100110011",
        "11111111111111",
        "11111111111111",
        "11111111111111",
        "11111111111111",
        "11111111111111",
        "11111111111111"
    ]

];

const TOTAL_LEVELS = LEVEL_SHAPES.length;

/* ==================================================
   FÍSICA (funciones puras)
================================================== */

const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;

function reflectOffPaddle(ballX, paddleX, paddleWidth) {

    const paddleCenter = paddleX + paddleWidth / 2;
    const hitOffset = (ballX - paddleCenter) / (paddleWidth / 2);
    const clampedOffset = Math.max(-1, Math.min(1, hitOffset));

    const angle = clampedOffset * MAX_BOUNCE_ANGLE;

    return {
        dirX: Math.sin(angle),
        dirY: -Math.abs(Math.cos(angle))
    };

}

function circleRectCollision(circle, rect) {

    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > circle.radius * circle.radius) {
        return { hit: false };
    }

    const overlapLeft = (circle.x + circle.radius) - rect.x;
    const overlapRight = (rect.x + rect.width) - (circle.x - circle.radius);
    const overlapTop = (circle.y + circle.radius) - rect.y;
    const overlapBottom = (rect.y + rect.height) - (circle.y - circle.radius);

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    let side = "top";

    if (minOverlap === overlapLeft) side = "left";
    else if (minOverlap === overlapRight) side = "right";
    else if (minOverlap === overlapTop) side = "top";
    else if (minOverlap === overlapBottom) side = "bottom";

    return { hit: true, side };

}

function resolveWallBounce(ball, canvasWidth) {

    let dirX = ball.dirX;
    let dirY = ball.dirY;
    let x = ball.x;

    if (x - ball.radius <= 0) {
        x = ball.radius;
        dirX = Math.abs(dirX);
    } else if (x + ball.radius >= canvasWidth) {
        x = canvasWidth - ball.radius;
        dirX = -Math.abs(dirX);
    }

    let y = ball.y;

    if (y - ball.radius <= 0) {
        y = ball.radius;
        dirY = Math.abs(dirY);
    }

    return { x, y, dirX, dirY };

}

function clampPaddleX(x, paddleWidth, canvasWidth) {

    return Math.max(0, Math.min(x, canvasWidth - paddleWidth));

}

function isLevelCleared(bricks) {

    return bricks.every((brick) => !brick.alive);

}

function reflectOffBrickSide(ball, side) {

    if (side === "left" || side === "right") {
        return { dirX: -ball.dirX, dirY: ball.dirY };
    }

    return { dirX: ball.dirX, dirY: -ball.dirY };

}

function buildBricksForLevel(levelIndex) {

    const mask = LEVEL_SHAPES[levelIndex % LEVEL_SHAPES.length];
    const bricks = [];

    for (let row = 0; row < BRICK_ROWS; row++) {

        for (let col = 0; col < BRICK_COLS; col++) {

            if (mask[row][col] !== "1") {
                continue;
            }

            bricks.push({
                col,
                row,
                x: BRICK_MARGIN_X + col * (BRICK_WIDTH + BRICK_GAP),
                y: BRICK_MARGIN_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                alive: true
            });

        }

    }

    return bricks;

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

    const gameStage = document.getElementById("arkanoidGameStage");
    const startButton = document.getElementById("arkanoidStartButton");
    const resetButton = document.getElementById("arkanoidResetButton");
    const countdown = document.getElementById("loveCountdown");
    const countdownText = document.getElementById("loveCountdownText");

    const boardWrap = document.getElementById("arkanoidBoardWrap");
    const canvas = document.getElementById("arkanoidCanvas");
    const launchHint = document.getElementById("arkanoidLaunchHint");

    const levelElement = document.getElementById("arkanoidLevel");
    const scoreElement = document.getElementById("arkanoidScore");
    const livesElement = document.getElementById("arkanoidLives");
    const timeElement = document.getElementById("arkanoidTime");
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
    const hitSound = new Audio("../audio/hit.mp3");

    if (
        !gameStage || !startButton || !resetButton || !countdown ||
        !countdownText || !boardWrap || !canvas || !launchHint ||
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
            "No se encontraron todos los elementos necesarios de Arkanoid."
        );

        throw new Error(
            "Faltan elementos HTML de Arkanoid."
        );

    }

    const ctx = canvas.getContext("2d");

    let gameStarted = false;
    let passed = false;

    let currentLevelIndex = 0;
    let bricks = [];
    let balls = [];
    let powerUps = [];
    let ballLaunched = false;

    let paddle = { x: (CANVAS_WIDTH - PADDLE_WIDTH_DEFAULT) / 2, width: PADDLE_WIDTH_DEFAULT };
    let paddleY = CANVAS_HEIGHT - PADDLE_BOTTOM_OFFSET - PADDLE_HEIGHT;

    let keysPressed = new Set();

    let score = 0;
    let lives = MAX_LIVES_START;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;

    let bigPaddleUntil = 0;
    let fastBallUntil = 0;
    let pierceUntil = 0;

    let pendingRankingResult = null;

    let animationFrameId = null;
    let lastFrameTime = 0;

    startButton.addEventListener("click", startCountdown);
    resetButton.addEventListener("click", restartGame);

    resultButton.addEventListener("click", () => {

        hideModal(resultModal);

        if (!passed) {
            restartGame();
        }

    });

    canvas.addEventListener("mousemove", (event) => {

        if (!gameStarted) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const relativeX = (event.clientX - rect.left) * scaleX;

        paddle.x = clampPaddleX(relativeX - paddle.width / 2, paddle.width, CANVAS_WIDTH);

    });

    canvas.addEventListener("touchmove", (event) => {

        if (!gameStarted || !event.touches.length) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const relativeX = (event.touches[0].clientX - rect.left) * scaleX;

        paddle.x = clampPaddleX(relativeX - paddle.width / 2, paddle.width, CANVAS_WIDTH);

        event.preventDefault();

    }, { passive: false });

    canvas.addEventListener("touchstart", () => {

        if (gameStarted && !ballLaunched) {
            launchBall();
        }

    }, { passive: true });

    canvas.addEventListener("click", () => {

        if (gameStarted && !ballLaunched) {
            launchBall();
        }

    });

    window.addEventListener("keydown", (event) => {

        if (!gameStarted) {
            return;
        }

        if (
            event.key === "ArrowLeft" || event.key === "a" || event.key === "A" ||
            event.key === "ArrowRight" || event.key === "d" || event.key === "D"
        ) {

            keysPressed.add(event.key);

            if (!ballLaunched) {
                launchBall();
            }

            event.preventDefault();

        } else if (event.key === " " || event.key === "ArrowUp") {

            if (!ballLaunched) {
                launchBall();
            }

            event.preventDefault();

        }

    });

    window.addEventListener("keyup", (event) => {
        keysPressed.delete(event.key);
    });

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
        score = 0;
        lives = MAX_LIVES_START;
        totalGameSeconds = 0;
        pendingRankingResult = null;

        bigPaddleUntil = 0;
        fastBallUntil = 0;
        pierceUntil = 0;

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        scoreElement.textContent = "0";
        livesElement.textContent = "❤️".repeat(lives);
        timeElement.textContent = formatTime(0);

        loadLevel(currentLevelIndex);

        window.clearInterval(totalTimerInterval);

        totalTimerInterval = window.setInterval(() => {

            totalGameSeconds++;

            timeElement.textContent = formatTime(totalGameSeconds);

        }, 1000);

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        window.cancelAnimationFrame(animationFrameId);
        lastFrameTime = performance.now();
        animationFrameId = window.requestAnimationFrame(gameLoop);

    }

    function loadLevel(levelIndex) {

        bricks = buildBricksForLevel(levelIndex);
        powerUps = [];

        paddle = {
            x: (CANVAS_WIDTH - PADDLE_WIDTH_DEFAULT) / 2,
            width: PADDLE_WIDTH_DEFAULT
        };

        bigPaddleUntil = 0;
        fastBallUntil = 0;
        pierceUntil = 0;

        levelElement.textContent = `${levelIndex + 1} / ${TOTAL_LEVELS}`;

        resetBallOnPaddle();

    }

    function resetBallOnPaddle() {

        ballLaunched = false;

        balls = [{
            x: paddle.x + paddle.width / 2,
            y: paddleY - BALL_RADIUS - 1,
            dirX: 0,
            dirY: -1,
            radius: BALL_RADIUS
        }];

        launchHint.textContent =
            "Toca, haz clic o presiona una flecha para lanzar la pelota";

    }

    function launchBall() {

        ballLaunched = true;
        launchHint.textContent = "";

        const ball = balls[0];

        const randomAngle = (Math.random() * 40 - 20) * (Math.PI / 180);

        ball.dirX = Math.sin(randomAngle);
        ball.dirY = -Math.abs(Math.cos(randomAngle));

    }

    function getCurrentBallSpeed() {

        const base =
            BALL_BASE_SPEED + currentLevelIndex * BALL_SPEED_PER_LEVEL;

        const isFast = performance.now() < fastBallUntil;

        return isFast ? base * FAST_BALL_MULTIPLIER : base;

    }

    function gameLoop(timestamp) {

        if (!gameStarted) {
            return;
        }

        const deltaSeconds =
            Math.min(0.05, (timestamp - lastFrameTime) / 1000);

        lastFrameTime = timestamp;

        updatePaddleFromKeyboard(deltaSeconds);
        updatePowerUpEffectsExpiry();

        if (ballLaunched) {
            updateBalls(deltaSeconds);
        } else {
            balls[0].x = paddle.x + paddle.width / 2;
        }

        updatePowerUps(deltaSeconds);

        render();

        if (gameStarted) {
            animationFrameId = window.requestAnimationFrame(gameLoop);
        }

    }

    function updatePaddleFromKeyboard(deltaSeconds) {

        let moveDir = 0;

        if (keysPressed.has("ArrowLeft") || keysPressed.has("a") || keysPressed.has("A")) {
            moveDir -= 1;
        }

        if (keysPressed.has("ArrowRight") || keysPressed.has("d") || keysPressed.has("D")) {
            moveDir += 1;
        }

        if (moveDir !== 0) {

            paddle.x = clampPaddleX(
                paddle.x + moveDir * KEYBOARD_PADDLE_SPEED * deltaSeconds,
                paddle.width,
                CANVAS_WIDTH
            );

        }

    }

    function updatePowerUpEffectsExpiry() {

        const now = performance.now();

        if (bigPaddleUntil && now >= bigPaddleUntil) {

            bigPaddleUntil = 0;
            paddle.width = PADDLE_WIDTH_DEFAULT;

        }

    }

    function updateBalls(deltaSeconds) {

        const speed = getCurrentBallSpeed();
        const piercingActive = performance.now() < pierceUntil;

        const paddleRect = {
            x: paddle.x,
            y: paddleY,
            width: paddle.width,
            height: PADDLE_HEIGHT
        };

        const remainingBalls = [];

        balls.forEach((ball) => {

            ball.x += ball.dirX * speed * deltaSeconds;
            ball.y += ball.dirY * speed * deltaSeconds;

            const walled = resolveWallBounce(ball, CANVAS_WIDTH);

            ball.x = walled.x;
            ball.y = walled.y;
            ball.dirX = walled.dirX;
            ball.dirY = walled.dirY;

            if (ball.dirY > 0) {

                const paddleHit = circleRectCollision(ball, paddleRect);

                if (paddleHit.hit) {

                    const reflected = reflectOffPaddle(ball.x, paddle.x, paddle.width);

                    ball.dirX = reflected.dirX;
                    ball.dirY = reflected.dirY;
                    ball.y = paddleY - ball.radius - 0.5;

                    hitSound.currentTime = 0;
                    hitSound.play().catch(() => { });

                }

            }

            let brickHitThisFrame = false;

            for (const brick of bricks) {

                if (!brick.alive || brickHitThisFrame) {
                    continue;
                }

                const brickHit = circleRectCollision(ball, brick);

                if (!brickHit.hit) {
                    continue;
                }

                brick.alive = false;
                brickHitThisFrame = true;

                score += BRICK_POINTS;
                scoreElement.textContent = `${score}`;
                showScorePop(BRICK_POINTS);

                maybeSpawnPowerUp(brick);

                if (!piercingActive) {

                    const reflected = reflectOffBrickSide(ball, brickHit.side);

                    ball.dirX = reflected.dirX;
                    ball.dirY = reflected.dirY;

                }

            }

            if (ball.y - ball.radius > CANVAS_HEIGHT) {
                return; // esta bola se pierde, no se agrega a remainingBalls
            }

            remainingBalls.push(ball);

        });

        balls = remainingBalls;

        if (balls.length === 0) {

            handleBallLost();
            return;

        }

        if (isLevelCleared(bricks)) {
            handleLevelCleared();
        }

    }

    function maybeSpawnPowerUp(brick) {

        if (Math.random() >= POWERUP_DROP_CHANCE) {
            return;
        }

        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

        powerUps.push({
            x: brick.x + brick.width / 2 - POWERUP_SIZE / 2,
            y: brick.y,
            width: POWERUP_SIZE,
            height: POWERUP_SIZE,
            type: type.id,
            color: type.color,
            icon: type.icon
        });

    }

    function updatePowerUps(deltaSeconds) {

        const paddleRect = {
            x: paddle.x,
            y: paddleY,
            width: paddle.width,
            height: PADDLE_HEIGHT
        };

        powerUps = powerUps.filter((powerUp) => {

            powerUp.y += POWERUP_FALL_SPEED * deltaSeconds;

            const overlapsX =
                powerUp.x + powerUp.width >= paddleRect.x &&
                powerUp.x <= paddleRect.x + paddleRect.width;

            const overlapsY =
                powerUp.y + powerUp.height >= paddleRect.y &&
                powerUp.y <= paddleRect.y + paddleRect.height;

            if (overlapsX && overlapsY) {

                applyPowerUp(powerUp.type);

                return false;

            }

            return powerUp.y <= CANVAS_HEIGHT;

        });

    }

    function applyPowerUp(type) {

        const now = performance.now();

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        if (type === "multiball") {

            if (!ballLaunched) {
                return;
            }

            const clones = balls.map((ball) => ({
                ...ball,
                dirX: -ball.dirX
            }));

            balls = balls.concat(clones);

        } else if (type === "bigPaddle") {

            paddle.width = PADDLE_WIDTH_DEFAULT * BIG_PADDLE_MULTIPLIER;

            paddle.x = clampPaddleX(paddle.x, paddle.width, CANVAS_WIDTH);

            bigPaddleUntil = now + BIG_PADDLE_DURATION_MS;

        } else if (type === "fastBall") {

            fastBallUntil = now + FAST_BALL_DURATION_MS;

        } else if (type === "pierce") {

            pierceUntil = now + PIERCE_DURATION_MS;

        } else if (type === "extraLife") {

            lives = Math.min(lives + 1, MAX_LIVES_CAP);
            livesElement.textContent = "❤️".repeat(lives);

        }

    }

    function handleBallLost() {

        lives--;

        livesElement.textContent =
            lives > 0 ? "❤️".repeat(lives) : "💔";

        if (lives <= 0) {

            finishGame(false);
            return;

        }

        paddle.width = PADDLE_WIDTH_DEFAULT;
        bigPaddleUntil = 0;
        fastBallUntil = 0;
        pierceUntil = 0;
        powerUps = [];

        resetBallOnPaddle();

    }

    function handleLevelCleared() {

        successSound.currentTime = 0;
        successSound.play().catch(() => { });

        if (currentLevelIndex >= TOTAL_LEVELS - 1) {

            finishGame(true);
            return;

        }

        gameStarted = false;

        launchHint.textContent = `¡Salón ${currentLevelIndex + 1} superado!`;

        window.setTimeout(() => {

            currentLevelIndex++;
            gameStarted = true;
            loadLevel(currentLevelIndex);

            lastFrameTime = performance.now();
            animationFrameId = window.requestAnimationFrame(gameLoop);

        }, 1300);

    }

    function render() {

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        bricks.forEach((brick) => {

            if (!brick.alive) {
                return;
            }

            const hue = 40 - brick.row * 3;

            ctx.fillStyle = `hsl(${hue}, 65%, ${55 - brick.row * 2}%)`;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

            ctx.strokeStyle = "rgba(255,255,255,0.18)";
            ctx.lineWidth = 1;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        });

        powerUps.forEach((powerUp) => {

            ctx.beginPath();
            ctx.fillStyle = powerUp.color;

            ctx.arc(
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2,
                powerUp.width / 2,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle = "#0b1224";
            ctx.font = "bold 12px Montserrat, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(
                powerUp.icon,
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2 + 1
            );

        });

        ctx.fillStyle = "#d6b04a";
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddleY, paddle.width, PADDLE_HEIGHT, 6);
        ctx.fill();

        balls.forEach((ball) => {

            ctx.beginPath();
            ctx.fillStyle = "#ffe6a8";
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();

        });

    }

    function showScorePop(value) {

        scoreAnimation.textContent = `+${value}`;
        scoreAnimation.className = "score-animation positive";

        scoreAnimation.classList.add("show");

        window.setTimeout(() => {
            scoreAnimation.classList.remove("show");
        }, 700);

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

        window.cancelAnimationFrame(animationFrameId);

        window.clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        const finalScore = score;
        const finalTime = totalGameSeconds;
        const finalLives = lives;
        const formattedTime = formatTime(finalTime);

        if (didWin) {

            localStorage.setItem("twelfthGameUnlocked", "true");

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
            resultLabel.textContent = "Desafío completado";
            resultTitle.textContent = "¡Los 5 salones están limpios!";

            resultText.textContent =
                `Llegaste a ${finalScore} puntos en ${formattedTime} ` +
                `con ${finalLives} ${finalLives === 1 ? "vida" : "vidas"}.`;

            resultButtonText.textContent = "Continuar";

        } else {

            defeatSound.currentTime = 0;
            defeatSound.play().catch(() => { });

            resultIcon.innerHTML = '<i class="fa-solid fa-heart-crack"></i>';
            resultLabel.textContent = "Fin de la partida";
            resultTitle.textContent = "¡Se te cayeron todas las pelotas!";

            resultText.textContent =
                `Llegaste al salón ${currentLevelIndex + 1} con ${finalScore} puntos en ${formattedTime}.`;

            resultButtonText.textContent = "Intentar nuevamente";

        }

        if (didWin) {

            const rankingOpened = await processRankingResult(finalScore, finalTime, finalLives);

            if (rankingOpened) {
                return;
            }

        }

        setTimeout(() => {
            showModal(resultModal);
        }, 500);

    }

    async function processRankingResult(finalScore, finalTime, finalLives) {

        try {

            const result = await checkTriviaResult(
                GAME_ID,
                finalScore,
                finalTime,
                finalLives
            );

            if (!result.newPersonalRecord) {
                return false;
            }

            pendingRankingResult = {
                ...result,
                score: finalScore,
                time: finalTime,
                lives: finalLives
            };

            const livesText =
                finalLives === 1 ? "1 vida" : `${finalLives} vidas`;

            rankingModalScore.textContent =
                `${finalScore} puntos · ${formatTime(finalTime)} · ${livesText}`;

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

                const livesText =
                    player.lives === 1 ? "1 vida" : `${player.lives} vidas`;

                item.innerHTML = `
          <span class="leaderboard-position">
            ${positionContent}
          </span>

          <span class="leaderboard-player">
            ${player.name}
          </span>

          <strong class="leaderboard-score">
            ${player.score} puntos · ${formatTime(player.time)} · ${livesText}
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
        score = 0;
        lives = MAX_LIVES_START;
        totalGameSeconds = 0;
        pendingRankingResult = null;

        bigPaddleUntil = 0;
        fastBallUntil = 0;
        pierceUntil = 0;
        powerUps = [];
        keysPressed.clear();

        window.cancelAnimationFrame(animationFrameId);

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

        levelElement.textContent = `1 / ${TOTAL_LEVELS}`;
        scoreElement.textContent = "0";
        livesElement.textContent = "❤️".repeat(MAX_LIVES_START);
        timeElement.textContent = formatTime(0);
        launchHint.textContent = "";

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
