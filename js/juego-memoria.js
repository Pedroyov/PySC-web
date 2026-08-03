import {
  GAMES
} from "./game-config.js";

import {
  checkMemoryResult,
  saveBestMemoryResult,
  getMemoryRanking
} from "./firebase-ranking.js";

const GAME =
  GAMES.MEMORY;

document.addEventListener("DOMContentLoaded", () => {

  const secretRoomUnlocked =
    localStorage.getItem(
      "secretRoomUnlocked"
    ) === "true";

  if (!secretRoomUnlocked) {
    window.location.replace("../index.html");
    return;
  }

  const TOTAL_IMAGES = 20;
  const PAIRS_PER_GAME = 10;

  const availableImages = Array.from(
    { length: TOTAL_IMAGES },
    (_, index) => {

        const imageNumber =
        String(index + 1).padStart(2, "0");

        return `../img/juegos/memoria/${imageNumber}.jpg`;

    }
    );

  const startButton =
    document.getElementById(
      "memoryStartButton"
    );

  const gameStage =
    document.getElementById(
      "memoryGameStage"
    );

  const gameWelcome =
    document.querySelector(
      ".love-game-welcome"
    );

  const countdown =
    document.getElementById(
      "loveCountdown"
    );

  const countdownText =
    document.getElementById(
      "loveCountdownText"
    );

  const timeElement =
    document.getElementById(
      "memoryTime"
    );

  const memoryBoard =
    document.getElementById(
        "memoryBoard"
    );

  const resetButton =
    document.getElementById(
      "loveResetButton"
    );

  const unlockModal =
    document.getElementById(
        "loveUnlockModal"
    );

  const unlockTitle =
    document.getElementById(
        "loveUnlockTitle"
    );

  const unlockText =
    document.getElementById(
        "loveUnlockText"
    );

  const unlockLabel =
    document.getElementById(
        "loveUnlockLabel"
    );

  const unlockIcon =
    document.getElementById(
        "loveUnlockIcon"
    );

  const unlockButtonText =
    document.getElementById(
        "loveUnlockButtonText"
    );

  const unlockButton =
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

  const startSound =
    new Audio("../audio/start.mp3");

  const successSound =
    new Audio("../audio/success.mp3");

  const backgroundMusic =
        new Audio("../audio/memory.mp3");

  backgroundMusic.preload = "auto";
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.8;

  successSound.preload = "auto";

  startSound.preload = "auto";

  let gameSeconds = 0;
  let timerInterval = null;
  let firstCard = null;
  let secondCard = null;
  let boardLocked = true;
  let attempts = 0;
  let matchedPairs = 0;
  let passed = false;
  let pendingRankingResult = null;

  if (
    !startButton ||
    !gameStage ||
    !gameWelcome ||
    !countdown ||
    !countdownText ||
    !timeElement ||
    !memoryBoard ||
    !resetButton
  ) {
    console.error(
      "No se encontraron todos los elementos necesarios del juego."
    );

    return;
  }

  startButton.addEventListener(
    "click",
    () => {

      startButton.disabled = true;

      gameWelcome.classList.add(
        "is-hidden"
      );

      setTimeout(() => {
        startCountdown();
      }, 450);

    }
  );

  resetButton.addEventListener(
    "click",
    () => {

      restartGame();

    }
  );

  function startCountdown() {

    const steps = [
      "3",
      "2",
      "1",
      "¡A recordar!"
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

  function showCountdownStep(
    text,
    isFinal
  ) {

    countdownText.classList.remove(
      "is-changing",
      "is-final"
    );

    void countdownText.offsetWidth;

    countdownText.textContent = text;

    countdownText.classList.add(
      "is-changing"
    );

    if (isFinal) {
      countdownText.classList.add(
        "is-final"
      );
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

    updateGameTime();

    createBoard();

    setTimeout(() => {

      hideCards();

    }, 3000);

    timerInterval = setInterval(
      () => {

        gameSeconds++;

        updateGameTime();

      },
      1000
    );

  }

  function updateGameTime() {

    const minutes =
      Math.floor(
        gameSeconds / 60
      );

    const seconds =
      gameSeconds % 60;

    timeElement.textContent =
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

  }

  function getRandomImages() {

    const shuffledImages =
        [...availableImages].sort(
        () => Math.random() - 0.5
        );

    return shuffledImages.slice(
        0,
        PAIRS_PER_GAME
    );

  }

  function createBoard() {

    memoryBoard.innerHTML = "";

    const selectedImages =
        getRandomImages();

    const gameCards = [
        ...selectedImages,
        ...selectedImages
    ];

    gameCards.sort(
        () => Math.random() - 0.5
    );

    gameCards.forEach((image) => {

        const card =
        document.createElement("div");

        card.className =
        "memory-card";

        card.dataset.image = image;

        card.classList.add("flipped");

        card.innerHTML = `
            <div class="memory-card-inner">

                <div class="memory-card-front">

                    <img
                        src="${image}"
                        alt=""
                    >

                </div>

                <div class="memory-card-back">

                    <img
                        src="../img/juegos/memoria/back.png"
                        alt=""
                    >

                </div>

            </div>
        `;

        card.addEventListener("click", () => {

          flipCard(card);

        });

        memoryBoard.appendChild(card);

    });

  }

  function hideCards() {

    const cards =
        document.querySelectorAll(
        ".memory-card"
        );

    cards.forEach((card) => {

        card.classList.remove(
        "flipped"
        );

    });

    boardLocked = false;

  }

  function flipCard(card) {

    if (card.classList.contains("flipped")) {
        return;
    }

    if (boardLocked) {
        return;
    }

    if (card === firstCard) {
        return;
    }

    if (card.classList.contains("matched")) {
        return;
    }

    card.classList.add("flipped");

    if (!firstCard) {

        firstCard = card;
        return;

    }

    secondCard = card;

    boardLocked = true;

    attempts++;

    memoryAttempts.textContent =
        attempts;

    checkForMatch();

  }

  function checkForMatch() {

    const isMatch =
        firstCard.dataset.image ===
        secondCard.dataset.image;

    if (isMatch) {

        disableMatchedCards();
        return;

    }

    hideUnmatchedCards();

  }

  function disableMatchedCards(){

    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    matchedPairs++;

    memoryPairs.textContent =
        `${matchedPairs} / ${PAIRS_PER_GAME}`;

    resetSelectedCards();

    if (
      matchedPairs === PAIRS_PER_GAME
    ) {

      finishGame();

    }

  }

  function hideUnmatchedCards() {

    setTimeout(() => {

        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");

        resetSelectedCards();

    }, 900);

  }

  function resetSelectedCards() {

    firstCard = null;
    secondCard = null;
    boardLocked = false;

  }

  function formatTime(
    totalSeconds
  ) {

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

  async function processMemoryRanking(
    finalAttempts,
    finalTime
  ) {

    try {

      const result =
        await checkMemoryResult(
          GAME.id,
          finalAttempts,
          finalTime
        );

      if (!result.newPersonalRecord) {
        return false;
      }

      pendingRankingResult = {
        ...result,
        attempts: finalAttempts,
        time: finalTime
      };

      rankingModalScore.textContent =
        `${finalAttempts} intentos · ${formatTime(finalTime)}`;

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
            : "Has mejorado tu resultado anterior.";

        rankingNameGroup.hidden = true;

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
        "No se pudo comprobar el ranking de Memoria:",
        error
      );

      return false;

    }

  }

  async function openMemoryLeaderboard() {

    leaderboardModal.classList.add(
      "is-visible"
    );

    leaderboardModal.setAttribute(
      "aria-hidden",
      "false"
    );

    leaderboardLoading.hidden = false;
    leaderboardEmpty.hidden = true;

    leaderboardList.innerHTML = "";

    try {

      const ranking =
        await getMemoryRanking(
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

        item.innerHTML = `
          <span class="leaderboard-position">
            ${positionContent}
          </span>

          <span class="leaderboard-player">
            ${player.name}
          </span>

          <strong class="leaderboard-score">
            ${player.attempts} intentos · ${formatTime(player.time)}
          </strong>
        `;

        leaderboardList.appendChild(
          item
        );

      });

    } catch (error) {

      leaderboardLoading.textContent =
        "No se pudo cargar la clasificación.";

      console.error(
        "Error cargando el ranking de Memoria:",
        error
      );

    }

  }

  function showUnlockResultModal() {

    setTimeout(() => {

      unlockModal.classList.add(
        "is-visible"
      );

    }, 350);

  }

  async function finishGame() {

    const finalAttempts =
      attempts;

    const finalTime =
      gameSeconds;


    clearInterval(timerInterval);
    timerInterval = null;

    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

    boardLocked = true;

    passed =
        attempts <= 15;

    if (passed) {

        successSound.currentTime = 0;

        successSound.play().catch(() => {});

        showCelebration();

        unlockLabel.textContent =
            "Nuevo desafío desbloqueado";

        unlockTitle.textContent =
            "¡Desafío superado!";

        unlockText.textContent =
            "Has encontrado las 10 parejas en 15 intentos o menos. El tercer desafío del Rincón Secreto ha sido desbloqueado.";

        unlockButtonText.textContent =
            "Continuar";

        unlockIcon.innerHTML =
            '<i class="fa-solid fa-lock-open"></i>';

        localStorage.setItem(
            "thirdGameUnlocked",
            "true"
        );

    } else {

        unlockLabel.textContent =
            "Desafío no superado";

        unlockTitle.textContent =
            "¡Casi lo logras!";

        unlockText.textContent =
            "Encontraste todas las parejas, pero utilizaste más de 15 intentos. Inténtalo nuevamente para desbloquear el tercer desafío.";

        unlockButtonText.textContent =
            "Intentar nuevamente";

        unlockIcon.innerHTML =
            '<i class="fa-solid fa-rotate-right"></i>';

    }

    const rankingOpened =
      await processMemoryRanking(
        finalAttempts,
        finalTime
      );

    if (!rankingOpened) {

      showUnlockResultModal();

    }

  }

  function showCelebration() {

    const celebration =
        document.createElement("div");

    celebration.className =
        "memory-celebration";

    celebration.innerHTML =
        "<span>🏆✨</span>";

    gameStage.appendChild(
        celebration
    );

    setTimeout(() => {

        celebration.remove();

    },1200);

  }

  function restartGame() {

    clearInterval(timerInterval);
    timerInterval = null;

    gameSeconds = 0;
    attempts = 0;
    matchedPairs = 0;

    firstCard = null;
    secondCard = null;

    boardLocked = true;

    timeElement.textContent =
        "00:00";

    memoryAttempts.textContent =
        "0";

    memoryPairs.textContent =
        `0 / ${PAIRS_PER_GAME}`;

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

  unlockButton.addEventListener(
    "click",
    () => {

        unlockModal.classList.remove(
        "is-visible"
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

      rankingSaveButton.disabled = true;

      try {

        await saveBestMemoryResult(
          GAME.id,
          pendingRankingResult.attempts,
          pendingRankingResult.time,
          playerName
        );

        rankingModal.classList.remove(
          "is-visible"
        );

        rankingModal.setAttribute(
          "aria-hidden",
          "true"
        );

        showUnlockResultModal();

        pendingRankingResult = null;

      } catch (error) {

        console.error(
          "No se pudo guardar el resultado de Memoria:",
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

      openMemoryLeaderboard();

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