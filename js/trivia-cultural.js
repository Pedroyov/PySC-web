import { QUESTIONS } from "./trivia-preguntas.js";

import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID =
    "trivia-cultural";


document.addEventListener("DOMContentLoaded", () => {



    const gameStage =
        document.getElementById(
            "triviaGameStage"
        );

    const startButton =
        document.getElementById(
            "triviaStartButton"
        );

    const resetButton =
        document.getElementById(
            "triviaResetButton"
        );

    const countdown =
        document.getElementById(
            "loveCountdown"
        );

    const countdownText =
        document.getElementById(
            "loveCountdownText"
        );

    const triviaBoard =
        document.getElementById(
            "triviaBoard"
        );

    const questionLabel =
        document.getElementById(
            "triviaQuestionLabel"
        );

    const question =
        document.getElementById(
            "triviaQuestion"
        );

    const options =
        document.querySelectorAll(
            ".trivia-option"
        );

    const feedback =
        document.getElementById(
            "triviaFeedback"
        );

    const questionNumber =
        document.getElementById(
            "triviaQuestionNumber"
        );

    const score =
        document.getElementById(
            "triviaScore"
        );

    const lives =
        document.getElementById(
            "triviaLives"
        );

    const time =
        document.getElementById(
            "triviaTime"
        );

    const timeBar =
        document.getElementById(
            "triviaTimeBar"
        );

    const resultModal =
        document.getElementById(
            "loveUnlockModal"
        );

    const resultIcon =
        document.getElementById(
            "loveUnlockIcon"
        );

    const resultLabel =
        document.getElementById(
            "loveUnlockLabel"
        );

    const resultTitle =
        document.getElementById(
            "loveUnlockTitle"
        );

    const resultText =
        document.getElementById(
            "loveUnlockText"
        );

    const resultButtonText =
        document.getElementById(
            "loveUnlockButtonText"
        );

    const resultButton =
        document.getElementById(
            "loveUnlockButton"
        );

    const rankingModal =
        document.getElementById(
            "rankingModal"
        );

    const rankingModalTitle =
        document.getElementById(
            "rankingModalTitle"
        );

    const rankingModalText =
        document.getElementById(
            "rankingModalText"
        );

    const rankingModalScore =
        document.getElementById(
            "rankingModalScore"
        );

    const rankingNameGroup =
        document.getElementById(
            "rankingNameGroup"
        );

    const rankingPlayerName =
        document.getElementById(
            "rankingPlayerName"
        );

    const rankingNameError =
        document.getElementById(
            "rankingNameError"
        );

    const rankingSaveButton =
        document.getElementById(
            "rankingSaveButton"
        );

    const leaderboardModal =
        document.getElementById(
            "leaderboardModal"
        );

    const leaderboardList =
        document.getElementById(
            "leaderboardList"
        );

    const leaderboardLoading =
        document.getElementById(
            "leaderboardLoading"
        );

    const leaderboardEmpty =
        document.getElementById(
            "leaderboardEmpty"
        );

    const leaderboardOpenButton =
        document.getElementById(
            "leaderboardOpenButton"
        );

    const leaderboardCloseButton =
        document.getElementById(
            "leaderboardCloseButton"
        );

    const scoreAnimation =
        document.getElementById(
            "scoreAnimation"
        );


    const backgroundMusic =
        new Audio(
            "../audio/memory.mp3"
        );

    const correctSound =
        new Audio(
            "../audio/hit.mp3"
        );

    const wrongSound =
        new Audio(
            "../audio/wrong.mp3"
        );

    const victorySound =
        new Audio(
            "../audio/victory.mp3"
        );

    const defeatSound =
        new Audio(
            "../audio/gameover.mp3"
        );

    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.45;


    let gameStarted = false;
    let currentQuestion = 0;
    let currentScore = 0;
    let currentLives = 3;
    let currentTime = 15;
    let timerInterval = null;
    let selectedQuestions = [];
    let correctAnswers = 0;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;
    let pendingRankingResult = null;
    let passed = false;


    if (
        !gameStage ||
        !startButton ||
        !resetButton ||
        !countdown ||
        !countdownText ||
        !triviaBoard ||
        !questionLabel ||
        !question ||
        options.length !== 4 ||
        !feedback ||
        !questionNumber ||
        !score ||
        !lives ||
        !time ||
        !timeBar ||
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
            "No se encontraron todos los elementos necesarios de la Trivia."
        );

        throw new Error(
            "Faltan elementos HTML de la Trivia."
        );

    }


    startButton.addEventListener(
        "click",
        startCountdown
    );

    resetButton.addEventListener(
        "click",
        restartGame
    );

    options.forEach((optionButton) => {

        optionButton.addEventListener(
            "click",
            () => {

                const selectedIndex =
                    Number(
                        optionButton.dataset.optionIndex
                    );

                checkAnswer(
                    selectedIndex,
                    optionButton
                );

            }
        );

    });

    resultButton.addEventListener(
        "click",
        () => {

            resultModal.classList.remove(
                "is-visible"
            );

            resultModal.setAttribute(
                "aria-hidden",
                "true"
            );

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

            rankingSaveButton.disabled =
                true;

            try {

                await saveBestTriviaResult(
                    GAME_ID,
                    pendingRankingResult.score,
                    pendingRankingResult.correctAnswers,
                    pendingRankingResult.time,
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

                    resultModal.classList.add(
                        "is-visible"
                    );

                    resultModal.setAttribute(
                        "aria-hidden",
                        "false"
                    );

                }, 350);

                pendingRankingResult =
                    null;

            } catch (error) {

                console.error(
                    "No se pudo guardar el resultado de la Trivia:",
                    error
                );

                rankingNameError.textContent =
                    "No se pudo guardar. Inténtalo nuevamente.";

            } finally {

                rankingSaveButton.disabled =
                    false;

            }

        }
    );

    leaderboardOpenButton.addEventListener(
        "click",
        () => {

            openTriviaLeaderboard();

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



    function startQuestionTimer() {

        clearInterval(
            timerInterval
        );

        currentTime = 15;

        updateQuestionTimer();

        timerInterval =
            setInterval(() => {

                currentTime--;

                updateQuestionTimer();

                if (currentTime <= 0) {

                    clearInterval(
                        timerInterval
                    );

                    timerInterval = null;

                    handleTimeExpired();

                }

            }, 1000);

    }

    function updateQuestionTimer() {

        time.textContent =
            currentTime;

        const percentage =
            Math.max(
                0,
                (
                    currentTime /
                    15
                ) * 100
            );

        timeBar.style.width =
            `${percentage}%`;

        timeBar.classList.remove(
            "is-warning",
            "is-danger"
        );

        if (
            currentTime <= 5
        ) {

            timeBar.classList.add(
                "is-danger"
            );

        } else if (
            currentTime <= 9
        ) {

            timeBar.classList.add(
                "is-warning"
            );

        }

    }

    function handleTimeExpired() {

        if (!gameStarted) {
            return;
        }

        const currentData =
            selectedQuestions[
            currentQuestion
            ];

        if (!currentData) {
            return;
        }

        wrongSound.currentTime = 0;

        wrongSound
            .play()
            .catch(() => { });

        currentLives--;

        currentScore -= 3;
        animateScore(
            -3
        );

        score.textContent =
            currentScore;

        lives.textContent =
            "❤️".repeat(
                currentLives
            ) +
            "🖤".repeat(
                3 - currentLives
            );

        options.forEach(
            (
                optionButton,
                index
            ) => {

                optionButton.disabled =
                    true;

                if (
                    index ===
                    currentData.correctAnswer
                ) {

                    optionButton.classList.add(
                        "is-correct"
                    );

                }

            }
        );

        feedback.textContent =
            "Tiempo agotado. -3 puntos";

        feedback.className =
            "trivia-feedback is-wrong";

        setTimeout(() => {

            if (
                currentLives <= 0
            ) {

                finishGame();

                return;

            }

            currentQuestion++;

            showQuestion();

        }, 1200);

    }

    function showCountdownStep(
        text,
        isFinal
    ) {

        countdownText.classList.remove(
            "is-changing",
            "is-final"
        );

        void countdownText.offsetWidth;

        countdownText.textContent =
            text;

        countdownText.classList.add(
            "is-changing"
        );

        if (isFinal) {

            countdownText.classList.add(
                "is-final"
            );

        }

    }

    function startCountdown() {

        if (gameStarted) {
            return;
        }

        startButton.disabled = true;

        const gameWelcome =
            document.querySelector(
                ".love-game-welcome"
            );

        gameWelcome?.classList.add(
            "is-hidden"
        );

        const steps = [
            "3",
            "2",
            "1",
            "¡A responder!"
        ];

        let currentStep = 0;

        countdown.classList.add(
            "is-visible"
        );

        showCountdownStep(
            steps[currentStep],
            false
        );

        const countdownInterval =
            setInterval(() => {

                currentStep++;

                if (
                    currentStep <
                    steps.length
                ) {

                    showCountdownStep(
                        steps[currentStep],
                        currentStep ===
                        steps.length - 1
                    );

                    return;

                }

                clearInterval(
                    countdownInterval
                );

                setTimeout(() => {

                    countdown.classList.remove(
                        "is-visible"
                    );

                    startGame();

                }, 650);

            }, 900);

    }

    function shuffleArray(items) {

        const shuffledItems =
            [...items];

        for (
            let index =
                shuffledItems.length - 1;
            index > 0;
            index--
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    (index + 1)
                );

            [
                shuffledItems[index],
                shuffledItems[randomIndex]
            ] = [
                    shuffledItems[randomIndex],
                    shuffledItems[index]
                ];

        }

        return shuffledItems;

    }

    function prepareQuestion(
        questionData
    ) {

        const optionsWithResult =
            questionData.options.map(
                (optionText, index) => ({
                    text: optionText,
                    isCorrect:
                        index ===
                        questionData.correctAnswer
                })
            );

        const shuffledOptions =
            shuffleArray(
                optionsWithResult
            );

        return {
            ...questionData,

            options:
                shuffledOptions.map(
                    option =>
                        option.text
                ),

            correctAnswer:
                shuffledOptions.findIndex(
                    option =>
                        option.isCorrect
                )
        };

    }

    function startGame() {

        gameStarted = true;

        currentQuestion = 0;
        currentScore = 0;
        currentLives = 3;
        currentTime = 15;
        correctAnswers = 0;
        totalGameSeconds = 0;
        pendingRankingResult = null;
        passed = false;

        clearInterval(
            totalTimerInterval
        );

        totalTimerInterval =
            setInterval(() => {

                totalGameSeconds++;

            }, 1000);

        selectedQuestions =
            shuffleArray(
                QUESTIONS
            )
                .slice(
                    0,
                    Math.min(
                        20,
                        QUESTIONS.length
                    )
                )
                .map(
                    prepareQuestion
                );


        gameStage.classList.add(
            "is-playing"
        );

        resetButton.classList.add(
            "is-visible"
        );

        score.textContent =
            currentScore;

        lives.textContent =
            "❤️❤️❤️";

        time.textContent =
            currentTime;

        questionNumber.textContent =
            `1 / ${selectedQuestions.length}`;

        feedback.textContent =
            "";

        feedback.className =
            "trivia-feedback";

        backgroundMusic.currentTime = 0;

        backgroundMusic
            .play()
            .catch(() => { });

        showQuestion();

    }

    function restartGame() {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

        gameStarted = false;

        currentQuestion = 0;
        currentScore = 0;
        currentLives = 3;
        currentTime = 15;
        pendingRankingResult = null;
        passed = false;

        clearInterval(
            totalTimerInterval
        );

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        correctSound.pause();
        correctSound.currentTime = 0;

        wrongSound.pause();
        wrongSound.currentTime = 0;

        victorySound.pause();
        victorySound.currentTime = 0;

        defeatSound.pause();
        defeatSound.currentTime = 0;

        totalTimerInterval = null;

        correctAnswers = 0;
        totalGameSeconds = 0;

        selectedQuestions = [];

        gameStage.classList.remove(
            "is-playing"
        );

        resetButton.classList.remove(
            "is-visible"
        );

        resultModal.classList.remove(
            "is-visible"
        );

        resultModal.setAttribute(
            "aria-hidden",
            "true"
        );

        rankingModal.classList.remove(
            "is-visible"
        );

        rankingModal.setAttribute(
            "aria-hidden",
            "true"
        );

        leaderboardModal.classList.remove(
            "is-visible"
        );

        leaderboardModal.setAttribute(
            "aria-hidden",
            "true"
        );

        const gameWelcome =
            document.querySelector(
                ".love-game-welcome"
            );

        gameWelcome?.classList.remove(
            "is-hidden"
        );

        startButton.disabled = false;

        score.textContent = "0";
        lives.textContent = "❤️❤️❤️";
        time.textContent = "15";

        questionNumber.textContent =
            "1 / 20";

        questionLabel.textContent =
            "Pregunta 1 de 20";

        question.textContent =
            "Aquí aparecerá la pregunta.";

        feedback.textContent = "";

        feedback.className =
            "trivia-feedback";

        timeBar.style.width =
            "100%";

        timeBar.classList.remove(
            "is-warning",
            "is-danger"
        );

        options.forEach(
            (optionButton, index) => {

                optionButton.disabled =
                    false;

                optionButton.classList.remove(
                    "is-correct",
                    "is-wrong"
                );

                const optionText =
                    optionButton.querySelector(
                        ".trivia-option-text"
                    );

                optionText.textContent =
                    `Alternativa ${["A", "B", "C", "D"][index]
                    }`;

            }
        );

    }

    function showQuestion() {

        const currentData =
            selectedQuestions[
            currentQuestion
            ];

        if (!currentData) {

            finishGame();

            return;

        }

        questionLabel.textContent =
            `Pregunta ${currentQuestion + 1} de ${selectedQuestions.length}`;

        questionNumber.textContent =
            `${currentQuestion + 1} / ${selectedQuestions.length}`;


        question.textContent =
            currentData.question;

        feedback.textContent =
            "";

        feedback.className =
            "trivia-feedback";

        options.forEach(
            (optionButton, index) => {

                const optionText =
                    optionButton.querySelector(
                        ".trivia-option-text"
                    );

                optionButton.blur();

                optionButton.disabled =
                    false;

                optionButton.classList.remove(
                    "is-correct",
                    "is-wrong"
                );

                optionButton.dataset.optionIndex =
                    index;

                optionText.textContent =
                    currentData.options[index];

            }
        );

        startQuestionTimer();

    }

    function checkAnswer(selectedIndex, selectedButton) {

        if (!gameStarted) {
            return;
        }

        clearInterval(
            timerInterval
        );

        timerInterval = null;

        const currentData =
            selectedQuestions[
            currentQuestion
            ];

        if (!currentData) {
            return;
        }

        options.forEach((optionButton) => {

            optionButton.disabled =
                true;

        });

        selectedButton.blur();

        const isCorrect =
            selectedIndex ===
            currentData.correctAnswer;

        if (isCorrect) {

            correctSound.currentTime = 0;

            correctSound
                .play()
                .catch(() => { });

            let earnedPoints = 0;

            if (currentTime >= 10) {

                earnedPoints = 10;

            } else {

                earnedPoints = 8;

            }

            currentScore += earnedPoints;
            correctAnswers++;

            animateScore(
                earnedPoints
            );

            score.textContent =
                currentScore;
                
            selectedButton.classList.add(
                "is-correct"
            );

            feedback.textContent =
                `¡Correcto! +${earnedPoints} puntos`;

            feedback.className =
                "trivia-feedback is-correct";

        } else {

            wrongSound.currentTime = 0;

            wrongSound
                .play()
                .catch(() => { });

            currentLives--;

            currentScore -= 5;

            animateScore(
                -5
            );

            score.textContent =
                currentScore;

            lives.textContent =
                "❤️".repeat(
                    currentLives
                ) +
                "🖤".repeat(
                    3 - currentLives
                );

            selectedButton.classList.add(
                "is-wrong"
            );

            feedback.textContent =
                "Incorrecto. -5 puntos";

            feedback.className =
                "trivia-feedback is-wrong";

        }

        setTimeout(() => {

            if (currentLives <= 0) {

                finishGame();

                return;

            }

            currentQuestion++;

            showQuestion();

        }, 1200);

    }

    function formatTime(totalSeconds) {

        const minutes =
            Math.floor(
                totalSeconds / 60
            );

        const seconds =
            totalSeconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );

    }

    async function finishGame() {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

        clearInterval(
            totalTimerInterval
        );

        totalTimerInterval = null;

        gameStarted = false;

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        options.forEach(
            (optionButton) => {

                optionButton.disabled =
                    true;

            }
        );

        const completedTrivia =
            currentQuestion >=
            selectedQuestions.length;

        const formattedTime =
            formatTime(
                totalGameSeconds
            );

        const finalScore =
            currentScore;

        const finalCorrectAnswers =
            correctAnswers;

        const finalTime =
            totalGameSeconds;

        const finalLives =
            currentLives;

        if (completedTrivia) {

            passed = true;
            localStorage.setItem(
                "sixthGameUnlocked",
                "true"
            );
            victorySound.currentTime = 0;

            victorySound
                .play()
                .catch(() => { });

            resultIcon.innerHTML =
                '<i class="fa-solid fa-trophy"></i>';

            resultLabel.textContent =
                "Trivia completada";

            resultTitle.textContent =
                "¡Excelente trabajo!";

            resultText.textContent =
                `Respondiste correctamente ${correctAnswers} de ${selectedQuestions.length} preguntas, obtuviste ${currentScore} puntos y completaste la trivia en ${formattedTime}.`;

            resultButtonText.textContent =
                "Continuar";

            feedback.textContent =
                `Trivia completada: ${correctAnswers} respuestas correctas y ${currentScore} puntos.`;

            feedback.className =
                "trivia-feedback is-correct";

        } else {

            passed = false;
            defeatSound.currentTime = 0;

            defeatSound
                .play()
                .catch(() => { });

            resultIcon.innerHTML =
                '<i class="fa-solid fa-heart-crack"></i>';

            resultLabel.textContent =
                "Fin de la partida";

            resultTitle.textContent =
                "¡Te quedaste sin vidas!";

            resultText.textContent =
                `Lograste ${correctAnswers} respuestas correctas, acumulaste ${currentScore} puntos y jugaste durante ${formattedTime}.`;

            resultButtonText.textContent =
                "Intentar nuevamente";

            feedback.textContent =
                `Fin del juego: ${correctAnswers} respuestas correctas y ${currentScore} puntos.`;

            feedback.className =
                "trivia-feedback is-wrong";

        }

        if (completedTrivia) {

            const rankingOpened =
                await processTriviaRanking(
                    finalScore,
                    finalCorrectAnswers,
                    finalTime,
                    finalLives
                );

            if (rankingOpened) {
                return;
            }

        }

        setTimeout(() => {

            resultModal.classList.add(
                "is-visible"
            );

            resultModal.setAttribute(
                "aria-hidden",
                "false"
            );

        }, 500);

    }

    async function processTriviaRanking(
        finalScore,
        finalCorrectAnswers,
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
                correctAnswers:
                    finalCorrectAnswers,
                time: finalTime,
                lives: finalLives
            };

            const livesText =
                finalLives === 1
                    ? "1 vida"
                    : `${finalLives} vidas`;

            rankingModalScore.textContent =
                `${finalScore} puntos · ` +
                `${finalCorrectAnswers} correctas · ` +
                `${formatTime(finalTime)} · ` +
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
                        ? `Tu resultado ocuparía el puesto ${result.position} del ranking.`
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
                "No se pudo comprobar el ranking de la Trivia:",
                error
            );

            return false;

        }

    }

    async function openTriviaLeaderboard() {

        leaderboardModal.classList.add(
            "is-visible"
        );

        leaderboardModal.setAttribute(
            "aria-hidden",
            "false"
        );

        leaderboardLoading.hidden =
            false;

        leaderboardLoading.textContent =
            "Cargando clasificación...";

        leaderboardEmpty.hidden =
            true;

        leaderboardList.innerHTML =
            "";

        try {

            const ranking =
                await getTriviaRanking(
                    GAME_ID
                );

            leaderboardLoading.hidden =
                true;

            if (!ranking.length) {

                leaderboardEmpty.hidden =
                    false;

                return;

            }

            ranking.forEach((player) => {

                const item =
                    document.createElement(
                        "li"
                    );

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
                    ${player.score} puntos ·
                    ${player.correctAnswers} correctas ·
                    ${formatTime(player.time)} ·
                    ${livesText}
                </strong>
            `;

                leaderboardList.appendChild(
                    item
                );

            });

        } catch (error) {

            leaderboardLoading.hidden =
                false;

            leaderboardLoading.textContent =
                "No se pudo cargar la clasificación.";

            console.error(
                "Error cargando el ranking de la Trivia:",
                error
            );

        }

    }

    function animateScore(
        value
    ) {

        scoreAnimation.textContent =
            value > 0
                ? `+${value}`
                : `${value}`;

        scoreAnimation.className =
            value > 0
                ? "score-animation positive"
                : "score-animation negative";

        scoreAnimation.classList.add(
            "show"
        );

        setTimeout(() => {

            scoreAnimation.classList.remove(
                "show"
            );

        }, 800);

    }
});