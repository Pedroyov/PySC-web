document.addEventListener("DOMContentLoaded", () => {

  const secretRoomUnlocked =
    localStorage.getItem(
      "secretRoomUnlocked"
    ) === "true";

  if (!secretRoomUnlocked) {
    window.location.replace("../index.html");
    return;
  }

  const LEVELS = [
    {
        rows: 8,
        columns: 8,
        mines: 10
    },
    {
        rows: 8,
        columns: 8,
        mines: 12
    },
    {
        rows: 8,
        columns: 8,
        mines: 15
    },
    {
        rows: 10,
        columns: 10,
        mines: 20
    },
    {
        rows: 10,
        columns: 10,
        mines: 30
    }
  ];


  const startButton =
    document.getElementById(
      "minesweeperStartButton"
    );

  const gameStage =
    document.getElementById(
      "minesweeperGameStage"
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
      "minesweeperTime"
    );

  const minesweeperBoard =
    document.getElementById(
        "minesweeperBoard"
    );

  const resetButton =
    document.getElementById(
      "minesweeperResetButton"
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

  const levelMessage =
    document.getElementById(
        "minesweeperLevelMessage"
    );

  const victorySound =
    new Audio("../audio/victory.mp3");


  const startSound =
    new Audio("../audio/start.mp3");

  const successSound =
    new Audio("../audio/success.mp3");

  const backgroundMusic =
        new Audio("../audio/memory.mp3");

  backgroundMusic.preload = "auto";
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.8;
  victorySound.preload = "auto";

  successSound.preload = "auto";

  startSound.preload = "auto";

  let gameSeconds = 0;
  let timerInterval = null;

  let currentLevel = 1;
  let lives = 5;
  let boardLocked = true;
  let passed = false;
  let board = [];
  let levelCompleted = false;
  let firstMove = true;


  const livesElement =
    document.getElementById(
        "minesweeperLives"
    );

  if (
    !startButton ||
    !gameStage ||
    !gameWelcome ||
    !countdown ||
    !countdownText ||
    !timeElement ||
    !minesweeperBoard ||
    !levelMessage ||
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
      "¡A buscar!"
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

    passed = false;

    gameSeconds = 0;
    lives = 5;

    updateLives();

    currentLevel = 1;

    updateLevel();

    updateGameTime();

    boardLocked = true;

    createBoard();

    boardLocked = false;

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

  function updateLives() {

    let hearts = "";

    for (let i = 0; i < 5;i++) {

        hearts +=
        i < lives
            ? "❤️"
            : "🖤";

    }

    livesElement.textContent =
        hearts;

  }

  function restartCurrentLevel() {

    boardLocked = true;

    setTimeout(() => {

        if (lives <= 0) {
            currentLevel = 1;
            lives = 5;

            updateLives();
            updateLevel();
        }

        createBoard();
        boardLocked = false;

    }, 2100);
  }

  function showAllMines() {

    for (let row = 0; row < board.length; row++) {

        for (let column = 0; column < board[row].length; column++) {

            const cellData =
                board[row][column];

            if (!cellData.mine) {
                continue;
            }

            const cellElement =
                minesweeperBoard.querySelector(
                    `[data-row="${row}"][data-column="${column}"]`
                );

            if (!cellElement) {
                continue;
            }

            cellElement.classList.add(
                "is-mine"
            );

            cellElement.innerHTML =
                '<i class="fa-solid fa-bomb"></i>';

        }

    }

  }

  function checkLevelCompleted() {

    if (levelCompleted) {
        return;
    }

    const level =
        LEVELS[currentLevel - 1];

    let revealed = 0;

    for (const row of board) {

        for (const cell of row) {

            if (
                cell.revealed &&
                !cell.mine
            ) {
                revealed++;
            }

        }

    }

    const safeCells =
        (level.rows * level.columns) -
        level.mines;

    if (revealed !== safeCells) {
        return;
    }

    levelCompleted = true;
    boardLocked = true;

    showLevelCompletedMessage();

    setTimeout(() => {

        levelMessage.classList.remove(
            "is-visible"
        );

        nextLevel();

    }, 1200);

  }

  function showLevelCompletedMessage() {

    levelMessage.textContent =
        `¡Nivel ${currentLevel} completado! 🎉`;

    levelMessage.classList.add(
        "is-visible"
    );

  }

  function nextLevel() {

    if (currentLevel < LEVELS.length) {

        currentLevel++;

        updateLevel();

        createBoard();

        boardLocked = false;

        return;

    }

    finishGame();

  }

  function finishGame() {

    clearInterval(
        timerInterval
    );

    boardLocked = true;

    passed = true;

    backgroundMusic.pause();

    victorySound.currentTime = 0;

    victorySound.play().catch(() => {});

    localStorage.setItem(
        "fourthGameUnlocked",
        "true"
    );

    unlockIcon.textContent = "🏆";

    unlockTitle.textContent =
        "¡Felicidades!";

    unlockText.textContent =
        "Has superado los cinco niveles del Buscaminas.";

    unlockLabel.textContent =
        "Juego 4 desbloqueado";

    unlockButtonText.textContent =
        "Continuar";

    unlockModal.classList.add(
        "is-visible"
    );

  }

  function updateLevel() {

    const levelElement =
        document.getElementById(
        "minesweeperLevel"
        );

    levelElement.textContent =
        `${currentLevel} / ${LEVELS.length}`;

  }

  function createBoard() {

    levelCompleted = false;
    firstMove = true;

    minesweeperBoard.innerHTML = "";
    board = [];

    const levelConfig =
      LEVELS[currentLevel - 1];

    const rows =
      levelConfig.rows;

    const columns =
      levelConfig.columns;

    minesweeperBoard.style.gridTemplateColumns =
        `repeat(${columns}, 1fr)`;

    for (let row = 0; row < rows; row++) {

        board[row] = [];

        for (let column = 0; column < columns; column++) {

            board[row][column] = {
            mine: false,
            revealed: false,
            flagged: false,
            adjacent: 0
            };

            const cell =
            document.createElement("button");

            cell.type = "button";

            cell.className =
            "minesweeper-cell";

            cell.dataset.row = row;
            cell.dataset.column = column;

            let longPressTimer = null;
            let longPressTriggered = false;

            let pointerStartX = 0;
            let pointerStartY = 0;

            cell.addEventListener(
                "pointerdown",
                (event) => {

                    /*
                    * Solo procesamos:
                    * - clic izquierdo en PC;
                    * - toque en celular;
                    * - lápiz táctil.
                    */
                    if (event.button !== 0) {
                        return;
                    }

                    pointerStartX = event.clientX;
                    pointerStartY = event.clientY;

                    longPressTriggered = false;

                    longPressTimer = setTimeout(() => {

                        longPressTriggered = true;

                        toggleFlag(
                            row,
                            column,
                            cell
                        );

                    }, 550);

                }
            );

            cell.addEventListener(
                "pointermove",
                (event) => {

                    const movementX =
                        Math.abs(
                            event.clientX -
                            pointerStartX
                        );

                    const movementY =
                        Math.abs(
                            event.clientY -
                            pointerStartY
                        );

                    /*
                    * Si el usuario mueve el dedo,
                    * probablemente está desplazando la página.
                    */
                    if (
                        movementX > 10 ||
                        movementY > 10
                    ) {

                        clearTimeout(
                            longPressTimer
                        );

                    }

                }
            );

            cell.addEventListener(
                "pointerup",
                (event) => {

                    if (event.button !== 0) {
                        return;
                    }

                    clearTimeout(
                        longPressTimer
                    );

                    /*
                    * Si fue una pulsación larga,
                    * ya se colocó la bandera.
                    * No debemos abrir la casilla.
                    */
                    if (longPressTriggered) {

                        longPressTriggered = false;

                        return;

                    }

                    revealCell(
                        row,
                        column,
                        cell
                    );

                }
            );

            cell.addEventListener(
                "pointercancel",
                () => {

                    clearTimeout(
                        longPressTimer
                    );

                    longPressTriggered = false;

                }
            );

            cell.addEventListener(
                "pointerleave",
                () => {

                    clearTimeout(
                        longPressTimer
                    );

                }
            );

            cell.addEventListener(
                "contextmenu",
                (event) => {

                    event.preventDefault();

                    /*
                    * Clic derecho en computadora.
                    * También admite Ctrl + clic en Mac.
                    */
                    if (
                        event.button === 2 ||
                        event.ctrlKey
                    ) {

                        toggleFlag(
                            row,
                            column,
                            cell
                        );

                    }

                }
            );

            minesweeperBoard.appendChild(
                cell
            );
        }
    }
    placeMines(rows, columns, levelConfig.mines);

    calculateAdjacentMines(rows, columns);

  }

  function placeMines( rows, columns, minesAmount) {

    let placedMines = 0;

    while (placedMines < minesAmount) {

        const randomRow =
        Math.floor(
            Math.random() * rows
        );

        const randomColumn =
        Math.floor(
            Math.random() * columns
        );

        if (
        board[randomRow][randomColumn].mine
        ) {
        continue;
        }

        board[randomRow][randomColumn].mine =
        true;

        placedMines++;

    }

  }

  function moveMine(selectedRow, selectedColumn) {

    const rows =
        board.length;

    const columns =
        board[0].length;

    board[selectedRow][selectedColumn].mine =
        false;

    let mineMoved = false;

    while (!mineMoved) {

        const randomRow =
            Math.floor(
                Math.random() * rows
            );

        const randomColumn =
            Math.floor(
                Math.random() * columns
            );

        if (
            randomRow === selectedRow &&
            randomColumn === selectedColumn
        ) {
            continue;
        }

        if (
            board[randomRow][randomColumn].mine
        ) {
            continue;
        }

        board[randomRow][randomColumn].mine =
            true;

        mineMoved = true;

    }

    calculateAdjacentMines(
        rows,
        columns
    );

  }

  function calculateAdjacentMines(rows,columns) {

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            board[row][column].adjacent = 0;
            if (board[row][column].mine) {
                continue;
            }

            let total = 0;

            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {

                    if (x === 0 && y === 0) {
                        continue;
                    }

                    const newRow =row + y;
                    const newColumn = column + x;

                    if ( newRow < 0 || newRow >= rows || newColumn < 0 || newColumn >= columns) {
                        continue;
                    }

                    if (board[newRow][newColumn].mine) {
                        total++;
                    }

                }

            }

            board[row][column].adjacent =
                total;

        }

    }

  }

  function toggleFlag(row, column, cellElement) {

    if (boardLocked) {
        return;
    }

    const cellData =
        board[row][column];

    /*
     * No se puede colocar una bandera
     * sobre una casilla ya abierta.
     */
    if (cellData.revealed) {
        return;
    }

    cellData.flagged =
        !cellData.flagged;

    if (cellData.flagged) {

        cellElement.classList.add(
            "is-flagged"
        );

        cellElement.innerHTML =
            '<i class="fa-solid fa-flag"></i>';

        return;

    }

    cellElement.classList.remove(
        "is-flagged"
    );

    cellElement.innerHTML = "";

  }

  function applyNumberColor( cellElement, number) {

    cellElement.classList.remove(
        "number-1",
        "number-2",
        "number-3",
        "number-4",
        "number-5",
        "number-6",
        "number-7",
        "number-8"
    );

    if (
        number >= 1 &&
        number <= 8
    ) {

        cellElement.classList.add(
            `number-${number}`
        );

    }

  }

  function revealCell( row, column, cellElement ) {

    if (boardLocked) {
        return;
    }

    const cellData =
        board[row][column];

    if (
        cellData.revealed ||
        cellData.flagged
    ) {
        return;
    }

    if (firstMove) {

      firstMove = false;

      if (cellData.mine) {

          moveMine(
              row,
              column
          );

      }

    }

    cellData.revealed = true;

    cellElement.classList.add(
        "is-revealed"
    );

    if (cellData.mine) {

        cellElement.classList.add(
          "is-mine"
        );

        cellElement.innerHTML =
          '<i class="fa-solid fa-bomb"></i>';

        lives--;

        updateLives();
        showAllMines();
        restartCurrentLevel();

        return;

    }

    if (cellData.adjacent > 0) {

        cellElement.textContent =
          cellData.adjacent;

        cellElement.dataset.number =
          cellData.adjacent;

        applyNumberColor(
            cellElement,
            cellData.adjacent
        );

        checkLevelCompleted();

        return;

    }

    revealAdjacentCells(row, column);
    checkLevelCompleted();

  }

  function revealAdjacentCells(row,column) {

    const rows =
        board.length;

    const columns =
        board[0].length;

    for (let y = -1; y <= 1; y++) {

        for (let x = -1; x <= 1; x++) {

            if (x === 0 && y === 0) {
                continue;
            }

            const newRow =
                row + y;

            const newColumn =
                column + x;

            if (newRow < 0 || newRow >= rows || newColumn < 0 || newColumn >= columns) {
                continue;
            }

            const neighbor =
                board[newRow][newColumn];

            if (neighbor.revealed || neighbor.mine) {
                continue;
            }

            const neighborElement =
                minesweeperBoard.querySelector(
                `[data-row="${newRow}"][data-column="${newColumn}"]`
                );

            if (!neighborElement) {
                continue;
            }

            revealCell(
                newRow,
                newColumn,
                neighborElement
            );

        }

    }

  }

  function restartGame() {

    clearInterval(timerInterval);

    timerInterval = null;

    backgroundMusic.pause();

    backgroundMusic.currentTime = 0;

    gameSeconds = 0;

    currentLevel = 1;

    lives = 5;

    boardLocked = true;

    board = [];

    updateGameTime();

    updateLevel();

    updateLives();

    minesweeperBoard.innerHTML = "";

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