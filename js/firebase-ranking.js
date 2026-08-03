import {
  firestoreDatabase,
  getCurrentPlayer
} from "./firebase-notifications.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/**
 * Comprueba el resultado antes de guardarlo.
 *
 * Devuelve:
 * - si es un nuevo récord personal;
 * - si entra al Top 10;
 * - si el jugador ya tiene nombre;
 * - la posición aproximada que conseguiría.
 */
export async function checkScoreResult(
  gameId,
  score
) {

  const user =
    await getCurrentPlayer();

  const playerReference =
    doc(
      firestoreDatabase,
      "players",
      user.uid
    );

  const playerSnapshot =
    await getDoc(
      playerReference
    );

  const playerData =
    playerSnapshot.exists()
      ? playerSnapshot.data()
      : {};

  const playerName =
    typeof playerData.nombre === "string"
      ? playerData.nombre.trim()
      : "";

  const scoreId =
    `${gameId}_${user.uid}`;

  const scoreReference =
    doc(
      firestoreDatabase,
      "scores",
      scoreId
    );

  const scoreSnapshot =
    await getDoc(
      scoreReference
    );

  const previousScore =
    scoreSnapshot.exists()
      ? Number(
          scoreSnapshot.data().score
        )
      : null;

  const newPersonalRecord =
    previousScore === null ||
    score > previousScore;

  /*
   * Si no supera su propio récord,
   * tampoco necesitamos comprobar el Top 10.
   */
  if (!newPersonalRecord) {

    return {
      user,
      playerName,
      hasName: playerName !== "",
      previousScore,
      newPersonalRecord: false,
      qualifiesTop10: false,
      position: null
    };

  }

  const scoresReference =
    collection(
      firestoreDatabase,
      "scores"
    );

  const topScoresQuery =
    query(
      scoresReference,
      where(
        "juego",
        "==",
        gameId
      ),
      orderBy(
        "score",
        "desc"
      ),
      limit(10)
    );

  const topScoresSnapshot =
    await getDocs(
      topScoresQuery
    );

  const topScores =
    topScoresSnapshot.docs
      .filter(
        (documentSnapshot) =>
          documentSnapshot.id !== scoreId
      )
      .map(
        (documentSnapshot) =>
          Number(
            documentSnapshot.data().score
          )
      );

  const higherScores =
    topScores.filter(
      (topScore) =>
        topScore > score
    ).length;

  const position =
    higherScores + 1;

  const qualifiesTop10 =
    topScores.length < 10 ||
    position <= 10;

  return {
    user,
    playerName,
    hasName: playerName !== "",
    previousScore,
    newPersonalRecord: true,
    qualifiesTop10,
    position
  };

}

/**
 * Guarda el nuevo récord personal.
 *
 * Si se proporciona un nombre, también actualiza
 * el perfil del jugador.
 */
