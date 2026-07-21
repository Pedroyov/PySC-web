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

  function finishGame() {

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

    setTimeout(() => {

        unlockModal.classList.add(
            "is-visible"
        );

    },1200);

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

});