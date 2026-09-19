import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID = "mapa-folklore";

const MAX_LIVES = 3;

const ZONE_NAMES = {
    "costa-norte": "Costa Norte",
    "costa-centro": "Costa Centro",
    "costa-sur": "Costa Sur",
    "sierra-norte": "Sierra Norte",
    "sierra-centro": "Sierra Centro",
    "sierra-sur": "Sierra Sur",
    "selva-norte": "Selva Norte",
    "selva-centro": "Selva Centro",
    "selva-sur": "Selva Sur"
};

/*
 * Las pistas describen clima, geografía, instrumentos u
 * origen histórico de cada danza o tradición, pero evitan
 * nombrar la región, ciudad o departamento exactos: si la
 * pista dijera "Piura" o "Puno", la zona quedaría resuelta
 * de inmediato sin necesidad de conocer el folclore.
 */

const ROUNDS = [
    {
        type: "Danza",
        name: "Marinera Norteña",
        hint: "Se baila con un pañuelo blanco, mucha elegancia y un juego de miradas entre la pareja, sin taconeo fuerte. Es propia de tierras cálidas y desérticas junto al mar, en el extremo norte del país.",
        zone: "costa-norte"
    },
    {
        type: "Danza",
        name: "Tondero",
        hint: "Danza descalza, alegre y coqueta, hermana de la marinera. Nació en haciendas rodeadas de algarrobos, en tierras cálidas y áridas del norte.",
        zone: "costa-norte"
    },
    {
        type: "Danza",
        name: "Festejo",
        hint: "Danza afroperuana de ritmo alegre, mucho zapateo y presencia del cajón. Surgió en haciendas costeñas de clima templado, cerca de la capital del país.",
        zone: "costa-centro"
    },
    {
        type: "Danza",
        name: "Landó",
        hint: "Ritmo afroperuano de raíces africanas, hermano del festejo pero de compás más lento y sensual. También nació cerca de la capital, en la costa central.",
        zone: "costa-centro"
    },
    {
        type: "Danza",
        name: "Alcatraz",
        hint: "Danza afroperuana juguetona en la que se intenta quemar con una vela un papel en forma de ave atado a la cintura de la pareja. Es típica de valles costeños productores de uva y pisco, al sur de la capital.",
        zone: "costa-sur"
    },
    {
        type: "Danza",
        name: "Huayno Cajamarquino",
        hint: "Variante del huayno propia de tierras altas del norte del país, muy ligada a un carnaval famoso en toda la región por sus comparsas, coplas pícaras y juegos con agua y talco.",
        zone: "sierra-norte"
    },
    {
        type: "Danza",
        name: "Huaylarsh",
        hint: "Danza agrícola y muy enérgica, con zapateo fuerte y saltos, propia de un valle andino central conocido por su producción agropecuaria y su cercanía a la capital por tren.",
        zone: "sierra-centro"
    },
    {
        type: "Danza",
        name: "Danza de las Tijeras",
        hint: "Danza acrobática declarada Patrimonio Cultural Inmaterial de la Humanidad. Los danzantes compiten al ritmo de un violín y un arpa en tierras altas del sur andino.",
        zone: "sierra-sur"
    },
    {
        type: "Danza",
        name: "Diablada",
        hint: "Danza de máscaras y trajes muy vistosos que representan la lucha entre el bien y el mal. Se baila en el altiplano, a más de 3800 metros de altura, junto a un enorme lago compartido con un país vecino.",
        zone: "sierra-sur"
    },
    {
        type: "Danza",
        name: "Chunchada",
        hint: "Danza con plumas, lanzas y pintura corporal que representa a pueblos indígenas amazónicos. Se baila en una zona de selva alta ubicada en el centro del país.",
        zone: "selva-centro"
    },
    {
        type: "Danza",
        name: "Changanacuy",
        hint: "Danza guerrera y burlesca de la Amazonía baja, propia de la selva más extensa del país, en el extremo norte.",
        zone: "selva-norte"
    },
    {
        type: "Tradición",
        name: "Fiesta de San Juan",
        hint: "Gran fiesta amazónica del 24 de junio con danzas, comida típica y baños rituales en los ríos. Se vive con fuerza especial en la selva más biodiversa del país, cerca de importantes reservas naturales del sur.",
        zone: "selva-sur"
    }
];

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
        document.getElementById("mapaGameStage");

    const startButton =
        document.getElementById("mapaStartButton");

    const resetButton =
        document.getElementById("mapaResetButton");

    const countdown =
        document.getElementById("loveCountdown");

    const countdownText =
        document.getElementById("loveCountdownText");

    const promptLabel =
        document.getElementById("mapaPromptLabel");

    const promptElement =
        document.getElementById("mapaPrompt");

    const hintElement =
        document.getElementById("mapaHint");

    const zoneButtons =
        document.querySelectorAll(".mapa-zone");

    const feedback =
        document.getElementById("mapaFeedback");

    const roundLabel =
        document.getElementById("mapaRound");

    const scoreElement =
        document.getElementById("mapaScore");

    const streakElement =
        document.getElementById("mapaStreak");

    const livesElement =
        document.getElementById("mapaLives");

    const timeElement =
        document.getElementById("mapaTime");

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
        !promptLabel ||
        !promptElement ||
        !hintElement ||
        !zoneButtons.length ||
        !feedback ||
        !roundLabel ||
        !scoreElement ||
        !streakElement ||
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
            "No se encontraron todos los elementos necesarios del Mapa del Folklore."
        );

        throw new Error(
            "Faltan elementos HTML del Mapa del Folklore."
        );

    }

    let gameStarted = false;
    let gameRounds = [];
    let roundIndex = 0;
    let currentRoundData = null;
    let score = 0;
    let streak = 0;
    let lives = MAX_LIVES;
    let totalGameSeconds = 0;
    let totalTimerInterval = null;
    let pendingRankingResult = null;
    let passed = false;

    startButton.addEventListener(
        "click",
        startCountdown
    );

    resetButton.addEventListener(
        "click",
        restartGame
    );

    zoneButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                handleZoneGuess(
                    button.dataset.zone,
                    button
                );

            }
        );

    });

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

    function shuffleArray(items) {

        const shuffledItems =
            [...items];

        for (
            let index = shuffledItems.length - 1;
            index > 0;
            index--
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() * (index + 1)
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
        streak = 0;
        lives = MAX_LIVES;
        totalGameSeconds = 0;
        pendingRankingResult = null;
        passed = false;
        roundIndex = 0;

        gameRounds = shuffleArray(ROUNDS);

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        scoreElement.textContent = score;
        streakElement.textContent = streak;
        livesElement.textContent = "❤️".repeat(lives);
        timeElement.textContent = formatTime(0);

        clearInterval(totalTimerInterval);

        totalTimerInterval = setInterval(() => {

            totalGameSeconds++;

            timeElement.textContent =
                formatTime(totalGameSeconds);

        }, 1000);

        startSound.currentTime = 0;
        startSound.play().catch(() => { });

        loadRound();

    }

    function loadRound() {

        currentRoundData = gameRounds[roundIndex];

        roundLabel.textContent =
            `${roundIndex + 1} / ${gameRounds.length}`;

        promptLabel.textContent =
            `${currentRoundData.type} · Ronda ${roundIndex + 1} de ${gameRounds.length}`;

        promptElement.textContent =
            currentRoundData.name;

        hintElement.textContent =
            currentRoundData.hint;

        feedback.textContent = "";
        feedback.className = "mapa-feedback";

        zoneButtons.forEach((button) => {
            button.disabled = false;
            button.classList.remove("is-correct", "is-wrong");
        });

    }

    function handleZoneGuess(zone, button) {

        if (!gameStarted) {
            return;
        }

        const isCorrect =
            zone === currentRoundData.zone;

        zoneButtons.forEach((zoneButton) => {
            zoneButton.disabled = true;
        });

        if (isCorrect) {

            streak++;

            const bonus =
                Math.min(streak * 10, 50);

            const points = 100 + bonus;

            score += points;

            scoreElement.textContent = score;
            streakElement.textContent = streak;

            animateScore(points);

            button.classList.add("is-correct");

            correctSound.currentTime = 0;
            correctSound.play().catch(() => { });

            feedback.textContent =
                `¡Correcto! Es de la ${ZONE_NAMES[zone]}. +${points} puntos.`;

            feedback.className =
                "mapa-feedback is-correct";

        } else {

            streak = 0;
            lives--;

            streakElement.textContent = streak;

            livesElement.textContent =
                lives > 0 ? "❤️".repeat(lives) : "💔";

            button.classList.add("is-wrong");

            const correctButton =
                document.querySelector(
                    `.mapa-zone[data-zone="${currentRoundData.zone}"]`
                );

            correctButton?.classList.add("is-correct");

            wrongSound.currentTime = 0;
            wrongSound.play().catch(() => { });

            feedback.textContent =
                `No era ahí. ${currentRoundData.name} es de la ${ZONE_NAMES[currentRoundData.zone]}.`;

            feedback.className =
                "mapa-feedback is-wrong";

        }

        setTimeout(() => {

            if (lives <= 0) {
                finishGame(false);
            } else {
                advanceRound();
            }

        }, isCorrect ? 1000 : 1500);

    }

    function advanceRound() {

        roundIndex++;

        if (roundIndex >= gameRounds.length) {
            finishGame(true);
            return;
        }

        loadRound();

    }

    async function finishGame(didWin) {

        gameStarted = false;
        passed = didWin;

        clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        const finalScore = score;
        const finalTime = totalGameSeconds;
        const finalLives = lives;
        const finalRoundIndex = roundIndex;
        const formattedTime = formatTime(finalTime);

        if (didWin) {

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML =
                '<i class="fa-solid fa-trophy"></i>';

            resultLabel.textContent =
                "Desafío completado";

            resultTitle.textContent =
                "¡Conoces bien nuestro folclore!";

            resultText.textContent =
                `Completaste las ${gameRounds.length} rondas en ${formattedTime} y obtuviste ${finalScore} puntos.`;

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
                `Llegaste a la ronda ${finalRoundIndex + 1} de ${gameRounds.length} con ${finalScore} puntos en ${formattedTime}.`;

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
                correctAnswers: gameRounds.length,
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
                        ? `Tu nuevo resultado ocuparía el puesto ${result.position} del ranking.`
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
        streak = 0;
        lives = MAX_LIVES;
        roundIndex = 0;
        totalGameSeconds = 0;
        gameRounds = [];
        pendingRankingResult = null;
        passed = false;

        clearInterval(totalTimerInterval);
        totalTimerInterval = null;

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

        scoreElement.textContent = "0";
        streakElement.textContent = "0";
        livesElement.textContent = "❤️❤️❤️";
        timeElement.textContent = formatTime(0);
        roundLabel.textContent = `1 / ${ROUNDS.length}`;

        feedback.textContent = "";
        feedback.className = "mapa-feedback";

        zoneButtons.forEach((button) => {
            button.disabled = false;
            button.classList.remove("is-correct", "is-wrong");
        });

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
