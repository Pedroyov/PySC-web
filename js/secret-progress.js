const SECRET_PROGRESS_KEY =
  "pyscSecretProgress";

const TOTAL_SECRET_KEYS = 5;

function getSecretProgress() {
  const savedProgress =
    localStorage.getItem(
      SECRET_PROGRESS_KEY
    );

  if (!savedProgress) {
    return {};
  }

  try {
    return JSON.parse(savedProgress);
  } catch (error) {
    return {};
  }
}

function saveSecretProgress(progress) {
  localStorage.setItem(
    SECRET_PROGRESS_KEY,
    JSON.stringify(progress)
  );
}

function getFoundSecretKeysCount() {
  const progress =
    getSecretProgress();

  return Object.values(progress)
    .filter(Boolean)
    .length;
}

function findSecretKey(keyId) {
  const progress =
    getSecretProgress();

  progress[keyId] = true;

  saveSecretProgress(progress);

  if (
    getFoundSecretKeysCount() >=
    TOTAL_SECRET_KEYS
  ) {
    localStorage.setItem(
      "secretRoomUnlocked",
      "true"
    );
  }
}

function hasSecretKey(keyId) {
  const progress =
    getSecretProgress();

  return progress[keyId] === true;
}

function resetSecretProgress() {
  localStorage.removeItem(
    SECRET_PROGRESS_KEY
  );

  localStorage.removeItem(
    "secretRoomUnlocked"
  );
}

let secretToastTimeout = null;

function showSecretKeyToast(foundKeys) {
  const toast =
    document.getElementById(
      "secretKeyToast"
    );

  const toastTitle =
    document.getElementById(
      "secretKeyToastTitle"
    );

  const toastText =
    document.getElementById(
      "secretKeyToastText"
    );

  if (
    !toast ||
    !toastTitle ||
    !toastText
  ) {
    return;
  }

  const messages = {
    1: {
      title: "Llave encontrada",
      text:
        "Has descubierto una antigua llave dorada."
    },

    2: {
      title: "Otra llave",
      text:
        "Parece que forman parte de una colección."
    },

    3: {
      title: "Vas por buen camino",
      text:
        "Ya reuniste 3 de las 5 llaves."
    },

    4: {
      title: "Solo falta una",
      text:
        "Estás muy cerca de descubrir el secreto."
    },

    5: {
      title: "¡Las encontraste todas!",
      text:
        "El Rincón Secreto ha sido desbloqueado."
    }
  };

  const message =
    messages[foundKeys];

  if (!message) {
    return;
  }

  window.clearTimeout(
    secretToastTimeout
  );

  toastTitle.textContent =
    message.title;

  toastText.textContent =
    message.text;

  toast.classList.add(
    "is-visible"
  );

  secretToastTimeout =
    window.setTimeout(() => {
      toast.classList.remove(
        "is-visible"
      );
    }, 4000);
}

function showSecretUnlockModal() {

  const overlay =
    document.getElementById(
      "secretUnlockOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.add(
    "active"
  );

  requestAnimationFrame(() => {
    createSecretUnlockParticles();
  });

  document.body.style.overflow =
    "hidden";

  const closeButton =
    document.getElementById(
      "secretUnlockClose"
    );

  closeButton?.addEventListener(
    "click",
    () => {

      overlay.classList.remove(
        "active"
      );

      document.body.style.overflow =
        "";

    },
    { once: true }
  );

}

