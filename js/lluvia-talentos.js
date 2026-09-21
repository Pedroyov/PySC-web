import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID = "lluvia-talentos";

const TARGET_SCORE = 500;
const MAX_LIVES = 3;

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

const OBJECTS = [
    { name: "Audífonos", image: "../img/juegos/objetos/audifonos.png" },
    { name: "Cama", image: "../img/juegos/objetos/cama.png" },
    { name: "Celular", image: "../img/juegos/objetos/celular.png" },
    { name: "Cerveza", image: "../img/juegos/objetos/cerveza.png" },
    { name: "Dinero", image: "../img/juegos/objetos/dinero.png" },
    { name: "Hamburguesa", image: "../img/juegos/objetos/hamburguesa.png" },
    { name: "Piedra", image: "../img/juegos/objetos/piedra.png" },
    { name: "Sombrero", image: "../img/juegos/objetos/sombrero.png" },
    { name: "Televisor", image: "../img/juegos/objetos/tele.png" },
    { name: "Tijera", image: "../img/juegos/objetos/tijera.png" }
];

/*
 * Parámetros de dificultad. Van cambiando con el tiempo
 * transcurrido de la partida (no con el puntaje), desde
 * el valor "inicial" hasta el "mínimo/máximo" según
 * corresponda, usando DIFFICULTY_RAMP_SECONDS como el
 * tiempo que toma llegar al límite más difícil.
 */

const DIFFICULTY_RAMP_SECONDS = 32;

const SPAWN_INTERVAL_START = 950;
const SPAWN_INTERVAL_MIN = 360;

const FALL_SPEED_START = 0.14;
const FALL_SPEED_MAX = 0.34;

const OBJECT_CHANCE_START = 0.3;
const OBJECT_CHANCE_MAX = 0.6;

const CATCH_RADIUS = 58;
const ITEM_SIZE = 62;

/*
 * Desvío de rumbo: cada objeto que cae tiene una
 * probabilidad de, en algún punto de su caída, empezar
 * a moverse también hacia un lado (no siempre recto).
 * DRIFT_CHANCE = probabilidad de que un ítem desvíe.
 * DRIFT_SPEED_MIN/MAX = velocidad horizontal del desvío.
 */

const DRIFT_CHANCE = 0.55;
const DRIFT_SPEED_MIN = 0.045;
const DRIFT_SPEED_MAX = 0.11;

