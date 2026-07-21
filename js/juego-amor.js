document.addEventListener("DOMContentLoaded", () => {

  const secretRoomUnlocked =
    localStorage.getItem(
      "secretRoomUnlocked"
    ) === "true";

  if (!secretRoomUnlocked) {
    window.location.replace("index.html");
    return;
  }
  const startButton =
    document.getElementById("loveStartButton");

  const charactersContainer =
    document.getElementById("loveCharacters");

  const gameStage =
    document.getElementById("loveGameStage");

  const gameWelcome =
    document.querySelector(".love-game-welcome");

  const countdown =
    document.getElementById("loveCountdown");

  const countdownText =
    document.getElementById("loveCountdownText");

  const timeElement =
    document.getElementById("loveTime");

  const scoreElement =
    document.getElementById("loveScore");

  const livesElements =
    document.querySelectorAll(
      ".love-lives-list i"
    );

  const gameOverScreen =
    document.querySelector(
      ".love-game-over"
    );

  const finalScoreElement =
    document.getElementById(
      "loveFinalScore"
    );

  const restartButton =
    document.getElementById(
      "loveRestartButton"
    );
  
  const resetButton =
    document.getElementById(
      "loveResetButton"
    );

  const bestScoreElement =
    document.getElementById(
      "loveBestScore"
    );




  const members = [
    {
      name: "Ricardo",
      image: "../img/juegos/personajes/ricardo.png"
    },
    {
      name: "Omar",
      image: "../img/juegos/personajes/omar.png"
    },
    {
      name: "Luis",
      image: "../img/juegos/personajes/luis.png"
    },
    {
      name: "Eileen",
      image: "../img/juegos/personajes/eileen.png"
    },
    {
      name: "Jayro",
      image: "../img/juegos/personajes/jayro.png"
    },
    {
      name: "Josema",
      image: "../img/juegos/personajes/josema.png"
    },
    {
      name: "Snaider",
      image: "../img/juegos/personajes/snaider.png"
    },
    {
      name: "Sol",
      image: "../img/juegos/personajes/sol.png"
    },
    {
      name: "Yanira",
      image: "../img/juegos/personajes/yanira.png"
    }
  ];

  const badObjects = [
    {
      name: "Celular",
      image: "../img/juegos/objetos/celular.png"
    },
    {
      name:"Audifonos",
      image:"../img/juegos/objetos/audifonos.png"
    },
    {
      name:"Televisor",
      image:"../img/juegos/objetos/tele.png"
    },
    {
      name:"Cama",
      image:"../img/juegos/objetos/cama.png"
    },
    {
      name:"Cerveza",
      image:"../img/juegos/objetos/cerveza.png"
    },
    {
      name:"Dinero",
      image:"../img/juegos/objetos/dinero.png"
    },
    {
      name:"Hamburguesa",
      image:"../img/juegos/objetos/hamburguesa.png"
    },
    {
      name:"Piedra",
      image:"../img/juegos/objetos/piedra.png"
    },
    {
      name:"sombrero",
      image:"../img/juegos/objetos/sombrero.png"
    },
    {
      name:"Tijera",
      image:"../img/juegos/objetos/tijera.png"
    }
  ];

  const heartsContainer =
    document.getElementById("loveHearts");

  const objectsContainer =
    document.getElementById("loveObjects");

  const hitSound = new Audio("../audio/hit.mp3");
  const wrongSound = new Audio("../audio/wrong.mp3");
  const startSound = new Audio("../audio/start.mp3");
  const gameOverSound = new Audio("../audio/gameover.mp3");
  const unlockSound = new Audio("../audio/unlock.mp3");

  const unlockModal =
    document.getElementById(
      "loveUnlockModal"
    );

  const unlockButton =
    document.getElementById(
      "loveUnlockButton"
    );

  hitSound.preload = "auto";
  wrongSound.preload = "auto";
  startSound.preload = "auto";
  gameOverSound.preload = "auto";
  unlockSound.preload = "auto";
  

  let gameSeconds = 0;
  let timerInterval = null;
  let score = 0;
  let difficultyLevel = 0;
  let bestScore =
    Number(
      localStorage.getItem(
        "loveBestScore"
      )
    ) || 0;
  let lives = 5;
  let gameOver = false;
  let objectsCreated = 1;

  const gameCharacters = [];
  const gameObjects = [];
  let selectedMembers = [];
  let charactersCreated = 3;

  if (
    !startButton ||
    !gameStage ||
    !gameWelcome ||
    !countdown ||
    !countdownText ||
    !timeElement ||
    !scoreElement ||
    livesElements.length === 0 ||
    !charactersContainer ||
    !heartsContainer ||
    !gameOverScreen ||
    !finalScoreElement ||
    !restartButton ||
    !resetButton ||
    !bestScoreElement ||
    !objectsContainer
    
  ) {
    console.error(
      "No se encontraron todos los elementos necesarios del juego."
    );

    return;
  }

  bestScoreElement.textContent =
    bestScore;

  startButton.addEventListener("click", () => {

    startButton.disabled = true;

    gameWelcome.classList.add("is-hidden");

    setTimeout(() => {
      startCountdown();
    }, 450);

  });

  restartButton.addEventListener("click", () => {

    restartGame();

  });

  resetButton.addEventListener("click", () => {

    restartGame();

  });

  function startCountdown() {

    const steps = [
      "3",
      "2",
      "1",
      "¡A bailar!"
    ];

    let currentStep = 0;

    countdown.classList.add("is-visible");

    showCountdownStep(
      steps[currentStep],
      false
    );

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

  function startGame() {

    resetButton.classList.add(
      "is-visible"
    );

    gameStage.classList.add("is-playing");

    startSound.currentTime = 0;

    startSound.play().catch(() => {
      // El navegador podría bloquear el audio.
    });

    clearInterval(timerInterval);

    gameSeconds = 0;
    difficultyLevel = 0;
    updateGameTime();
    score = 0;
    updateScore();
    lives = 5;
    updateLives();
    gameOver = false;
    selectRandomMembers();
    charactersCreated = 3;

    timerInterval = setInterval(() => {

      gameSeconds++;
      updateGameTime();
      updateDifficulty();

    }, 1000);

    selectedMembers
      .slice(0, 3)
      .forEach((member) => {

        const character =
          createCharacter(member);

        gameCharacters.push(character);

        showCharacter(character);

        moveCharacter(character);

      });

    objectsCreated = 1;
    addObject();

  }
  
  function addObject() {

    const randomItem =
      badObjects[
        Math.floor(
          Math.random() *
          badObjects.length
        )
      ];

    const object =
      createObject(randomItem);

    gameObjects.push(object);

    showObject(object);

    fallObject(object);

  }

  function updateGameTime() {

    const minutes =
      Math.floor(gameSeconds / 60);

    const seconds =
      gameSeconds % 60;

    timeElement.textContent =
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

  }

  function updateDifficulty() {

    if (gameSeconds >= 75) {

      difficultyLevel = 3;

    } else if (gameSeconds >= 50) {

      difficultyLevel = 2;

    } else if (gameSeconds >= 25) {

      difficultyLevel = 1;

    } else {

      difficultyLevel = 0;

    }

    if (
      difficultyLevel >= 1 &&
      objectsCreated < 2
    ) {

      addObject();

      objectsCreated++;

    }

    if (
      difficultyLevel >= 3 &&
      objectsCreated < 3
    ) {

      addObject();

      objectsCreated++;

    }

    if (
      difficultyLevel >= 2 &&
      charactersCreated < 4
    ) {

      addCharacter();

    }
    if (
      difficultyLevel >= 3 &&
      charactersCreated < 5
    ) {

      addCharacter();

    }

  }

  function updateScore() {

    scoreElement.textContent = score;

  }

  function updateLives() {

    livesElements.forEach((heart, index) => {

      if (index < lives) {

        heart.style.opacity = "1";

      } else {

        heart.style.opacity = "0.2";

      }

    });

  }


  function addPoint() {

    score++;

    updateScore();

    if (score > bestScore) {

      bestScore = score;

      bestScoreElement.textContent =
        bestScore;

      localStorage.setItem(
        "loveBestScore",
        bestScore
      );

    }

    if (
      score >= 200 &&
      !localStorage.getItem(
        "secondGameUnlocked"
      )
    ) {

      localStorage.setItem(
        "secondGameUnlocked",
        "true"
      );
      showSecondGameUnlocked();

    }

  }

  function loseLife() {

    if (lives <= 0) {
      return;
    }

    lives--;

    updateLives();

    if (lives === 0) {

      endGame();

    }

  }

  function freezeElement(element) {

    const stageRect =
      gameStage.getBoundingClientRect();

    const elementRect =
      element.getBoundingClientRect();

    const currentX =
      elementRect.left - stageRect.left;

    const currentY =
      elementRect.top - stageRect.top;

    element.style.transition = "none";

    element.style.left =
      `${currentX}px`;

    element.style.top =
      `${currentY}px`;

  }

  function endGame() {

    gameOver = true;
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {});

    clearInterval(timerInterval);

    gameCharacters.forEach((character) => {

      freezeElement(character);

    });

    gameObjects.forEach((object) => {

      freezeElement(object);

    });

    console.log("GAME OVER");
    finalScoreElement.textContent =
        score;

    gameOverScreen.classList.add(
        "is-visible"
    );

    resetButton.classList.remove(
      "is-visible"
    );

  }

  function restartGame() {

    clearInterval(timerInterval);

    gameOverScreen.classList.remove(
      "is-visible"
    );

    gameStage.classList.remove(
      "is-playing"
    );

    charactersContainer.innerHTML = "";
    objectsContainer.innerHTML = "";
    heartsContainer.innerHTML = "";

    gameCharacters.length = 0;
    gameObjects.length = 0;

    gameSeconds = 0;
    score = 0;
    lives = 5;

    updateGameTime();
    updateScore();
    updateLives();

    gameOver = false;

    difficultyLevel = 0;
    objectsCreated = 1;

    setTimeout(() => {

      startCountdown();

    }, 350);

  }

  function createCharacter(member) {

    const character =
      document.createElement("div");

    character.className =
      "love-character";

    character.dataset.active = "false";
    character.dataset.name = member.name;
    character.member = member;

    character.innerHTML = `
      <img
        src="${member.image}"
        alt="${member.name}"
      >
    `;

    charactersContainer.appendChild(character);
    character.classList.add("hidden");

    return character;

  }

  function moveCharacter(character) {

    if(gameOver || !character.isConnected){
      return;
    }

    const stageWidth =
      gameStage.clientWidth;

    const stageHeight =
      gameStage.clientHeight;

    const characterWidth =
      character.offsetWidth || 120;

    const characterHeight =
      character.offsetHeight || 180;

    const maxX =
      Math.max(
        0,
        stageWidth - characterWidth
      );

    const maxY =
      Math.max(
        0,
        stageHeight - characterHeight
      );

    const currentX =
      parseFloat(character.style.left) || 0;

    const newX =
      Math.random() * maxX;

    const newY =
      Math.random() * maxY;

    const moveDuration =
      1800 + Math.random() * 1700;

    if (newX < currentX) {

      character.style.transform =
        "scaleX(-1)";

    } else {

      character.style.transform =
        "scaleX(1)";

    }

    character.style.transitionDuration =
      `${moveDuration}ms, ${moveDuration}ms, 250ms`;

    character.style.left =
      `${newX}px`;

    character.style.top =
      `${newY}px`;

    setTimeout(() => {

      moveCharacter(character);

    }, moveDuration + 400);

  }

  function showCharacter(character) {

    const stageWidth =
      gameStage.clientWidth;

    const stageHeight =
      gameStage.clientHeight;

    const characterWidth =
      character.offsetWidth || 120;

    const characterHeight =
      character.offsetHeight || 180;

    const maxX =
      Math.max(
        0,
        stageWidth - characterWidth
      );

    const maxY =
      Math.max(
        0,
        stageHeight - characterHeight
      );

    const x =
      Math.random() * maxX;

    const y =
      Math.random() * maxY;

    character.style.left =
      `${x}px`;

    character.style.top =
      `${y}px`;

    character.classList.remove("hidden");
    character.dataset.active = "true";

  }

  function hideCharacter(character) {

    character.classList.add("hidden");
    character.dataset.active = "false";

  }

  function launchHeart(targetX, targetY){

    const heart =
        document.createElement("div");

    heart.className =
        "love-heart";

    heart.textContent = "❤️";

    const startX =
        gameStage.clientWidth / 2;

    const startY =
        gameStage.clientHeight + 40;

    heart.style.left =
        `${startX}px`;

    heart.style.top =
        `${startY}px`;

    heartsContainer.appendChild(heart);

    requestAnimationFrame(()=>{

        heart.style.left =
            `${targetX}px`;

        heart.style.top =
            `${targetY}px`;

    });

    const collisionInterval =
      setInterval(() => {

        if (
          gameOver ||
          !heart.isConnected
        ) {
          clearInterval(
            collisionInterval
          );

          return;
        }

        const hitCharacter =
          checkHeartCollision(heart);

        const hitObject =
          checkObjectCollision(heart);

        if (hitCharacter) {

          clearInterval(
            collisionInterval
          );

          removeHeart(heart);

          return;
        }

        if (hitObject) {

          clearInterval(
            collisionInterval
          );

          loseLife();
          removeHeart(heart);

        }

      }, 20);

    setTimeout(() => {

      clearInterval(
        collisionInterval
      );

      removeHeart(heart);

    }, 900);

  }

  function removeHeart(heart) {

    if (!heart.isConnected) {
      return;
    }

    heart.remove();

  }

  function checkHeartCollision(heart){

    const heartRect =
      heart.getBoundingClientRect();

    for(const character of gameCharacters){

      if(character.dataset.active !== "true"){
        continue;
      }

      const characterRect =
        character.getBoundingClientRect();

      const collision =

        heartRect.left < characterRect.right &&
        heartRect.right > characterRect.left &&
        heartRect.top < characterRect.bottom &&
        heartRect.bottom > characterRect.top;

      if (collision) {

        character.classList.add(
          "is-hit"
        );

        setTimeout(() => {

          if (character.isConnected) {

            character.classList.remove(
              "is-hit"
            );

          }

        }, 350);
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});

        addPoint();

        return character;

      }

    }

    return null;

  }

  gameStage.addEventListener("click",(event)=>{
  
      if(
          !gameStage.classList.contains("is-playing") || gameOver
      ){
          return;
      }
  
      const rect =
          gameStage.getBoundingClientRect();
  
      const x =
          event.clientX - rect.left;
  
      const y =
          event.clientY - rect.top;
  
      launchHeart(x,y);
  
  });
  
  function createObject(item){

    const object =
        document.createElement("div");

    object.className =
        "love-object";

    object.innerHTML = `
        <img
            src="${item.image}"
            alt="${item.name}">
    `;

    objectsContainer.appendChild(object);

    return object;

  }

  function showObject(object) {

    const stageWidth =
      gameStage.clientWidth;

    const objectWidth =
      object.offsetWidth || 70;

    const maxX =
      Math.max(
        0,
        stageWidth - objectWidth
      );

    const x =
      Math.random() * maxX;

    object.style.left =
      `${x}px`;

    object.style.top =
      `-${object.offsetHeight || 70}px`;

  }

  function fallObject(object) {

    if (gameOver || !object.isConnected) {
      return;
    }

    const stageHeight =
      gameStage.clientHeight;

    const objectHeight =
      object.offsetHeight || 70;

    let minDuration = 3000;
    let extraDuration = 2500;

    if (difficultyLevel === 2) {

      minDuration = 2700;
      extraDuration = 2200;

    } else if (difficultyLevel >= 3) {

      minDuration = 2400;
      extraDuration = 1900;

    }

    const fallDuration =
      minDuration +
      Math.random() * extraDuration;

    object.style.transitionDuration =
      `${fallDuration}ms`;

    requestAnimationFrame(() => {

      object.style.top =
        `${stageHeight + objectHeight}px`;

    });

    setTimeout(() => {

      resetObject(object);

    }, fallDuration);

  }

  function resetObject(object) {

    if (gameOver || !object.isConnected) {
      return;
    }

    const stageWidth =
      gameStage.clientWidth;

    const objectWidth =
      object.offsetWidth || 70;

    const maxX =
      Math.max(
        0,
        stageWidth - objectWidth
      );

    const newX =
      Math.random() * maxX;

    object.style.transition = "none";

    object.style.left =
      `${newX}px`;

    object.style.top =
      `-${object.offsetHeight || 70}px`;

    void object.offsetWidth;

    object.style.transition =
      "top 4s linear";

    fallObject(object);

  }

  function checkObjectCollision(heart) {

    const heartRect =
      heart.getBoundingClientRect();

    for (const object of gameObjects) {

      const objectRect =
        object.getBoundingClientRect();

      const collision =
        heartRect.left < objectRect.right &&
        heartRect.right > objectRect.left &&
        heartRect.top < objectRect.bottom &&
        heartRect.bottom > objectRect.top;

      if (collision) {

        object.classList.add(
          "is-hit"
        );

        setTimeout(() => {

          if (object.isConnected) {

            object.classList.remove(
              "is-hit"
            );

          }

        }, 350);
        wrongSound.currentTime = 0;
        wrongSound.play().catch(() => {});

        return object;

      }

    }

    return null;

  }

  function selectRandomMembers() {

    const shuffledMembers = [...members];

    for (
      let i = shuffledMembers.length - 1;
      i > 0;
      i--
    ) {

      const randomIndex =
        Math.floor(
          Math.random() * (i + 1)
        );

      [
        shuffledMembers[i],
        shuffledMembers[randomIndex]
      ] = [
        shuffledMembers[randomIndex],
        shuffledMembers[i]
      ];

    }

    selectedMembers =
      shuffledMembers.slice(0, 5);

  }

  function addCharacter() {

    const member =
      selectedMembers[charactersCreated];

    if (!member) {
      return;
    }

    const character =
      createCharacter(member);

    gameCharacters.push(character);

    showCharacter(character);

    moveCharacter(character);

    charactersCreated++;

  }

  function showSecondGameUnlocked() {

    unlockSound.currentTime = 0;

    unlockSound.play().catch(() => {
      console.log(
        "El sonido de desbloqueo no pudo reproducirse."
      );
    });

    unlockModal?.classList.add(
      "is-visible"
    );

  }

  unlockButton?.addEventListener(
    "click",
    () => {

      unlockModal?.classList.remove(
        "is-visible"
      );

    }
  );


});
