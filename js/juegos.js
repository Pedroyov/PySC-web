document.addEventListener("DOMContentLoaded", () => {
  const secretRoomUnlocked =
    localStorage.getItem(
      "secretRoomUnlocked"
    ) === "true";

  if (!secretRoomUnlocked) {
    window.location.replace("index.html");
    return;
  }

  const footerSecretGame =
      document.getElementById(
          "footerSecretGame"
      );

  if (
      footerSecretGame &&
      localStorage.getItem(
          "secretRoomUnlocked"
      ) === "true"
  ) {
      footerSecretGame.classList.add(
          "visible"
      );
  }
  const header = document.querySelector(".header");

  function scrollToHero() {
    const offset = header ? header.offsetHeight : 0;

    window.scrollTo({
      top: offset,
      behavior: "instant"
    });
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  scrollToHero();
  const body = document.body;

  const secretIntro =
    document.getElementById("secretIntro");

  const secretIntroContent =
    document.getElementById("secretIntroContent");

  const secretIntroText =
    document.getElementById("secretIntroText");

  const secretDoorStage =
    document.getElementById("secretDoorStage");

  const secretDoorButton =
    document.getElementById("secretDoorButton");

  const secretTransitionLight =
    document.getElementById("secretTransitionLight");

  const secretSkipButton =
    document.getElementById("secretSkipButton");

  const secretToast =
    document.getElementById("secretToast");

  const secretToastTitle =
    document.getElementById("secretToastTitle");

  const secretToastText =
    document.getElementById("secretToastText");

  const comingButtons =
    document.querySelectorAll(".secret-coming-button");

  const secondGameCard =
    document.querySelector(
      ".secret-games-grid .secret-game-card:nth-child(2)"
    );

  const secondGameUnlocked =
    localStorage.getItem(
      "secondGameUnlocked"
    ) === "true";

  if (
    secondGameUnlocked &&
    secondGameCard
  ) {

    secondGameCard.classList.remove(
      "secret-game-locked"
    );

    const status =
      secondGameCard.querySelector(
        ".secret-game-status"
      );

    if (status) {

      status.textContent =
        "En desarrollo";

      status.classList.remove(
        "secret-status-locked"
      );

      status.classList.add(
        "secret-status-development"
      );

    }

    const button =
      secondGameCard.querySelector(
        ".secret-game-button"
      );

    if (button) {

      button.disabled = false;

      button.classList.remove(
        "secret-locked-button"
      );

      button.innerHTML = `
        En desarrollo
        <i class="fa-solid fa-hammer"></i>
      `;

    }
    enableCardEffect(secondGameCard);

  }

  /*
   * Para volver a ver la introducción durante las pruebas:
   *
   * localStorage.removeItem("pyscSecretIntroViewed");
   
  */
  const introWasViewed =
    localStorage.getItem("pyscSecretIntroViewed") === "true";

  /*const introWasViewed = false;*/

  let introTimeout = null;
  let toastTimeout = null;
  let doorIsOpening = false;

  /*
   * Las frases se organizan en grupos para que la
   * conversación siempre tenga sentido.
   */

  const openingPhrases = [
    "👀 Mmm... ¿cómo llegaste hasta aquí?",
    "🤨 Un momento... tú no deberías estar viendo esto.",
    "🕵️ Alguien estuvo revisando hasta el último rincón.",
    "😮 Vaya... parece que tenemos una visita inesperada.",
    "👋 Hola... suponemos que te perdiste."
  ];

  const middlePhrases = [
    "Esta página no estaba en el menú.",
    "¿Seguro que no eres detective?",
    "La curiosidad te trajo bastante lejos.",
    "Tranquilo... no le diremos a nadie.",
    "Definitivamente hiciste clic donde no debías.",
    "Esperamos que no hayas venido a auditar la página."
  ];

  const groupPhrases = [
    "Si llegaste hasta aquí, ya puedes ayudar a cargar las sillas.",
    "Encontrar secretos es fácil. Desmontar el escenario es otra cosa.",
    "No le cuentes a Omar... todavía.",
    "Premio desbloqueado: ayudar después del próximo evento.",
    "Ya conociste nuestras danzas... ahora conoce nuestro lado gamer.",
    "Esto cuenta como ensayo adicional. No aceptamos reclamos."
  ];

  const finalPhrases = [
    "Bueno... ya que llegaste hasta aquí.",
    "Está bien. Te has ganado la entrada.",
    "No podemos seguir fingiendo que no te vimos.",
    "En fin... el secreto ya dejó de ser tan secreto.",
    "De acuerdo, detective. Puedes continuar."
  ];

  function getRandomItem(items) {
    const randomIndex =
      Math.floor(Math.random() * items.length);

    return items[randomIndex];
  }

  function createPhraseSequence() {
    return [
      getRandomItem(openingPhrases),
      getRandomItem(middlePhrases),
      getRandomItem(groupPhrases),
      getRandomItem(finalPhrases)
    ];
  }

  function wait(milliseconds) {
    return new Promise((resolve) => {
      introTimeout = window.setTimeout(
        resolve,
        milliseconds
      );
    });
  }

  async function displayPhrase(text) {
    if (!secretIntroText) {
      return;
    }

    secretIntroText.classList.remove("is-visible");

    await wait(350);

    secretIntroText.textContent = text;
    secretIntroText.classList.add("is-visible");

    await wait(1900);

    secretIntroText.classList.remove("is-visible");

    await wait(450);
  }

  async function startSecretIntro() {
    if (
      !secretIntro ||
      !secretIntroContent ||
      !secretDoorStage
    ) {
      return;
    }

    body.classList.add("secret-intro-active");

    const phrases = createPhraseSequence();

    await wait(1300);

    for (const phrase of phrases) {
      if (
        secretIntro.classList.contains("is-hidden")
      ) {
        return;
      }

      await displayPhrase(phrase);
    }

    secretIntroContent.classList.add("is-hidden");

    await wait(700);

    secretDoorStage.classList.add("is-visible");
  }

  function finishSecretIntro(saveProgress = true) {
    window.clearTimeout(introTimeout);

    if (saveProgress) {
      localStorage.setItem(
        "pyscSecretIntroViewed",
        "true"
      );
    }

    scrollToHero();

    secretIntro?.classList.add("is-hidden");

    body.classList.remove("secret-intro-active");

    window.setTimeout(() => {
      if (secretIntro) {
        secretIntro.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }, 850);
  }

  function openSecretDoor() {
    if (doorIsOpening || !secretDoorButton) {
      return;
    }

    doorIsOpening = true;

    secretDoorButton.classList.add("is-opening");

    /*
     * El destello aparece cuando las hojas
     * ya empezaron a abrirse.
     */

    window.setTimeout(() => {
      secretTransitionLight?.classList.add(
        "is-visible"
      );
    }, 650);

    window.setTimeout(() => {
      finishSecretIntro(true);
    }, 1700);
  }

  function showComingSoonMessage(gameName) {
    if (
      !secretToast ||
      !secretToastTitle ||
      !secretToastText
    ) {
      return;
    }

    window.clearTimeout(toastTimeout);

    secretToastTitle.textContent =
      gameName;

    secretToastText.textContent =
      "Todavía estamos construyendo este desafío. Regresa pronto.";

    secretToast.classList.add("is-visible");

    toastTimeout = window.setTimeout(() => {
      secretToast.classList.remove("is-visible");
    }, 3500);
  }

  /*
   * Primera visita:
   * se reproduce la introducción.
   *
   * Visitas posteriores:
   * se entra directamente.
   */

  if (introWasViewed) {
    secretIntro?.classList.add("is-hidden");

    secretIntro?.setAttribute(
      "aria-hidden",
      "true"
    );
  } else {
    startSecretIntro();
  }

  secretDoorButton?.addEventListener(
    "click",
    openSecretDoor
  );

  secretSkipButton?.addEventListener(
    "click",
    () => {
      finishSecretIntro(true);
    }
  );

  comingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const gameName =
        button.dataset.gameName ||
        "Juego en construcción";

      showComingSoonMessage(gameName);
    });
  });
});