document.addEventListener("DOMContentLoaded", () => {

    const secretRoomUnlocked =
        localStorage.getItem(
            "secretRoomUnlocked"
        ) === "true";

    if (!secretRoomUnlocked) {
        window.location.replace("../index.html");
        return;
    }

    const gameStage =
        document.getElementById("talentosGameStage");

    const startButton =
        document.getElementById("talentosStartButton");

    const resetButton =
        document.getElementById("talentosResetButton");

    const countdown =
        document.getElementById("loveCountdown");

    const countdownText =
        document.getElementById("loveCountdownText");

    const board =
        document.getElementById("talentosBoard");

    const fallLayer =
        document.getElementById("talentosFallLayer");

    const basket =
        document.getElementById("talentosBasket");

    const feedback =
        document.getElementById("talentosFeedback");

    const scoreElement =
        document.getElementById("talentosScore");

    const livesElement =
        document.getElementById("talentosLives");

    const timeElement =
        document.getElementById("talentosTime");

    const scoreAnimation =
        document.getElementById("scoreAnimation");

    const resultModal =
        document.getElementById("loveUnlockModal");

    const resultIcon =
        document.getElementById("loveUnlockIcon");

    const resultLabel =
        document.getElementById("loveUnlockLabel");

    const resultTitle =
        document.getElementById("loveUnlockTitle");

    const resultText =
        document.getElementById("loveUnlockText");

    const resultButtonText =
        document.getElementById("loveUnlockButtonText");

    const resultButton =
        document.getElementById("loveUnlockButton");

    const rankingModal =
        document.getElementById("rankingModal");

    const rankingModalTitle =
        document.getElementById("rankingModalTitle");

    const rankingModalText =
        document.getElementById("rankingModalText");

    const rankingModalScore =
        document.getElementById("rankingModalScore");

    const rankingNameGroup =
        document.getElementById("rankingNameGroup");

    const rankingPlayerName =
        document.getElementById("rankingPlayerName");

    const rankingNameError =
        document.getElementById("rankingNameError");

    const rankingSaveButton =
        document.getElementById("rankingSaveButton");

    const leaderboardModal =
        document.getElementById("leaderboardModal");

    const leaderboardList =
        document.getElementById("leaderboardList");

    const leaderboardLoading =
        document.getElementById("leaderboardLoading");

    const leaderboardEmpty =
        document.getElementById("leaderboardEmpty");

    const leaderboardOpenButton =
        document.getElementById("leaderboardOpenButton");

    const leaderboardCloseButton =
        document.getElementById("leaderboardCloseButton");

    const correctSound =
        new Audio("../audio/hit.mp3");

    const wrongSound =
        new Audio("../audio/wrong.mp3");

    const victorySound =
        new Audio("../audio/victory.mp3");

    const defeatSound =
        new Audio("../audio/gameover.mp3");

    const startSound =
        new Audio("../audio/start.mp3");

    if (
        !gameStage ||
        !startButton ||
        !resetButton ||
        !countdown ||
        !countdownText ||
        !board ||
        !fallLayer ||
        !basket ||
        !feedback ||
        !scoreElement ||
        !livesElement ||
        !timeElement ||
        !scoreAnimation ||
        !resultModal ||
        !resultIcon ||
        !resultLabel ||
        !resultTitle ||
        !resultText ||
        !resultButtonText ||
        !resultButton ||
        !rankingModal ||
        !rankingModalTitle ||
        !rankingModalText ||
        !rankingModalScore ||
        !rankingNameGroup ||
        !rankingPlayerName ||
        !rankingNameError ||
        !rankingSaveButton ||
        !leaderboardModal ||
        !leaderboardList ||
        !leaderboardLoading ||
        !leaderboardEmpty ||
        !leaderboardOpenButton ||
        !leaderboardCloseButton
    ) {

        console.error(
            "No se encontraron todos los elementos necesarios de Atrápalo."
        );

        throw new Error(
            "Faltan elementos HTML de Atrápalo."
        );

    }

    let gameStarted = false;
    let score = 0;
    let lives = MAX_LIVES;
    let streak = 0;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;
    let pendingRankingResult = null;
    let passed = false;

    let boardWidth = 0;
    let boardHeight = 0;
    let catchLineY = 0;

    let basketX = 0;

    let fallingItems = [];
    let nextItemId = 0;

    let animationFrameId = null;
    let lastFrameTime = 0;
    let spawnAccumulator = 0;
    let feedbackTimeout = null;

    startButton.addEventListener(
        "click",
        startCountdown
    );

    resetButton.addEventListener(
        "click",
        restartGame
    );

    resultButton.addEventListener(
        "click",
        () => {

            hideModal(resultModal);

            if (!passed) {
                restartGame();
            }

        }
    );

    rankingSaveButton.addEventListener(
        "click",
        async () => {

            if (!pendingRankingResult) {
                return;
            }

            let playerName =
                pendingRankingResult.playerName;

            if (
                pendingRankingResult.qualifiesTop10 &&
                !pendingRankingResult.hasName
            ) {

                playerName =
                    rankingPlayerName.value.trim();

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
                    pendingRankingResult.correctAnswers,
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

                console.error(
                    "No se pudo guardar el récord:",
                    error
                );

                rankingNameError.textContent =
                    "No se pudo guardar. Inténtalo nuevamente.";

            } finally {

                rankingSaveButton.disabled = false;

            }

        }
    );

    leaderboardOpenButton.addEventListener(
        "click",
        openLeaderboard
    );

    leaderboardCloseButton.addEventListener(
        "click",
        () => {
            hideModal(leaderboardModal);
        }
    );

    board.addEventListener(
        "mousemove",
        (event) => {
            updateBasketFromClientX(event.clientX);
        }
    );

    board.addEventListener(
        "touchmove",
        (event) => {

            if (!event.touches.length) {
                return;
            }

            updateBasketFromClientX(
                event.touches[0].clientX
            );

            event.preventDefault();

        },
        { passive: false }
    );

    function updateBasketFromClientX(clientX) {

        if (!gameStarted) {
            return;
        }

        const boardRect =
            board.getBoundingClientRect();

        const relativeX =
            clientX - boardRect.left;

        basketX =
            clamp(
                relativeX,
                0,
                boardWidth
            );

        basket.style.left = `${basketX}px`;

    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function randomItem(items) {
        return items[
            Math.floor(Math.random() * items.length)
        ];
    }

    function showCountdownStep(text, isFinal) {

        countdownText.classList.remove(
            "is-changing",
            "is-final"
        );

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

        const steps = [
            "3",
            "2",
            "1",
            "¡A jugar!"
        ];

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
        score = 0;
        lives = MAX_LIVES;
        streak = 0;
        totalGameSeconds = 0;
        pendingRankingResult = null;
        passed = false;

        fallingItems.forEach((item) => {
            item.element.remove();
        });

        fallingItems = [];

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        scoreElement.textContent = `0 / ${TARGET_SCORE}`;
        livesElement.textContent = "❤️".repeat(lives);
        timeElement.textContent = formatTime(0);

        const boardRect =
            board.getBoundingClientRect();

        boardWidth = boardRect.width;
        boardHeight = boardRect.height;
        catchLineY = boardHeight - 74;

        basketX = boardWidth / 2;
        basket.style.left = `${basketX}px`;

        clearInterval(totalTimerInterval);

        totalTimerInterval = setInterval(() => {

            totalGameSeconds++;

            timeElement.textContent =
                formatTime(totalGameSeconds);

        }, 1000);

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        spawnAccumulator = 0;
        lastFrameTime = performance.now();

        cancelAnimationFrame(animationFrameId);

        animationFrameId =
            requestAnimationFrame(gameLoop);

    }

    function getDifficultyProgress() {

        return clamp(
            totalGameSeconds / DIFFICULTY_RAMP_SECONDS,
            0,
            1
        );

    }

    function getCurrentSpawnInterval() {

        const progress =
            getDifficultyProgress();

        return (
            SPAWN_INTERVAL_START -
            (SPAWN_INTERVAL_START - SPAWN_INTERVAL_MIN) *
            progress
        );

    }

    function getCurrentFallSpeed() {

        const progress =
            getDifficultyProgress();

        return (
            FALL_SPEED_START +
            (FALL_SPEED_MAX - FALL_SPEED_START) *
            progress
        );

    }

    function getCurrentObjectChance() {

        const progress =
            getDifficultyProgress();

        return (
            OBJECT_CHANCE_START +
            (OBJECT_CHANCE_MAX - OBJECT_CHANCE_START) *
            progress
        );

    }

    function spawnItem() {

        const isObject =
            Math.random() < getCurrentObjectChance();

        const data =
            isObject
                ? randomItem(OBJECTS)
                : randomItem(FACES);

        const element =
            document.createElement("div");

        element.className =
            isObject
                ? "talentos-item talentos-item-object"
                : "talentos-item talentos-item-face";

        const image =
            document.createElement("img");

        image.src = data.image;
        image.alt = data.name;

        element.appendChild(image);

        const margin = ITEM_SIZE / 2;

        const x =
            margin +
            Math.random() * Math.max(0, boardWidth - margin * 2);

        element.style.left = `${x}px`;
        element.style.top = "-80px";

        fallLayer.appendChild(element);

        const willDrift =
            Math.random() < DRIFT_CHANCE;

        const driftVx =
            willDrift
                ? (Math.random() < 0.5 ? -1 : 1) *
                  (DRIFT_SPEED_MIN +
                      Math.random() * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN))
                : 0;

        const driftTriggerY =
            willDrift
                ? catchLineY * (0.22 + Math.random() * 0.4)
                : Infinity;

        fallingItems.push({
            id: nextItemId++,
            element,
            image,
            data,
            isObject,
            x,
            y: -80,
            speed: getCurrentFallSpeed(),
            willDrift,
            driftVx,
            driftTriggerY,
            resolved: false
        });

    }

    function gameLoop(timestamp) {

        if (!gameStarted) {
            return;
        }

        const deltaTime =
            timestamp - lastFrameTime;

        lastFrameTime = timestamp;

        spawnAccumulator += deltaTime;

        const spawnInterval =
            getCurrentSpawnInterval();

        if (spawnAccumulator >= spawnInterval) {

            spawnAccumulator = 0;

            spawnItem();

        }

        fallingItems.forEach((item) => {

            if (item.resolved) {
                return;
            }

            item.y += item.speed * deltaTime;

            item.element.style.top = `${item.y}px`;

            if (item.willDrift && item.y >= item.driftTriggerY) {

                item.x += item.driftVx * deltaTime;

                const margin = ITEM_SIZE / 2;
                const minX = margin;
                const maxX = Math.max(margin, boardWidth - margin);

                if (item.x <= minX) {
                    item.x = minX;
                    item.driftVx = Math.abs(item.driftVx);
                } else if (item.x >= maxX) {
                    item.x = maxX;
                    item.driftVx = -Math.abs(item.driftVx);
                }

                item.element.style.left = `${item.x}px`;

            }

            if (item.y >= catchLineY) {

                resolveItem(item);

            }

        });

        fallingItems =
            fallingItems.filter(
                (item) => !item.readyToRemove
            );

        if (gameStarted) {

            animationFrameId =
                requestAnimationFrame(gameLoop);

        }

    }

    function resolveItem(item) {

        item.resolved = true;

        const horizontalDistance =
            Math.abs(item.x - basketX);

        const wasCaught =
            horizontalDistance <= CATCH_RADIUS;

        if (wasCaught) {

            if (item.isObject) {

                handleWrongCatch(item);

            } else {

                handleGoodCatch(item);

            }

            item.element.classList.add("is-caught");

        } else {

            if (!item.isObject) {
                streak = 0;
            }

            item.element.classList.add("is-missed");

        }

        setTimeout(() => {

            item.readyToRemove = true;
            item.element.remove();

        }, 350);

    }

    function handleGoodCatch(item) {

        streak++;

        const bonus =
            Math.min(streak * 1, 12);

        const points = 8 + bonus;

        score += points;

        showFeedback(`+${points}`, "is-correct");

        animateScore(points);

        correctSound.currentTime = 0;
        correctSound.play().catch(() => { });

        scoreElement.textContent =
            `${Math.min(score, TARGET_SCORE)} / ${TARGET_SCORE}`;

        if (score >= TARGET_SCORE) {

            finishGame(true);

        }

    }

    function handleWrongCatch(item) {

        streak = 0;
        lives--;

        livesElement.textContent =
            lives > 0 ? "❤️".repeat(lives) : "💔";

        showFeedback(
            `¡${item.data.name}! -1 vida`,
            "is-wrong"
        );

        wrongSound.currentTime = 0;
        wrongSound.play().catch(() => { });

        basket.classList.remove("is-hit");
        void basket.offsetWidth;
        basket.classList.add("is-hit");

        if (lives <= 0) {

            finishGame(false);

        }

    }

    function showFeedback(text, className) {

        feedback.textContent = text;

        feedback.className =
            `talentos-feedback is-visible ${className}`;

        window.clearTimeout(feedbackTimeout);

        feedbackTimeout = window.setTimeout(() => {

            feedback.classList.remove("is-visible");

        }, 700);

    }

    function formatTime(totalSeconds) {

        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );

    }

    async function finishGame(didWin) {

        gameStarted = false;
        passed = didWin;

        cancelAnimationFrame(animationFrameId);

        clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        const finalScore =
            Math.min(score, TARGET_SCORE);

        const finalTime = totalGameSeconds;
        const finalLives = lives;
        const formattedTime = formatTime(finalTime);

        if (didWin) {

            localStorage.setItem(
                "ninthGameUnlocked",
                "true"
            );

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML =
                '<i class="fa-solid fa-trophy"></i>';

            resultLabel.textContent =
                "Desafío superado";

            resultTitle.textContent =
                "¡Los atrapaste a todos!";

            resultText.textContent =
                `Llegaste a ${finalScore} puntos en ${formattedTime}.`;

            resultButtonText.textContent =
                "Continuar";

        } else {

            defeatSound.currentTime = 0;
            defeatSound.play().catch(() => { });

            resultIcon.innerHTML =
                '<i class="fa-solid fa-heart-crack"></i>';

            resultLabel.textContent =
                "Fin de la partida";

            resultTitle.textContent =
                "¡Te quedaste sin vidas!";

            resultText.textContent =
                `Llegaste a ${finalScore} de ${TARGET_SCORE} puntos en ${formattedTime}.`;

            resultButtonText.textContent =
                "Intentar nuevamente";

        }

        if (didWin) {

            const rankingOpened =
                await processRankingResult(
                    finalScore,
                    finalTime,
                    finalLives
                );

            if (rankingOpened) {
                return;
            }

        }

        setTimeout(() => {
            showModal(resultModal);
        }, 500);

    }

    async function processRankingResult(
        finalScore,
        finalTime,
        finalLives
    ) {

        try {

            const result =
                await checkTriviaResult(
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
                correctAnswers: 0,
                time: finalTime,
                lives: finalLives
            };

            const livesText =
                finalLives === 1
                    ? "1 vida"
                    : `${finalLives} vidas`;

            rankingModalScore.textContent =
                `${finalScore} puntos · ` +
                `${formatTime(finalTime)} · ` +
                livesText;

            rankingNameError.textContent = "";

            if (
                result.qualifiesTop10 &&
                !result.hasName
            ) {

                rankingModalTitle.textContent =
                    "¡Entraste al Top 10!";

                rankingModalText.textContent =
                    `Tu resultado ocuparía el puesto ${result.position}. Escribe tu nombre o apodo para aparecer en el Salón de la Fama.`;

                rankingNameGroup.hidden = false;
                rankingPlayerName.value = "";

            } else {

                rankingModalTitle.textContent =
                    "¡Nuevo récord personal!";

                rankingModalText.textContent =
                    result.qualifiesTop10
                        ? `Tu resultado ocuparía el puesto ${result.position} del ranking.`
                        : "Has superado tu mejor puntaje anterior.";

                rankingNameGroup.hidden = true;

            }

            showModal(rankingModal);

            return true;

        } catch (error) {

            console.error(
                "No se pudo comprobar el ranking:",
                error
            );

            return false;

        }

    }

    async function openLeaderboard() {

        showModal(leaderboardModal);

        leaderboardLoading.hidden = false;
        leaderboardEmpty.hidden = true;

        leaderboardList.innerHTML = "";

        try {

            const ranking =
                await getTriviaRanking(GAME_ID);

            leaderboardLoading.hidden = true;

            if (!ranking.length) {
                leaderboardEmpty.hidden = false;
                return;
            }

            ranking.forEach((player) => {

                const item =
                    document.createElement("li");

                item.classList.add(
                    `leaderboard-rank-${player.position}`
                );

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
                    player.lives === 1
                        ? "1 vida"
                        : `${player.lives} vidas`;

                item.innerHTML = `
          <span class="leaderboard-position">
            ${positionContent}
          </span>

          <span class="leaderboard-player">
            ${player.name}
          </span>

          <strong class="leaderboard-score">
            ${player.score} puntos ·
            ${formatTime(player.time)} ·
            ${livesText}
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
        score = 0;
        lives = MAX_LIVES;
        streak = 0;
        totalGameSeconds = 0;
        pendingRankingResult = null;
        passed = false;

        cancelAnimationFrame(animationFrameId);

        clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        fallingItems.forEach((item) => {
            item.element.remove();
        });

        fallingItems = [];

        correctSound.pause();
        correctSound.currentTime = 0;

        wrongSound.pause();
        wrongSound.currentTime = 0;

        victorySound.pause();
        victorySound.currentTime = 0;

        defeatSound.pause();
        defeatSound.currentTime = 0;

        gameStage.classList.remove("is-playing");
        resetButton.classList.remove("is-visible");

        hideModal(resultModal);
        hideModal(rankingModal);
        hideModal(leaderboardModal);

        document
            .querySelector(".love-game-welcome")
            ?.classList.remove("is-hidden");

        startButton.disabled = false;

        scoreElement.textContent = `0 / ${TARGET_SCORE}`;
        livesElement.textContent = "❤️❤️❤️";
        timeElement.textContent = formatTime(0);

        feedback.textContent = "";
        feedback.className = "talentos-feedback";

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

    function animateScore(value) {

        scoreAnimation.textContent =
            value > 0 ? `+${value}` : `${value}`;

        scoreAnimation.className =
            value > 0
                ? "score-animation positive"
                : "score-animation negative";

        scoreAnimation.classList.add("show");

        setTimeout(() => {
            scoreAnimation.classList.remove("show");
        }, 800);

    }

});
