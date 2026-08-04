import { GAMES } from "./game-config.js";

import {
    checkPuzzleResult,
    saveBestPuzzleResult,
    getPuzzleRanking
} from "./firebase-ranking.js";

const GAME = GAMES.PUZZLE;

document.addEventListener("DOMContentLoaded", () => {
    const secretRoomUnlocked =
        localStorage.getItem("secretRoomUnlocked") === "true";

    if (!secretRoomUnlocked) {
        window.location.replace("../index.html");
        return;
    }

    const LEVELS = [
        {
            rows: 3,
            columns: 3,
            maxMoves: 10,
            image: "../img/juegos/rompecabezas/01.jpg",
        },
        {
            rows: 4,
            columns: 4,
            maxMoves: 16,
            image: "../img/juegos/rompecabezas/02.jpg",
        },
        {
            rows: 5,
            columns: 5,
            maxMoves: 30,
            image: "../img/juegos/rompecabezas/03.jpg",
        },
        {
            rows: 6,
            columns: 6,
            maxMoves: 45,
            image: "../img/juegos/rompecabezas/04.jpg",
        },
        {
            rows: 7,
            columns: 7,
            maxMoves: 60,
            image: "../img/juegos/rompecabezas/05.jpg",
        },
    ];

    const startButton = document.getElementById("puzzleStartButton");

    const gameStage = document.getElementById("puzzleGameStage");

    const gameWelcome = document.querySelector(".love-game-welcome");

    const countdown = document.getElementById("loveCountdown");

    const countdownText = document.getElementById("loveCountdownText");

    const timeElement = document.getElementById("puzzleTime");

    const puzzleBoard = document.getElementById("puzzleBoard");

    const resetButton = document.getElementById("puzzleResetButton");

    const unlockModal = document.getElementById("loveUnlockModal");

    const unlockTitle = document.getElementById("loveUnlockTitle");

    const unlockText = document.getElementById("loveUnlockText");

    const unlockLabel = document.getElementById("loveUnlockLabel");

    const unlockIcon = document.getElementById("loveUnlockIcon");

    const unlockButtonText = document.getElementById("loveUnlockButtonText");

    const unlockButton = document.getElementById("loveUnlockButton");

    const levelMessage = document.getElementById("puzzleLevelMessage");

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

    const puzzleMoves = document.getElementById("puzzleMoves");

    const puzzlePreview = document.getElementById("puzzlePreview");

    const puzzlePreviewImage = document.getElementById("puzzlePreviewImage");
    const puzzlePreviewButton = document.getElementById("puzzlePreviewButton");

    const leaderboardOpenButton = document.getElementById("leaderboardOpenButton",);

    const leaderboardCloseButton = document.getElementById(
        "leaderboardCloseButton",
    );

    const victorySound = new Audio("../audio/victory.mp3");

    const startSound = new Audio("../audio/start.mp3");

    const successSound = new Audio("../audio/success.mp3");

    const backgroundMusic = new Audio("../audio/memory.mp3");

    backgroundMusic.preload = "auto";
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.8;
    victorySound.preload = "auto";

    successSound.preload = "auto";

    startSound.preload = "auto";

    let gameSeconds = 0;
    let timerInterval = null;

    let currentLevel = 1;
    let lives = 3;
    let moves = 0;
    let totalMoves = 0;
    let selectedPiece = null;
    let pieces = [];
    let boardLocked = true;
    let passed = false;
    let pendingRankingResult = null;
    let previewUsed = false;

    const livesElement = document.getElementById("puzzleLives");

    if (
        !startButton ||
        !gameStage ||
        !gameWelcome ||
        !countdown ||
        !countdownText ||
        !timeElement ||
        !puzzleBoard ||
        !levelMessage ||
        !resetButton ||
        !livesElement ||
        !puzzleMoves ||
        !puzzlePreview ||
        !puzzlePreviewImage ||
        !puzzlePreviewButton ||
        !unlockModal ||
        !unlockButton ||
        !rankingModal ||
        !rankingSaveButton ||
        !leaderboardModal ||
        !leaderboardList ||
        !leaderboardLoading ||
        !leaderboardEmpty ||
        !leaderboardOpenButton ||
        !leaderboardCloseButton
    ) {
        console.error(
            "No se encontraron todos los elementos necesarios del juego."
        );

        return;
    }

    startButton.addEventListener("click", () => {
        startButton.disabled = true;

        gameWelcome.classList.add("is-hidden");

        setTimeout(() => {
            startCountdown();
        }, 450);
    });

    resetButton.addEventListener("click", () => {
        restartGame();
    });

    function startCountdown() {
        const steps = ["3", "2", "1", "¡A reconstruir!"];

        let currentStep = 0;

        countdown.classList.add("is-visible");

        showCountdownStep(steps[currentStep], false);

        const countdownInterval = setInterval(() => {
            currentStep++;

            if (currentStep < steps.length) {
                showCountdownStep(steps[currentStep], currentStep === steps.length - 1);

                return;
            }

            clearInterval(countdownInterval);

            setTimeout(() => {
                countdown.classList.remove("is-visible");

                startGame();
            }, 650);
        }, 900);
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

    function startGame() {

        resetButton.classList.add(
            "is-visible"
        );

        gameStage.classList.add(
            "is-playing"
        );

        startSound.currentTime = 0;

        startSound.play().catch(() => {
            // El navegador puede bloquear el audio.
        });

        backgroundMusic.currentTime = 0;

        backgroundMusic.play().catch(() => {
            // El navegador puede bloquear el audio.
        });

        clearInterval(timerInterval);

        gameSeconds = 0;
        currentLevel = 1;
        lives = 3;
        moves = 0;
        totalMoves = 0;
        selectedPiece = null;
        pieces = [];
        boardLocked = true;
        passed = false;

        updateGameTime();
        updateLives();
        updateLevel();
        updateMoves();

        startLevel();

        timerInterval = setInterval(
            () => {

                gameSeconds++;

                updateGameTime();

            },
            1000
        );

    }

    function updateGameTime() {
        const minutes = Math.floor(gameSeconds / 60);

        const seconds = gameSeconds % 60;

        timeElement.textContent =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;
    }

    function updateLives() {
        let hearts = "";

        for (let i = 0; i < 3; i++) {
            hearts += i < lives ? "❤️" : "🖤";
        }

        livesElement.textContent = hearts;
    }

    function updateMoves() {
        const level = LEVELS[currentLevel - 1];
        puzzleMoves.textContent = `${moves} / ${level.maxMoves}`;
    }

    function startLevel() {
        boardLocked = true;
        selectedPiece = null;
        moves = 0;

        previewUsed = false;

        puzzlePreviewButton.disabled =
            true;

        updateLevel();
        updateMoves();

        const level =
            LEVELS[currentLevel - 1];

        puzzlePreviewImage.src =
            level.image;

        puzzlePreview.classList.add(
            "is-visible"
        );

        puzzlePreview.setAttribute(
            "aria-hidden",
            "false"
        );

        setTimeout(() => {

            puzzlePreview.classList.remove(
                "is-visible"
            );

            puzzlePreview.setAttribute(
                "aria-hidden",
                "true"
            );

            createPuzzleBoard();

            boardLocked = false;

            puzzlePreviewButton.disabled =
                false;

        }, 3000);
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);

        const seconds = totalSeconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );
    }

    function updateLevel() {
        const levelElement = document.getElementById("puzzleLevel");

        levelElement.textContent = `${currentLevel} / ${LEVELS.length}`;
    }

    function restartGame() {

        clearInterval(timerInterval);
        timerInterval = null;

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        gameSeconds = 0;
        currentLevel = 1;
        lives = 3;
        moves = 0;
        totalMoves = 0;
        selectedPiece = null;
        pieces = [];
        boardLocked = true;
        passed = false;

        previewUsed = false;

        puzzlePreviewButton.disabled =
            true;

        updateGameTime();
        updateLevel();
        updateLives();
        updateMoves();

        puzzleBoard.innerHTML = "";

        puzzlePreview.classList.remove(
            "is-visible"
        );

        puzzlePreview.setAttribute(
            "aria-hidden",
            "true"
        );

        unlockModal.classList.remove(
            "is-visible"
        );

        gameStage.classList.remove(
            "is-playing"
        );

        setTimeout(() => {

            startCountdown();

        }, 350);

    }

    function createPuzzleBoard() {

        puzzleBoard.innerHTML = "";
        pieces = [];
        selectedPiece = null;

        const level =
            LEVELS[currentLevel - 1];

        const totalPieces =
            level.rows * level.columns;

        puzzleBoard.style.gridTemplateColumns =
            `repeat(${level.columns}, 1fr)`;

        const pieceOrder =
            Array.from(
                { length: totalPieces },
                (_, index) => index
            );

        shuffleArray(pieceOrder);

        pieceOrder.forEach(
            (
                correctPosition,
                currentPosition
            ) => {

                const piece =
                    document.createElement(
                        "button"
                    );

                piece.type = "button";

                piece.className =
                    "puzzle-piece";

                piece.dataset.correctPosition =
                    correctPosition;

                piece.dataset.currentPosition =
                    currentPosition;

                const correctRow =
                    Math.floor(
                        correctPosition /
                        level.columns
                    );

                const correctColumn =
                    correctPosition %
                    level.columns;

                piece.style.backgroundImage =
                    `url("${level.image}")`;

                piece.style.backgroundSize =
                    `${level.columns * 100}% ${level.rows * 100}%`;

                piece.style.backgroundPosition =
                    `${getBackgroundPosition(
                        correctColumn,
                        level.columns
                    )} ${getBackgroundPosition(
                        correctRow,
                        level.rows
                    )}`;

                piece.addEventListener(
                    "click",
                    () => {

                        selectPiece(piece);

                    }
                );

                puzzleBoard.appendChild(
                    piece
                );

                pieces.push(piece);

            }
        );

        updateCorrectPieces();

    }

    function shuffleArray(array) {

        for (
            let index = array.length - 1;
            index > 0;
            index--
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    (index + 1)
                );

            [
                array[index],
                array[randomIndex]
            ] = [
                    array[randomIndex],
                    array[index]
                ];

        }

        /*
        * Evitamos que el tablero aparezca
        * resuelto por casualidad.
        */
        const alreadySolved =
            array.every(
                (value, index) =>
                    value === index
            );

        if (alreadySolved) {
            shuffleArray(array);
        }

    }

    function getBackgroundPosition(
        coordinate,
        total
    ) {

        if (total <= 1) {
            return "0%";
        }

        return (
            `${(
                coordinate /
                (total - 1)
            ) * 100}%`
        );

    }

    function selectPiece(piece) {

        if (boardLocked) {
            return;
        }

        if (!selectedPiece) {

            selectedPiece = piece;

            piece.classList.add(
                "is-selected"
            );

            return;

        }

        if (selectedPiece === piece) {

            selectedPiece.classList.remove(
                "is-selected"
            );

            selectedPiece = null;

            return;

        }

        swapPieces(
            selectedPiece,
            piece
        );

    }

    function swapPieces(firstPiece, secondPiece) {

        boardLocked = true;

        const firstPosition =
            firstPiece.dataset.currentPosition;

        const secondPosition =
            secondPiece.dataset.currentPosition;

        firstPiece.classList.add(
            "is-swapping"
        );

        secondPiece.classList.add(
            "is-swapping"
        );

        secondPiece.classList.add(
            "is-selected"
        );

        setTimeout(() => {

            firstPiece.dataset.currentPosition =
                secondPosition;

            secondPiece.dataset.currentPosition =
                firstPosition;

            const firstNextSibling =
                firstPiece.nextSibling;

            const secondNextSibling =
                secondPiece.nextSibling;

            if (
                firstNextSibling ===
                secondPiece
            ) {

                puzzleBoard.insertBefore(
                    secondPiece,
                    firstPiece
                );

            } else if (
                secondNextSibling ===
                firstPiece
            ) {

                puzzleBoard.insertBefore(
                    firstPiece,
                    secondPiece
                );

            } else {

                puzzleBoard.insertBefore(
                    firstPiece,
                    secondNextSibling
                );

                puzzleBoard.insertBefore(
                    secondPiece,
                    firstNextSibling
                );

            }

            firstPiece.classList.remove(
                "is-selected"
            );

            secondPiece.classList.remove(
                "is-selected"
            );

            firstPiece.classList.remove(
                "is-swapping"
            );

            secondPiece.classList.remove(
                "is-swapping"
            );

            selectedPiece = null;

            moves++;
            totalMoves++;

            updateMoves();
            updateCorrectPieces();

            boardLocked = false;

            checkPuzzleState();

        }, 150);

    }

    function showLevelCompleted() {

         boardLocked = true;

        puzzlePreviewButton.disabled =
            true;

        successSound.currentTime = 0;

        successSound.play().catch(() => {});

        levelMessage.textContent =
            `¡Nivel ${currentLevel} completado! 🎉`;

        levelMessage.classList.add(
            "is-visible"
        );

        setTimeout(() => {

            levelMessage.classList.remove(
                "is-visible"
            );

            if (
                currentLevel <
                LEVELS.length
            ) {

                currentLevel++;

                startLevel();

                return;

            }

            finishPuzzleGame();

        }, 1400);

    }

    function losePuzzleLife() {

        lives--;

        updateLives();

        levelMessage.textContent =
            lives > 0
                ? "Superaste el límite de movimientos. Pierdes una vida."
                : "Te quedaste sin vidas.";

        levelMessage.classList.add(
            "is-visible"
        );

        setTimeout(() => {

            levelMessage.classList.remove(
                "is-visible"
            );

            if (lives <= 0) {

                finishPuzzleFailedGame();

                return;

            }

            startLevel();

        }, 1600);

    }

    function updateCorrectPieces() {

        const currentPieces =
            Array.from(
                puzzleBoard.children
            );

        currentPieces.forEach(
            (piece, index) => {

                const correctPosition =
                    Number(
                        piece.dataset.correctPosition
                    );

                piece.classList.toggle(
                    "is-correct",
                    correctPosition === index
                );

            }
        );

    }

    function isPuzzleSolved() {

        const currentPieces =
            Array.from(
                puzzleBoard.children
            );

        return currentPieces.every(
            (piece, index) =>
                Number(
                    piece.dataset.correctPosition
                ) === index
        );

    }

    function checkPuzzleState() {

        const level =
            LEVELS[currentLevel - 1];

        if (isPuzzleSolved()) {

            boardLocked = true;

            showLevelCompleted();

            return;

        }

        if (moves >= level.maxMoves) {

            boardLocked = true;

            losePuzzleLife();

        }

    }

    async function processPuzzleRanking(
        finalTime,
        finalMoves,
        finalLives
    ) {

        try {

            const result =
                await checkPuzzleResult(
                    GAME.id,
                    finalTime,
                    finalMoves,
                    finalLives
                );

            if (!result.newPersonalRecord) {
                return false;
            }

            pendingRankingResult = {
                ...result,
                time: finalTime,
                moves: finalMoves,
                lives: finalLives
            };

            const livesText =
                finalLives === 1
                    ? "1 vida"
                    : `${finalLives} vidas`;

            rankingModalScore.textContent =
                `${formatTime(finalTime)} · ` +
                `${finalMoves} movimientos · ` +
                livesText;

            rankingNameError.textContent =
                "";

            if (
                result.qualifiesTop10 &&
                !result.hasName
            ) {

                rankingModalTitle.textContent =
                    "¡Entraste al Top 10!";

                rankingModalText.textContent =
                    `Tu resultado ocuparía el puesto ${result.position}. Escribe tu nombre o apodo para aparecer en el Salón de la Fama.`;

                rankingNameGroup.hidden =
                    false;

                rankingPlayerName.value =
                    "";

            } else {

                rankingModalTitle.textContent =
                    "¡Nuevo récord personal!";

                rankingModalText.textContent =
                    result.qualifiesTop10
                        ? `Tu nuevo resultado ocuparía el puesto ${result.position} del ranking.`
                        : "Has mejorado tu resultado anterior.";

                rankingNameGroup.hidden =
                    true;

            }

            rankingModal.classList.add(
                "is-visible"
            );

            rankingModal.setAttribute(
                "aria-hidden",
                "false"
            );

            return true;

        } catch (error) {

            console.error(
                "No se pudo comprobar el ranking del Rompecabezas:",
                error
            );

            return false;

        }

    }

    async function openPuzzleLeaderboard() {

        leaderboardModal.classList.add(
            "is-visible"
        );

        leaderboardModal.setAttribute(
            "aria-hidden",
            "false"
        );

        leaderboardLoading.hidden = false;
        leaderboardLoading.textContent =
            "Cargando clasificación...";

        leaderboardEmpty.hidden = true;
        leaderboardList.innerHTML = "";

        try {

            const ranking =
                await getPuzzleRanking(
                    GAME.id
                );

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

                let positionContent =
                    player.position;

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
                    ${formatTime(player.time)} ·
                    ${player.moves} movimientos ·
                    ${livesText}
                </strong>
            `;

                leaderboardList.appendChild(
                    item
                );

            });

        } catch (error) {

            leaderboardLoading.hidden = false;

            leaderboardLoading.textContent =
                "No se pudo cargar la clasificación.";

            console.error(
                "Error cargando el ranking del Rompecabezas:",
                error
            );

        }

    }

    async function finishPuzzleGame() {

        clearInterval(timerInterval);
        timerInterval = null;

        boardLocked = true;
        passed = true;

        const finalTime =
            gameSeconds;

        const finalMoves =
            totalMoves;

        const finalLives =
            lives;

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        puzzlePreviewButton.disabled = true;

        victorySound.currentTime = 0;

        victorySound.play().catch(() => { });

        localStorage.setItem(
            "fifthGameUnlocked",
            "true"
        );

        unlockIcon.innerHTML =
            '<i class="fa-solid fa-trophy"></i>';

        unlockLabel.textContent =
            "Nuevo desafío desbloqueado";

        unlockTitle.textContent =
            "¡Rompecabezas completado!";

        unlockText.textContent =
            `Has reconstruido las cinco fotografías en ${formatTime(finalTime)} y ${finalMoves} movimientos.`;

        unlockButtonText.textContent =
            "Continuar";

        const rankingOpened =
            await processPuzzleRanking(
                finalTime,
                finalMoves,
                finalLives
            );

        if (!rankingOpened) {

            setTimeout(() => {

                unlockModal.classList.add(
                    "is-visible"
                );

                unlockModal.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }, 350);

        }

    }

    function finishPuzzleFailedGame() {

        clearInterval(timerInterval);
        timerInterval = null;

        boardLocked = true;
        passed = false;

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        puzzlePreviewButton.disabled = true;

        unlockIcon.innerHTML =
            '<i class="fa-solid fa-puzzle-piece"></i>';

        unlockLabel.textContent =
            "Desafío no superado";

        unlockTitle.textContent =
            "¡Te quedaste sin vidas!";

        unlockText.textContent =
            "No lograste reconstruir las cinco fotografías. Inténtalo nuevamente para desbloquear el siguiente desafío.";

        unlockButtonText.textContent =
            "Intentar nuevamente";

        setTimeout(() => {

            unlockModal.classList.add(
                "is-visible"
            );

            unlockModal.setAttribute(
                "aria-hidden",
                "false"
            );

        }, 350);

    }

    unlockButton.addEventListener(
        "click",
        () => {

            unlockModal.classList.remove(
                "is-visible"
            );

            unlockModal.setAttribute(
                "aria-hidden",
                "true"
            );

            if (!passed) {

                restartGame();

            }

        }
    );

    puzzlePreviewButton.addEventListener(
        "click",
        () => {

            if (
                previewUsed ||
                boardLocked
            ) {
                return;
            }

            previewUsed = true;

            puzzlePreviewButton.disabled =
                true;

            boardLocked = true;

            puzzlePreview.classList.add(
                "is-visible"
            );

            puzzlePreview.setAttribute(
                "aria-hidden",
                "false"
            );

            setTimeout(() => {

                puzzlePreview.classList.remove(
                    "is-visible"
                );

                puzzlePreview.setAttribute(
                    "aria-hidden",
                    "true"
                );

                boardLocked = false;

            }, 3000);

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

                await saveBestPuzzleResult(
                    GAME.id,
                    pendingRankingResult.time,
                    pendingRankingResult.moves,
                    pendingRankingResult.lives,
                    playerName
                );

                rankingModal.classList.remove(
                    "is-visible"
                );

                rankingModal.setAttribute(
                    "aria-hidden",
                    "true"
                );

                setTimeout(() => {

                    unlockModal.classList.add(
                        "is-visible"
                    );

                    unlockModal.setAttribute(
                        "aria-hidden",
                        "false"
                    );

                }, 350);

                pendingRankingResult = null;

            } catch (error) {

                console.error(
                    "No se pudo guardar el resultado del Rompecabezas:",
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
        () => {

            openPuzzleLeaderboard();

        }
    );

    leaderboardCloseButton.addEventListener(
        "click",
        () => {

            leaderboardModal.classList.remove(
                "is-visible"
            );

            leaderboardModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );

});