function createSecretUnlockParticles() {
  const container =
    document.getElementById(
      "secretUnlockParticles"
    );

  const icon =
    document.querySelector(
      ".secret-unlock-icon"
    );

  if (!container || !icon) {
    return;
  }

  container.innerHTML = "";

  const iconRect =
    icon.getBoundingClientRect();

  const containerRect =
    container.getBoundingClientRect();

  const startX =
    iconRect.left +
    iconRect.width / 2 -
    containerRect.left;

  const startY =
    iconRect.top +
    iconRect.height / 2 -
    containerRect.top;

  const particleCount = 40;

  for (
    let index = 0;
    index < particleCount;
    index++
  ) {
    const particle =
      document.createElement("span");

    particle.className =
      "secret-unlock-particle";

    const angle =
      Math.random() * Math.PI * 2;

    const distance =
      100 + Math.random() * 190;

    const moveX =
      Math.cos(angle) * distance;

    const moveY =
      Math.sin(angle) * distance;

    const size =
      4 + Math.random() * 7;

    particle.style.left =
      `${startX}px`;

    particle.style.top =
      `${startY}px`;

    particle.style.width =
      `${size}px`;

    particle.style.height =
      `${size}px`;

    container.appendChild(
      particle
    );

    const animation =
      particle.animate(
        [
          {
            transform:
              "translate(-50%, -50%) scale(.2)",
            opacity: 0
          },
          {
            offset: 0.15,
            transform:
              "translate(-50%, -50%) scale(1)",
            opacity: 1
          },
          {
            transform:
              `translate(
                calc(-50% + ${moveX}px),
                calc(-50% + ${moveY}px)
              )
              scale(0)`,
            opacity: 0
          }
        ],
        {
          duration:
            800 + Math.random() * 500,

          delay:
            Math.random() * 180,

          easing:
            "cubic-bezier(.17,.67,.32,1)",

          fill: "forwards"
        }
      );

    animation.finished
      .then(() => {
        particle.remove();
      })
      .catch(() => {
        particle.remove();
      });
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateSecretKeyCounter();

    const secretKeys =
      document.querySelectorAll(
        "[data-secret-key]"
      );

    secretKeys.forEach((keyElement) => {
      const keyId =
        keyElement.dataset.secretKey;

      if (hasSecretKey(keyId)) {
        keyElement.remove();
        return;
      }

      keyElement.addEventListener(
        "click",
        () => {
            if (hasSecretKey(keyId)) {
            return;
            }

            /*
            * Evita pulsaciones repetidas mientras
            * comienza la animación.
            */
            keyElement.disabled = true;

            findSecretKey(keyId);

            const foundKeys =
            getFoundSecretKeysCount();

            animateSecretKeyToCounter(
                keyElement,
                () => {

                    updateSecretKeyCounter();

                    if (
                    foundKeys ===
                    TOTAL_SECRET_KEYS
                    ) {

                    showSecretUnlockModal();

                    } else {

                    showSecretKeyToast(
                        foundKeys
                    );

                    }

                }
            );

            keyElement.addEventListener(
            "animationend",
            () => {
                keyElement.remove();
            },
            { once: true }
            );

            keyElement.classList.add(
            "secret-key-found"
            );
        }
      );
    });
  }
);

function updateSecretKeyCounter() {
  const counter =
    document.getElementById(
      "secretKeyCounter"
    );

  const counterText =
    document.getElementById(
      "secretKeyCounterText"
    );

  if (!counter || !counterText) {
    return;
  }

  const foundKeys =
    getFoundSecretKeysCount();

  counterText.textContent =
    `${foundKeys} / ${TOTAL_SECRET_KEYS}`;

  if (foundKeys > 0) {
    counter.classList.add(
      "is-visible"
    );
  } else {
    counter.classList.remove(
      "is-visible"
    );
  }
}

function animateSecretKeyToCounter(
  keyElement,
  onComplete
) {
  const counter =
    document.getElementById(
      "secretKeyCounter"
    );

  if (!counter) {
    onComplete?.();
    return;
  }

  /*
   * La primera vez el contador está oculto.
   * Lo hacemos visible para que la llave
   * tenga un destino visible.
   */
  counter.classList.add("is-visible");

  const startRect =
    keyElement.getBoundingClientRect();

  const endRect =
    counter.getBoundingClientRect();

  const flyingKey =
    keyElement.cloneNode(true);

  flyingKey.removeAttribute(
    "data-secret-key"
  );

  flyingKey.removeAttribute("id");

  flyingKey.classList.remove(
    "secret-key-found"
  );

  flyingKey.classList.add(
    "secret-key-flying"
  );

  flyingKey.style.left =
    `${startRect.left}px`;

  flyingKey.style.top =
    `${startRect.top}px`;

  flyingKey.style.width =
    `${startRect.width}px`;

  flyingKey.style.height =
    `${startRect.height}px`;

  document.body.appendChild(
    flyingKey
  );

  const destinationX =
    endRect.left +
    endRect.width / 2 -
    (
      startRect.left +
      startRect.width / 2
    );

  const destinationY =
    endRect.top +
    endRect.height / 2 -
    (
      startRect.top +
      startRect.height / 2
    );

  const flight =
    flyingKey.animate(
      [
        {
          transform:
            "translate(0, 0) scale(1) rotate(0deg)",
          opacity: 1
        },
        {
          offset: 0.65,
          transform:
            `translate(
              ${destinationX * 0.7}px,
              ${destinationY * 0.7 - 25}px
            )
            scale(0.8)
            rotate(250deg)`,
          opacity: 1
        },
        {
          transform:
            `translate(
              ${destinationX}px,
              ${destinationY}px
            )
            scale(0.35)
            rotate(360deg)`,
          opacity: 0
        }
      ],
      {
        duration: 750,
        easing: "cubic-bezier(.22, .8, .3, 1)",
        fill: "forwards"
      }
    );

  flight.finished
    .then(() => {
      flyingKey.remove();

      counter.classList.remove(
        "is-updating"
      );

      /*
       * Fuerza al navegador a reiniciar
       * correctamente la animación.
       */
      void counter.offsetWidth;

      counter.classList.add(
        "is-updating"
      );

      counter.addEventListener(
        "animationend",
        () => {
          counter.classList.remove(
            "is-updating"
          );
        },
        { once: true }
      );

      onComplete?.();
    })
    .catch(() => {
      flyingKey.remove();
      onComplete?.();
    });
}

