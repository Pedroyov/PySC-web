import {
    checkTriviaResult,
    saveBestTriviaResult,
    getTriviaRanking
} from "./firebase-ranking.js";

const GAME_ID = "ahorcado-cultural";

const TOTAL_WORDS = 15;
const MAX_LIVES = 3;
const MAX_WRONG_PER_WORD = 6;

const WORDS = [

    // =====================================================
    // DANZAS
    // =====================================================

    {
        category: "Danzas",
        word: "MARINERA NORTEÑA",
        hint: "Danza de pareja de la costa norte peruana, caracterizada por el uso del pañuelo y el galanteo."
    },
    {
        category: "Danzas",
        word: "TONDERO",
        hint: "Danza tradicional del norte peruano vinculada especialmente con Piura y Morropón."
    },
    {
        category: "Danzas",
        word: "FESTEJO",
        hint: "Manifestación afroperuana de ritmo alegre y marcada presencia del cajón."
    },
    {
        category: "Danzas",
        word: "HUAYLARSH",
        hint: "Danza del Valle del Mantaro caracterizada por su energía, zapateo y movimientos vigorosos."
    },
    {
        category: "Danzas",
        word: "DIABLADA PUNEÑA",
        hint: "Danza del altiplano peruano protagonizada por personajes con grandes máscaras y trajes vistosos."
    },
    {
        category: "Danzas",
        word: "DANZA DE TIJERAS",
        hint: "Manifestación tradicional en la que dos bailarines compiten acompañados por arpa y violín."
    },
    {
        category: "Danzas",
        word: "HUACONADA",
        hint: "Danza ritual de Mito cuyos personajes utilizan máscaras de madera."
    },
    {
        category: "Danzas",
        word: "WITITI",
        hint: "Danza tradicional del Valle del Colca relacionada con el cortejo y reconocida como patrimonio cultural."
    },
    {
        category: "Danzas",
        word: "QHAPAQ QOLLA",
        hint: "Danza cusqueña relacionada con los comerciantes y peregrinos provenientes del altiplano."
    },
    {
        category: "Danzas",
        word: "QHAPAQ NEGRO",
        hint: "Danza tradicional del Cusco vinculada a festividades religiosas y personajes de ascendencia afroandina."
    },
    {
        category: "Danzas",
        word: "NEGRITOS DE HUANUCO",
        hint: "Danza tradicional de Huánuco vinculada a las celebraciones del Niño Jesús."
    },
    {
        category: "Danzas",
        word: "CONTRADANZA DE HUAMACHUCO",
        hint: "Danza tradicional de La Libertad asociada a las celebraciones de Huamachuco."
    },
    {
        category: "Danzas",
        word: "HUAYLIA DE ANTABAMBA",
        hint: "Manifestación tradicional de Apurímac vinculada a las celebraciones navideñas."
    },
    {
        category: "Danzas",
        word: "CARNAVAL DE CAJAMARCA",
        hint: "Manifestación festiva caracterizada por comparsas, música, juegos y abundante color."
    },
    {
        category: "Danzas",
        word: "CARNAVAL DE CANAS",
        hint: "Manifestación tradicional cusqueña relacionada con las celebraciones del carnaval andino."
    },
    {
        category: "Danzas",
        word: "SANTIAGO DE HUANCAVELICA",
        hint: "Manifestación tradicional relacionada con las celebraciones de Santiago en los Andes."
    },
    {
        category: "Danzas",
        word: "HUAYNO AYACUCHANO",
        hint: "Expresión musical y dancística profundamente vinculada a la tradición cultural de Ayacucho."
    },
    {
        category: "Danzas",
        word: "CARNAVAL AYACUCHANO",
        hint: "Celebración tradicional de Ayacucho con música, comparsas, juegos y danzas."
    },
    {
        category: "Danzas",
        word: "PANDILLA MOYOBAMBINA",
        hint: "Danza tradicional de la Amazonía peruana asociada a las celebraciones de San Juan."
    },
    {
        category: "Danzas",
        word: "SANTIAGO DE HUACRAPUQUIO",
        hint: "Manifestación tradicional del Valle del Mantaro vinculada a las celebraciones de Santiago."
    },

    // =====================================================
    // INSTRUMENTOS
    // =====================================================

    {
        category: "Instrumentos",
        word: "QUENA",
        hint: "Instrumento de viento andino construido tradicionalmente con caña."
    },
    {
        category: "Instrumentos",
        word: "ZAMPOÑA",
        hint: "Instrumento de viento compuesto por varios tubos de diferentes longitudes."
    },
    {
        category: "Instrumentos",
        word: "CHARANGO",
        hint: "Instrumento de cuerdas de pequeño tamaño muy relacionado con la música andina."
    },
    {
        category: "Instrumentos",
        word: "CAJON PERUANO",
        hint: "Instrumento de percusión de madera en el que el músico se sienta para tocar."
    },
    {
        category: "Instrumentos",
        word: "BOMBO ANDINO",
        hint: "Instrumento de percusión de gran tamaño utilizado para marcar el ritmo en diversas danzas."
    },
    {
        category: "Instrumentos",
        word: "ARPA ANDINA",
        hint: "Instrumento de cuerdas utilizado en diferentes tradiciones musicales de los Andes."
    },
    {
        category: "Instrumentos",
        word: "VIOLIN ANDINO",
        hint: "Instrumento de cuerda presente en diversas expresiones musicales tradicionales."
    },
    {
        category: "Instrumentos",
        word: "PUTUTO",
        hint: "Instrumento de viento elaborado tradicionalmente a partir de una gran concha."
    },
    {
        category: "Instrumentos",
        word: "ANTARA",
        hint: "Instrumento de viento andino formado por tubos unidos entre sí."
    },
    {
        category: "Instrumentos",
        word: "TINYA",
        hint: "Pequeño tambor tradicional utilizado en diversas expresiones musicales andinas."
    },

    // =====================================================
    // FOLKLORE
    // =====================================================

    {
        category: "Folklore",
        word: "PATRIMONIO CULTURAL",
        hint: "Conjunto de expresiones, conocimientos y bienes que forman parte de la identidad de una sociedad."
    },
    {
        category: "Folklore",
        word: "IDENTIDAD CULTURAL",
        hint: "Sentido de pertenencia construido a partir de costumbres, tradiciones y expresiones compartidas."
    },
    {
        category: "Folklore",
        word: "TRADICION ORAL",
        hint: "Forma de transmitir conocimientos, historias y costumbres de generación en generación."
    },
    {
        category: "Folklore",
        word: "CULTURA VIVA",
        hint: "Expresión cultural que continúa practicándose y transmitiéndose dentro de una comunidad."
    },
    {
        category: "Folklore",
        word: "COSMOVISION ANDINA",
        hint: "Forma de comprender el mundo basada en principios y creencias propias de los pueblos andinos."
    },
    {
        category: "Folklore",
        word: "RECIPROCIDAD ANDINA",
        hint: "Principio cultural basado en devolver la ayuda o el beneficio recibido."
    },
    {
        category: "Folklore",
        word: "PATRIMONIO INMATERIAL",
        hint: "Incluye conocimientos, expresiones, prácticas y tradiciones transmitidas entre generaciones."
    },
    {
        category: "Folklore",
        word: "TRANSMISION GENERACIONAL",
        hint: "Proceso mediante el cual una tradición pasa de una generación a otra."
    },
    {
        category: "Folklore",
        word: "SABERES ANCESTRALES",
        hint: "Conocimientos tradicionales conservados y transmitidos dentro de las comunidades."
    },
    {
        category: "Folklore",
        word: "DANZA TRADICIONAL",
        hint: "Manifestación corporal vinculada a la historia, costumbres e identidad de una comunidad."
    },

    // =====================================================
    // TRADICIONES Y FESTIVIDADES
    // =====================================================

    {
        category: "Tradiciones",
        word: "FIESTA PATRONAL",
        hint: "Celebración comunitaria dedicada a un santo o imagen religiosa."
    },
    {
        category: "Tradiciones",
        word: "CARNAVAL",
        hint: "Fiesta popular caracterizada por música, comparsas, juegos y expresiones propias de cada región."
    },
    {
        category: "Tradiciones",
        word: "YUNZA",
        hint: "Celebración en la que los participantes bailan alrededor de un árbol adornado hasta derribarlo."
    },
    {
        category: "Tradiciones",
        word: "PACHAMAMA",
        hint: "Figura central de la cosmovisión andina relacionada con la tierra y la fertilidad."
    },
    {
        category: "Tradiciones",
        word: "PAGO A LA TIERRA",
        hint: "Ceremonia tradicional andina realizada como forma de agradecimiento y reciprocidad."
    },
    {
        category: "Tradiciones",
        word: "FIESTA DE SAN JUAN",
        hint: "Una de las celebraciones más importantes de la Amazonía peruana."
    },
    {
        category: "Tradiciones",
        word: "SEÑOR DE LOS MILAGROS",
        hint: "Festividad religiosa de enorme importancia en diversas ciudades del Perú."
    },
    {
        category: "Tradiciones",
        word: "QOYLLUR RITI",
        hint: "Peregrinación andina en la que participan numerosas comparsas y personajes tradicionales."
    },
    {
        category: "Tradiciones",
        word: "VIRGEN DE LA CANDELARIA",
        hint: "Festividad puneña que reúne música, danza, trajes y numerosas agrupaciones."
    },
    {
        category: "Tradiciones",
        word: "FIESTA DE LAS CRUCES",
        hint: "Celebración religiosa y cultural presente en distintas regiones del Perú."
    },

    // =====================================================
    // PERSONAJES
    // =====================================================

    {
        category: "Personajes",
        word: "CAPORAL",
        hint: "Personaje de autoridad representado en diversas danzas del altiplano."
    },
    {
        category: "Personajes",
        word: "DIABLO MAYOR",
        hint: "Personaje que ocupa una posición de liderazgo dentro de determinadas representaciones de diablos."
    },
    {
        category: "Personajes",
        word: "UKUKU",
        hint: "Personaje mítico y festivo presente en importantes celebraciones tradicionales del Cusco."
    },
    {
        category: "Personajes",
        word: "REY MORENO",
        hint: "Personaje presente en determinadas expresiones dancísticas tradicionales del altiplano."
    },
    {
        category: "Personajes",
        word: "CHUNCHOS",
        hint: "Personajes presentes en diferentes danzas y festividades tradicionales del Perú."
    },
    {
        category: "Personajes",
        word: "PABLITO",
        hint: "Nombre con el que también se conoce a determinados personajes de las festividades del Cusco."
    },
    {
        category: "Personajes",
        word: "MAJTA",
        hint: "Palabra de origen quechua utilizada para referirse a un joven o muchacho."
    },

    // =====================================================
    // PIURA
    // =====================================================

    {
        category: "Piura",
        word: "CATACAOS",
        hint: "Distrito piurano conocido por sus tradiciones, artesanía y manifestaciones culturales."
    },
    {
        category: "Piura",
        word: "CUMANANA",
        hint: "Expresión poética y musical tradicional de la costa norte, especialmente vinculada con Piura."
    },
    {
        category: "Piura",
        word: "TONDERO MORROPANO",
        hint: "Expresión tradicional del norte peruano estrechamente vinculada con Morropón."
    },
    {
        category: "Piura",
        word: "SECHURA",
        hint: "Provincia piurana con importantes expresiones culturales y tradicionales."
    },
    {
        category: "Piura",
        word: "MORROPON",
        hint: "Provincia piurana reconocida por su tradición musical y dancística."
    },
    {
        category: "Piura",
        word: "SAN MIGUEL DE PIURA",
        hint: "Ciudad fundada en 1532 y considerada la primera ciudad española fundada en el Perú."
    },
    {
        category: "Piura",
        word: "CUMANANAS PIURANAS",
        hint: "Composiciones populares improvisadas que utilizan versos para expresar sentimientos o situaciones."
    },
    {
        category: "Piura",
        word: "TONDERO PIURANO",
        hint: "Expresión dancística y musical profundamente relacionada con la identidad cultural de Piura."
    },

    // =====================================================
    // VIDA DE BAILARIN
    // =====================================================

    {
        category: "Vida de bailarín",
        word: "ENSAYO GENERAL",
        hint: "Práctica completa en la que se intenta reproducir las condiciones de una presentación."
    },
    {
        category: "Vida de bailarín",
        word: "ULTIMO ENSAYO",
        hint: "Ese ensayo que supuestamente será el último... hasta que aparece otro."
    },
    {
        category: "Vida de bailarín",
        word: "CAMBIO DE VESTUARIO",
        hint: "Carrera contra el tiempo que ocurre detrás del escenario."
    },
    {
        category: "Vida de bailarín",
        word: "PAREJA DE BAILE",
        hint: "Persona con quien compartes pasos, figuras y muchas horas de ensayo."
    },
    {
        category: "Vida de bailarín",
        word: "COREOGRAFIA GRUPAL",
        hint: "Secuencia de movimientos que requiere coordinación entre todos los integrantes."
    },
    {
        category: "Vida de bailarín",
        word: "ENTRADA EN ESCENA",
        hint: "Momento en que los bailarines aparecen frente al público."
    },
    {
        category: "Vida de bailarín",
        word: "SALIDA DE ESCENA",
        hint: "Momento en que los bailarines abandonan el espacio de presentación."
    },
    {
        category: "Vida de bailarín",
        word: "CAMBIO DE PAREJA",
        hint: "Situación que puede obligar a modificar una coreografía aprendida."
    },
    {
        category: "Vida de bailarín",
        word: "FALTA UN INTEGRANTE",
        hint: "Frase capaz de generar cambios de último minuto antes de una presentación."
    },
    {
        category: "Vida de bailarín",
        word: "SE OLVIDO EL PASO",
        hint: "Problema que aparece justo cuando más se necesitaba recordar la coreografía."
    },
    {
        category: "Vida de bailarín",
        word: "ENSAYAR HASTA TARDE",
        hint: "Actividad frecuente cuando se acerca una presentación importante."
    },
    {
        category: "Vida de bailarín",
        word: "BAILAR CON CANSANCIO",
        hint: "Situación habitual después de varias horas de ensayo o competencia."
    },
    {
        category: "Vida de bailarín",
        word: "CALENTAMIENTO ANTES DE BAILAR",
        hint: "Actividad previa a una presentación destinada a preparar el cuerpo."
    },
    {
        category: "Vida de bailarín",
        word: "LLEGAR TARDE AL ENSAYO",
        hint: "Situación que ningún integrante quiere protagonizar, especialmente si ya empezaron."
    },
    {
        category: "Vida de bailarín",
        word: "ENSAYO SIN MUSICA",
        hint: "Práctica en la que los bailarines deben recordar la secuencia sin escuchar la pista."
    },

    // =====================================================
    // AGRUPACIONES Y CONCURSOS
    // =====================================================

    {
        category: "Concursos",
        word: "CONCURSO DE DANZAS",
        hint: "Evento donde diferentes agrupaciones presentan sus propuestas ante un jurado."
    },
    {
        category: "Concursos",
        word: "JURADO CALIFICADOR",
        hint: "Grupo encargado de evaluar las presentaciones según los criterios establecidos."
    },
    {
        category: "Concursos",
        word: "CRITERIOS DE EVALUACION",
        hint: "Aspectos que el jurado utiliza para determinar la puntuación de una presentación."
    },
    {
        category: "Concursos",
        word: "PUESTA EN ESCENA",
        hint: "Conjunto de recursos utilizados para construir una presentación frente al público."
    },
    {
        category: "Concursos",
        word: "CAMPEON DE CAMPEONES",
        hint: "Competencia especial reservada para agrupaciones que han conseguido determinados logros."
    },
    {
        category: "Concursos",
        word: "DANZA EN COMPETENCIA",
        hint: "Presentación preparada específicamente para enfrentarse a otras agrupaciones."
    },
    {
        category: "Concursos",
        word: "PRESENTACION FINAL",
        hint: "Actuación que puede definir el resultado de una competencia."
    },
    {
        category: "Concursos",
        word: "GRUPO REVELACION",
        hint: "Reconocimiento que suele distinguir a una agrupación que destaca especialmente en una edición."
    },
    {
        category: "Concursos",
        word: "MEJOR BARRA",
        hint: "Reconocimiento destinado al grupo de acompañantes que destaca por su apoyo."
    },
    {
        category: "Concursos",
        word: "CAMPEONATO NACIONAL",
        hint: "Competencia en la que participan representantes de diferentes partes del país."
    },

    // =====================================================
    // FRASES LARGAS / NIVEL DIFÍCIL
    // =====================================================

    {
        category: "Difícil",
        word: "TRADICION QUE PASA DE GENERACION EN GENERACION",
        hint: "Costumbre que permanece viva gracias a su transmisión entre generaciones."
    },
    {
        category: "Difícil",
        word: "BAILAR CON EL CORAZON",
        hint: "Frase muy utilizada para describir la entrega emocional de un bailarín."
    },
    {
        category: "Difícil",
        word: "LA DANZA CUENTA UNA HISTORIA",
        hint: "Idea utilizada para explicar que una coreografía puede representar hechos, costumbres o personajes."
    },
    {
        category: "Difícil",
        word: "EL FOLKLORE SE LLEVA EN LA SANGRE",
        hint: "Frase popular utilizada para expresar un fuerte vínculo con las tradiciones."
    },
    {
        category: "Difícil",
        word: "UNA DANZA UNA HISTORIA",
        hint: "Frase que relaciona cada manifestación dancística con su contexto cultural."
    },
    {
        category: "Difícil",
        word: "ORGULLO DE NUESTRAS RAICES",
        hint: "Expresión relacionada con la valoración de la cultura y las tradiciones propias."
    },
    {
        category: "Difícil",
        word: "VIVIR LA DANZA",
        hint: "Expresión utilizada para referirse a experimentar la danza más allá de una simple presentación."
    },
    {
        category: "Difícil",
        word: "PASION POR EL FOLKLORE",
        hint: "Expresión que describe una fuerte dedicación hacia las manifestaciones tradicionales."
    },
    {
        category: "Difícil",
        word: "IDENTIDAD Y TRADICION",
        hint: "Conceptos estrechamente relacionados con la conservación de las expresiones culturales."
    },
    {
        category: "Difícil",
        word: "RAICES DE NUESTRA CULTURA",
        hint: "Expresión utilizada para referirse al origen y legado de las tradiciones."
    },

    // =====================================================
    // MUY DIFÍCIL
    // =====================================================

    {
        category: "Muy difícil",
        word: "PATRIMONIO CULTURAL INMATERIAL",
        hint: "Concepto utilizado para referirse a prácticas, conocimientos y expresiones transmitidas por las comunidades."
    },
    {
        category: "Muy difícil",
        word: "DECLARATORIA DE PATRIMONIO CULTURAL",
        hint: "Reconocimiento oficial que busca poner en valor y proteger una manifestación cultural."
    },
    {
        category: "Muy difícil",
        word: "RECIPROCIDAD Y COMPLEMENTARIEDAD",
        hint: "Principios asociados a la forma tradicional andina de comprender las relaciones entre personas y comunidad."
    },
    {
        category: "Muy difícil",
        word: "TRANSMISION DE SABERES ANCESTRALES",
        hint: "Proceso mediante el cual los conocimientos tradicionales permanecen vivos."
    },
    {
        category: "Muy difícil",
        word: "MANIFESTACION CULTURAL TRADICIONAL",
        hint: "Expresión colectiva vinculada con las costumbres e identidad de una comunidad."
    },
    {
        category: "Muy difícil",
        word: "DANZA COMO EXPRESION DE IDENTIDAD",
        hint: "Concepto que relaciona las manifestaciones dancísticas con la identidad de quienes las practican."
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
        document.getElementById("ahorcadoGameStage");

    const startButton =
        document.getElementById("ahorcadoStartButton");

    const resetButton =
        document.getElementById("ahorcadoResetButton");

    const countdown =
        document.getElementById("loveCountdown");

    const countdownText =
        document.getElementById("loveCountdownText");

    const categoryLabel =
        document.getElementById("ahorcadoCategoryLabel");

    const hintElement =
        document.getElementById("ahorcadoHint");

    const wordElement =
        document.getElementById("ahorcadoWord");

    const keyboardButtons =
        document.querySelectorAll(".hangman-key");

    const feedback =
        document.getElementById("ahorcadoFeedback");

    const roundLabel =
        document.getElementById("ahorcadoRound");

    const scoreElement =
        document.getElementById("ahorcadoScore");

    const livesElement =
        document.getElementById("ahorcadoLives");

    const timeElement =
        document.getElementById("ahorcadoTime");

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
        !categoryLabel ||
        !hintElement ||
        !wordElement ||
        !keyboardButtons.length ||
        !feedback ||
        !roundLabel ||
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
            "No se encontraron todos los elementos necesarios de El Ahorcado."
        );

        throw new Error(
            "Faltan elementos HTML de El Ahorcado."
        );

    }

    let gameStarted = false;
    let gameWords = [];
    let wordIndex = 0;
    let wordsSolvedCount = 0;
    let currentWordData = null;
    let revealedLetters = new Set();
    let wrongLettersThisWord = 0;
    let score = 0;
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

    keyboardButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                handleLetterGuess(
                    button.dataset.letter,
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
        lives = MAX_LIVES;
        totalGameSeconds = 0;
        wordsSolvedCount = 0;
        pendingRankingResult = null;
        passed = false;
        wordIndex = 0;

        gameWords =
            shuffleArray(WORDS).slice(
                0,
                Math.min(TOTAL_WORDS, WORDS.length)
            );

        gameStage.classList.add("is-playing");
        resetButton.classList.add("is-visible");

        scoreElement.textContent = score;
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

        loadWord();

    }

    function loadWord() {

        currentWordData = gameWords[wordIndex];
        revealedLetters = new Set();
        wrongLettersThisWord = 0;

        roundLabel.textContent =
            `${wordIndex + 1} / ${gameWords.length}`;

        categoryLabel.textContent =
            `${currentWordData.category} · Palabra ${wordIndex + 1} de ${gameWords.length}`;

        hintElement.textContent = currentWordData.hint;

        feedback.textContent = "";
        feedback.className = "hangman-feedback";

        keyboardButtons.forEach((button) => {
            button.disabled = false;
            button.classList.remove("is-correct", "is-wrong");
        });

        renderWord();

    }

    function renderWord() {

        wordElement.innerHTML = "";

        const characters = currentWordData.word.split("");

        characters.forEach((character) => {

            if (character === " ") {

                const spacer =
                    document.createElement("span");

                spacer.className = "hangman-space";

                wordElement.appendChild(spacer);

                return;

            }

            const span = document.createElement("span");

            const isRevealed = revealedLetters.has(character);

            span.className = isRevealed
                ? "hangman-letter is-revealed"
                : "hangman-letter";

            span.textContent = isRevealed ? character : "";

            wordElement.appendChild(span);

        });

    }

    function getUniqueLetters(word) {

        return new Set(
            word.split("").filter(
                (character) => character !== " "
            )
        );

    }

    function handleLetterGuess(letter, button) {

        if (!gameStarted || button.disabled) {
            return;
        }

        button.disabled = true;

        const word = currentWordData.word;

        if (word.includes(letter)) {

            revealedLetters.add(letter);

            button.classList.add("is-correct");

            correctSound.currentTime = 0;
            correctSound.play().catch(() => { });

            renderWord();

            const uniqueLetters =
                getUniqueLetters(word);

            const solved = [...uniqueLetters].every(
                (currentLetter) => revealedLetters.has(currentLetter)
            );

            if (solved) {

                wordSolved();

            } else {

                feedback.textContent =
                    "¡Bien! Esa letra está en la palabra.";

                feedback.className =
                    "hangman-feedback is-correct";

            }

        } else {

            wrongLettersThisWord++;

            button.classList.add("is-wrong");

            wrongSound.currentTime = 0;
            wrongSound.play().catch(() => { });

            feedback.textContent =
                "Esa letra no está en la palabra.";

            feedback.className =
                "hangman-feedback is-wrong";

            if (wrongLettersThisWord >= MAX_WRONG_PER_WORD) {
                wordFailed();
            }

        }

    }

    function wordSolved() {

        const points =
            Math.max(40, 100 - wrongLettersThisWord * 10);

        score += points;
        wordsSolvedCount++;

        scoreElement.textContent = score;

        animateScore(points);

        feedback.textContent =
            `¡Palabra completa! +${points} puntos.`;

        feedback.className =
            "hangman-feedback is-correct";

        keyboardButtons.forEach((button) => {
            button.disabled = true;
        });

        setTimeout(() => {
            advanceRound();
        }, 1100);

    }

    function wordFailed() {

        lives--;

        livesElement.textContent =
            lives > 0 ? "❤️".repeat(lives) : "💔";

        revealedLetters =
            new Set(currentWordData.word.split(""));

        renderWord();

        feedback.textContent =
            `Se acabaron los intentos. Era "${currentWordData.word}".`;

        feedback.className =
            "hangman-feedback is-wrong";

        keyboardButtons.forEach((button) => {
            button.disabled = true;
        });

        setTimeout(() => {

            if (lives <= 0) {
                finishGame(false);
            } else {
                advanceRound();
            }

        }, 1600);

    }

    function advanceRound() {

        wordIndex++;

        if (wordIndex >= gameWords.length) {
            finishGame(true);
            return;
        }

        loadWord();

    }

    async function finishGame(didWin) {

        gameStarted = false;
        passed = didWin;

        clearInterval(totalTimerInterval);
        totalTimerInterval = null;

        const finalScore = score;
        const finalTime = totalGameSeconds;
        const finalLives = lives;
        const finalWordsSolved = wordsSolvedCount;
        const finalWordIndex = wordIndex;
        const formattedTime = formatTime(finalTime);

        if (didWin) {

            localStorage.setItem(
                "seventhGameUnlocked",
                "true"
            );

            victorySound.currentTime = 0;
            victorySound.play().catch(() => { });

            resultIcon.innerHTML =
                '<i class="fa-solid fa-trophy"></i>';

            resultLabel.textContent =
                "Desafío superado";

            resultTitle.textContent =
                "¡Adivinaste todo!";

            resultText.textContent =
                `Completaste las ${gameWords.length} palabras en ${formattedTime} y obtuviste ${finalScore} puntos. El Mapa del Folklore te espera.`;

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
                `Llegaste a la palabra ${finalWordIndex + 1} de ${gameWords.length} con ${finalScore} puntos en ${formattedTime}.`;

            resultButtonText.textContent =
                "Intentar nuevamente";

        }

        if (didWin) {

            const rankingOpened =
                await processRankingResult(
                    finalScore,
                    finalWordsSolved,
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
        finalWordsSolved,
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
                correctAnswers: finalWordsSolved,
                time: finalTime,
                lives: finalLives
            };

            const livesText =
                finalLives === 1
                    ? "1 vida"
                    : `${finalLives} vidas`;

            rankingModalScore.textContent =
                `${finalScore} puntos · ` +
                `${finalWordsSolved} palabras · ` +
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
                        : "Has mejorado tu resultado anterior.";

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
            ${player.correctAnswers} palabras ·
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
        wordIndex = 0;
        wordsSolvedCount = 0;
        totalGameSeconds = 0;
        gameWords = [];
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
        livesElement.textContent = "❤️❤️❤️";
        timeElement.textContent = formatTime(0);
        roundLabel.textContent = `1 / ${TOTAL_WORDS}`;

        feedback.textContent = "";
        feedback.className = "hangman-feedback";

        wordElement.innerHTML = "";

        keyboardButtons.forEach((button) => {
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