export async function saveBestScore(
  gameId,
  score,
  playerName = ""
) {

  const user =
    await getCurrentPlayer();

  const cleanName =
    playerName.trim();

  const playerReference =
    doc(
      firestoreDatabase,
      "players",
      user.uid
    );

  if (cleanName !== "") {

    await setDoc(
      playerReference,
      {
        nombre: cleanName
      },
      {
        merge: true
      }
    );

  }

  const scoreId =
    `${gameId}_${user.uid}`;

  const scoreReference =
    doc(
      firestoreDatabase,
      "scores",
      scoreId
    );

  await setDoc(
    scoreReference,
    {
      playerId: user.uid,
      juego: gameId,
      score,
      nombre: cleanName,
      actualizadoEn:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  return {
    saved: true,
    score,
    playerName: cleanName
  };

}

export async function getTopScores(
  gameId,
  maxResults = 10
) {

  const scoresReference =
    collection(
      firestoreDatabase,
      "scores"
    );

  const topScoresQuery =
    query(
      scoresReference,
      where(
        "juego",
        "==",
        gameId
      ),
      orderBy(
        "score",
        "desc"
      ),
      limit(
        maxResults
      )
    );

  const topScoresSnapshot =
    await getDocs(
      topScoresQuery
    );

  return topScoresSnapshot.docs.map(
    (documentSnapshot, index) => {

      const data =
        documentSnapshot.data();

      return {
        position: index + 1,
        playerId: data.playerId,
        name:
          data.nombre?.trim() ||
          "Jugador anónimo",
        score:
          Number(data.score) || 0
      };

    }
  );

}



/**
 MEMORIA FOLKLORICA
 */

export async function checkMemoryResult(gameId, attempts, time){

  const user =
    await getCurrentPlayer();

  const playerReference =
    doc(
      firestoreDatabase,
      "players",
      user.uid
    );

  const playerSnapshot =
    await getDoc(
      playerReference
    );

  const playerData =
    playerSnapshot.exists()
      ? playerSnapshot.data()
      : {};

  const playerName =
    typeof playerData.nombre === "string"
      ? playerData.nombre.trim()
      : "";

  const scoreId =
    `${gameId}_${user.uid}`;

  const scoreReference =
    doc(
      firestoreDatabase,
      "scores",
      scoreId
    );

  const scoreSnapshot =
    await getDoc(
      scoreReference
    );

  const previousData =
    scoreSnapshot.exists()
      ? scoreSnapshot.data()
      : null;

  const previousAttempts =
    previousData
      ? Number(previousData.attempts)
      : null;

  const previousTime =
    previousData
      ? Number(previousData.time)
      : null;

  const newPersonalRecord =
    previousData === null ||
    attempts < previousAttempts ||
    (
      attempts === previousAttempts &&
      time < previousTime
    );

  if (!newPersonalRecord) {

    return {
      user,
      playerName,
      hasName: playerName !== "",
      previousAttempts,
      previousTime,
      newPersonalRecord: false,
      qualifiesTop10: false,
      position: null
    };

  }

  const scoresReference =
    collection(
      firestoreDatabase,
      "scores"
    );

  const topScoresQuery =
    query(
      scoresReference,
      where(
        "juego",
        "==",
        gameId
      ),
      orderBy(
        "attempts",
        "asc"
      ),
      orderBy(
        "time",
        "asc"
      ),
      limit(10)
    );

  const topScoresSnapshot =
    await getDocs(
      topScoresQuery
    );

  const otherResults =
    topScoresSnapshot.docs
      .filter(
        (documentSnapshot) =>
          documentSnapshot.id !== scoreId
      )
      .map(
        (documentSnapshot) =>
          documentSnapshot.data()
      );

  const betterResults =
    otherResults.filter(
      (result) => {

        const resultAttempts =
          Number(result.attempts);

        const resultTime =
          Number(result.time);

        return (
          resultAttempts < attempts ||
          (
            resultAttempts === attempts &&
            resultTime < time
          )
        );

      }
    ).length;

  const position =
    betterResults + 1;

  const qualifiesTop10 =
    otherResults.length < 10 ||
    position <= 10;

  return {
    user,
    playerName,
    hasName: playerName !== "",
    previousAttempts,
    previousTime,
    newPersonalRecord: true,
    qualifiesTop10,
    position
  };

}

export async function saveBestMemoryResult(gameId, attempts, time, playerName = "") {

  const user =
    await getCurrentPlayer();

  const cleanName =
    playerName.trim();

  const playerReference =
    doc(
      firestoreDatabase,
      "players",
      user.uid
    );

  if (cleanName !== "") {

    await setDoc(
      playerReference,
      {
        nombre: cleanName
      },
      {
        merge: true
      }
    );

  }

  const scoreId =
    `${gameId}_${user.uid}`;

  const scoreReference =
    doc(
      firestoreDatabase,
      "scores",
      scoreId
    );

  await setDoc(
    scoreReference,
    {
      playerId: user.uid,
      juego: gameId,
      attempts,
      time,
      nombre: cleanName,
      actualizadoEn:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  return {
    saved: true,
    attempts,
    time,
    playerName: cleanName
  };

}

export async function getMemoryRanking(gameId, maxResults = 10) {

  const scoresReference =
    collection(
      firestoreDatabase,
      "scores"
    );

  const rankingQuery =
    query(
      scoresReference,
      where(
        "juego",
        "==",
        gameId
      ),
      orderBy(
        "attempts",
        "asc"
      ),
      orderBy(
        "time",
        "asc"
      ),
      limit(
        maxResults
      )
    );

  const rankingSnapshot =
    await getDocs(
      rankingQuery
    );

  return rankingSnapshot.docs.map(
    (documentSnapshot, index) => {

      const data =
        documentSnapshot.data();

      return {
        position: index + 1,
        playerId: data.playerId,
        name:
          data.nombre?.trim() ||
          "Jugador anónimo",
        attempts:
          Number(data.attempts) || 0,
        time:
          Number(data.time) || 0
      };

    }
  );

}

/**
 Buscaminas
 */


export async function checkMinesweeperResult(
  gameId,
  time,
  lives
) {

  const user =
    await getCurrentPlayer();

  const playerReference =
    doc(
      firestoreDatabase,
      "players",
      user.uid
    );

  const playerSnapshot =
    await getDoc(
      playerReference
    );

  const playerData =
    playerSnapshot.exists()
      ? playerSnapshot.data()
      : {};

  const playerName =
    typeof playerData.nombre === "string"
      ? playerData.nombre.trim()
      : "";

  const scoreId =
    `${gameId}_${user.uid}`;

  const scoreReference =
    doc(
      firestoreDatabase,
      "scores",
      scoreId
    );

  const scoreSnapshot =
    await getDoc(
      scoreReference
    );

  const previousData =
    scoreSnapshot.exists()
      ? scoreSnapshot.data()
      : null;

  const previousTime =
    previousData
      ? Number(previousData.time)
      : null;

  const previousLives =
    previousData
      ? Number(previousData.lives)
      : null;

  const newPersonalRecord =
    previousData === null ||
    time < previousTime ||
    (
      time === previousTime &&
      lives > previousLives
    );

  if (!newPersonalRecord) {

    return {
      user,
      playerName,
      hasName:
        playerName !== "",
      previousTime,
      previousLives,
      newPersonalRecord: false,
      qualifiesTop10: false,
      position: null
    };

  }

  const scoresReference =
    collection(
      firestoreDatabase,
      "scores"
    );

  const rankingQuery =
    query(
      scoresReference,
      where(
        "juego",
        "==",
        gameId
      ),
      orderBy(
        "time",
        "asc"
      ),
      orderBy(
        "lives",
        "desc"
      ),
      limit(10)
    );

  const rankingSnapshot =
    await getDocs(
      rankingQuery
    );

  const otherResults =
    rankingSnapshot.docs
      .filter(
        (documentSnapshot) =>
          documentSnapshot.id !== scoreId
      )
      .map(
        (documentSnapshot) =>
          documentSnapshot.data()
      );

  const betterResults =
    otherResults.filter(
      (result) => {

        const resultTime =
          Number(result.time);

        const resultLives =
          Number(result.lives);

        return (
          resultTime < time ||
          (
            resultTime === time &&
            resultLives > lives
          )
        );

      }
    ).length;

  const position =
    betterResults + 1;

  const qualifiesTop10 =
    otherResults.length < 10 ||
    position <= 10;

  return {
    user,
    playerName,
    hasName:
      playerName !== "",
    previousTime,
    previousLives,
    newPersonalRecord: true,
    qualifiesTop10,
    position
  };

}

export async function saveBestMinesweeperResult(
  gameId,
  time,
  lives,
  playerName = ""
) {

  const user =
    await getCurrentPlayer();

  const cleanName =
    playerName.trim();

  const playerReference =
    doc(
      firestoreDatabase,
      "players",
      user.uid
    );

  if (cleanName !== "") {

    await setDoc(
      playerReference,
      {
        nombre: cleanName
      },
      {
        merge: true
      }
    );

  }

  const scoreId =
    `${gameId}_${user.uid}`;

  const scoreReference =
    doc(
      firestoreDatabase,
      "scores",
      scoreId
    );

  await setDoc(
    scoreReference,
    {
      playerId: user.uid,
      juego: gameId,
      time,
      lives,
      nombre: cleanName,
      actualizadoEn:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  return {
    saved: true,
    time,
    lives,
    playerName: cleanName
  };

}

export async function getMinesweeperRanking(
  gameId,
  maxResults = 10
) {

  const scoresReference =
    collection(
      firestoreDatabase,
      "scores"
    );

  const rankingQuery =
    query(
      scoresReference,
      where(
        "juego",
        "==",
        gameId
      ),
      orderBy(
        "time",
        "asc"
      ),
      orderBy(
        "lives",
        "desc"
      ),
      limit(
        maxResults
      )
    );

  const rankingSnapshot =
    await getDocs(
      rankingQuery
    );

  return rankingSnapshot.docs.map(
    (documentSnapshot, index) => {

      const data =
        documentSnapshot.data();

      return {
        position:
          index + 1,

        playerId:
          data.playerId,

        name:
          data.nombre?.trim() ||
          "Jugador anónimo",

        time:
          Number(data.time) || 0,

        lives:
          Number(data.lives) || 0
      };

    }
  );

}