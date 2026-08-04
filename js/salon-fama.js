import {
  firestoreDatabase
} from "./firebase-notifications.js";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const RANKINGS = {

  "amor-primera-danza": {
    field1: "score",
    direction1: "desc"
  },

  "memoria-folklorica": {
    field1: "attempts",
    direction1: "asc",
    field2: "time",
    direction2: "asc"
  },

  "buscaminas": {
    field1: "time",
    direction1: "asc",
    field2: "lives",
    direction2: "desc"
  },

  "rompecabezas": {
    field1: "time",
    direction1: "asc",
    field2: "moves",
    direction2: "asc",
    field3: "lives",
    direction3: "desc"
  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const tabs =
      document.querySelectorAll(
        ".hall-of-fame-tab"
      );

    const loading =
      document.getElementById(
        "hallOfFameLoading"
      );

    const list =
      document.getElementById(
        "hallOfFameList"
      );

    const empty =
      document.getElementById(
        "hallOfFameEmpty"
      );

    const error =
      document.getElementById(
        "hallOfFameError"
      );


    async function loadRanking(
      gameId
    ) {

      loading.hidden = false;

      empty.hidden = true;

      error.hidden = true;

      list.innerHTML = "";

      const ranking =
        RANKINGS[gameId];

      if (!ranking) {

        loading.hidden = true;

        return;

      }

      const constraints = [

        where(
          "juego",
          "==",
          gameId
        )

      ];

      for (
        let index = 1;
        ;
        index++
      ) {

        const field =
          ranking[`field${index}`];

        if (!field) {
          break;
        }

        constraints.push(

          orderBy(
            field,
            ranking[`direction${index}`]
          )

        );

      }

      constraints.push(
        limit(10)
      );


      try {

        const snapshot =
          await getDocs(

            query(

              collection(
                firestoreDatabase,
                "scores"
              ),

              ...constraints

            )

          );

        loading.hidden = true;

        if (snapshot.empty) {

          empty.hidden = false;

          return;

        }

        snapshot.docs.forEach(
          (
            documentSnapshot,
            index
          ) => {

            const data =
              documentSnapshot.data();

            const item =
              document.createElement(
                "li"
              );

            item.className =
              "hall-of-fame-item";

            let medal =
              `${index + 1}`;

            if (index === 0) {
              medal = "🥇";
            }

            if (index === 1) {
              medal = "🥈";
            }

            if (index === 2) {
              medal = "🥉";
            }

            let scoreText = "";

            switch (gameId) {

              case "amor-primera-danza":

                scoreText =
                  `${data.score} pts`;

                break;

              case "memoria-folklorica":

                scoreText =
                  `${data.attempts} intentos · ${formatTime(data.time)}`;

                break;

              case "buscaminas":

                scoreText =
                  `${formatTime(data.time)} · ${data.lives} ${data.lives === 1
                    ? "vida"
                    : "vidas"
                  }`;

                break;

              case "rompecabezas":

                scoreText =
                  `${formatTime(data.time)} · ${data.moves} movimientos · ${data.lives} ${data.lives === 1
                    ? "vida"
                    : "vidas"
                  }`;

                break;

            }

            item.innerHTML = `
                <span class="hall-position">
                    ${medal}
                </span>

                <span class="hall-player">
                    ${data.nombre ||
              "Jugador anónimo"
              }
                </span>

                <strong class="hall-score">
                    ${scoreText}
                </strong>
                `;

            list.appendChild(
              item
            );

          }
        );

      } catch (exception) {

        loading.hidden = true;

        error.hidden = false;

        console.error(
          exception
        );

      }

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


    loadRanking(
      "amor-primera-danza"
    );

    tabs.forEach((tab) => {

      tab.addEventListener(
        "click",
        () => {

          tabs.forEach((button) => {

            button.classList.remove(
              "is-active"
            );

            button.setAttribute(
              "aria-selected",
              "false"
            );

          });

          tab.classList.add(
            "is-active"
          );

          tab.setAttribute(
            "aria-selected",
            "true"
          );

          loadRanking(
            tab.dataset.rankingGame
          );

        }
      );

    });

  }
);