function revealCards() {

    const cards =
        document.querySelectorAll(".secret-game-card");

    cards.forEach((card, index) => {

        setTimeout(() => {

            card.classList.add("show");

        }, index * 180);

    });

}

const gamesSection =
    document.querySelector(".secret-games-grid");

if (gamesSection) {

    const observer =
        new IntersectionObserver((entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    revealCards();

                    observer.disconnect();

                }

            });

        }, {

            threshold: 0.05,
            rootMargin: "0px 0px -50px 0px"

        });

    if (window.innerWidth <= 768) {

        revealCards();

    } else {

        observer.observe(gamesSection);

    }

}

function enableCardEffect(card) {

    card.addEventListener("mousemove", (event) => {

        if (window.innerWidth <= 768) {
            return;
        }

        const rect =
            card.getBoundingClientRect();

        const x =
            event.clientX - rect.left;

        const y =
            event.clientY - rect.top;

        const rotateY =
            ((x / rect.width) - 0.5) * 12;

        const rotateX =
            ((0.5 - y / rect.height)) * 12;

        card.style.transform = `
            perspective(900px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateY(-10px)
        `;

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "";

    });

}

const gameCards =
    document.querySelectorAll(
        ".secret-game-card"
    );

gameCards.forEach((card) => {

    if (
        card.classList.contains(
            "secret-game-locked"
        )
    ) {
        return;
    }

    enableCardEffect(card);

});