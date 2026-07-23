/* =========================
   NAVEGACIÓN PRINCIPAL
========================= */

const header =
  document.getElementById("header");

const menuToggle =
  document.getElementById("menuToggle");

const navLinks =
  document.getElementById("navLinks");

const menuOverlay =
  document.getElementById("menuOverlay");

const scrollProgress =
  document.getElementById("scrollProgress");

const backToTop =
  document.getElementById("backToTop");

function updateHeader() {
  if (!header) {
    return;
  }

  const shouldBeScrolled =
    window.scrollY > 30;

  if (shouldBeScrolled) {
    header.classList.add("scrolled");
  } else if (
    !document.body.classList.contains(
      "placeholder-page"
    )
  ) {
    header.classList.remove("scrolled");
  }
}

function updateScrollProgress() {
  if (!scrollProgress) {
    return;
  }

  const scrollableHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const progress =
    scrollableHeight > 0
      ? (window.scrollY / scrollableHeight) * 100
      : 0;

  scrollProgress.style.width =
    `${Math.min(100, Math.max(0, progress))}%`;
}

function updateBackToTop() {
  if (!backToTop) {
    return;
  }

  backToTop.classList.toggle(
    "visible",
    window.scrollY > 550
  );
}

function updateNavigationOnScroll() {
  updateHeader();
  updateScrollProgress();
  updateBackToTop();
}

window.addEventListener(
  "scroll",
  updateNavigationOnScroll,
  {
    passive: true
  }
);

window.addEventListener(
  "resize",
  updateScrollProgress
);

updateNavigationOnScroll();

/* =========================
   MENÚ MÓVIL
========================= */

function openMobileMenu() {
  if (!menuToggle || !navLinks) {
    return;
  }

  navLinks.classList.add("open");
  menuToggle.classList.add("active");

  menuToggle.setAttribute(
    "aria-expanded",
    "true"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Cerrar menú"
  );

  document.body.classList.add(
    "menu-open"
  );

  if (menuOverlay) {
    menuOverlay.classList.add(
      "visible"
    );

    menuOverlay.setAttribute(
      "aria-hidden",
      "false"
    );
  }
}

function closeMobileMenu() {
  if (!menuToggle || !navLinks) {
    return;
  }

  navLinks.classList.remove("open");
  menuToggle.classList.remove("active");

  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Abrir menú"
  );

  document.body.classList.remove(
    "menu-open"
  );

  if (menuOverlay) {
    menuOverlay.classList.remove(
      "visible"
    );

    menuOverlay.setAttribute(
      "aria-hidden",
      "true"
    );
  }
}

function toggleMobileMenu() {
  if (!navLinks) {
    return;
  }

  if (navLinks.classList.contains("open")) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener(
    "click",
    toggleMobileMenu
  );

  navLinks
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeMobileMenu
      );
    });
}

if (menuOverlay) {
  menuOverlay.addEventListener(
    "click",
    closeMobileMenu
  );
}

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  }
);

window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth > 900) {
      closeMobileMenu();
    }
  }
);

/* =========================
   VOLVER ARRIBA
========================= */

if (backToTop) {
  backToTop.addEventListener(
    "click",
    () => {
      const reduceMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      window.scrollTo({
        top: 0,
        behavior: reduceMotion
          ? "auto"
          : "smooth"
      });
    }
  );
}

const yearsActive = document.getElementById("yearsActive");

if (yearsActive) {
  const foundationDate = new Date(2009, 9, 17);
  const today = new Date();

  let years = today.getFullYear() - foundationDate.getFullYear();

  const anniversaryThisYear = new Date(
    today.getFullYear(),
    foundationDate.getMonth(),
    foundationDate.getDate()
  );

  if (today < anniversaryThisYear) {
    years--;
  }

  yearsActive.textContent = `${years}+`;
}

const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const agendaSheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5frIUl9HsRVOBcBTw6EXj7bKtzhDUgieCfHXh7A7Bn1w7OE83Ld84_M7__7hlNSg6GvtjSrS6G61L/pub?gid=0&single=true&output=csv";

const agendaGrid = document.getElementById("agendaGrid");

const agendaTypes = {
  evento: {
    emoji: "🎭",
    label: "Evento",
    className: "agenda-event"
  },
  aviso: {
    emoji: "⚠️",
    label: "Aviso",
    className: "agenda-notice"
  },
  convocatoria: {
    emoji: "📣",
    label: "Convocatoria",
    className: "agenda-call"
  },
  cumpleanos: {
    emoji: "🎂",
    label: "Cumpleaños",
    className: "agenda-birthday"
  },
  cumpleaños: {
    emoji: "🎂",
    label: "Cumpleaños",
    className: "agenda-birthday"
  },
  taller: {
    emoji: "🩰",
    label: "Taller",
    className: "agenda-workshop"
  },
  viaje: {
    emoji: "✈️",
    label: "Viaje",
    className: "agenda-trip"
  }
};

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index++) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      value += '"';
      index++;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index++;
      }

      row.push(value.trim());

      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  if (value !== "" || row.length > 0) {
    row.push(value.trim());

    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function csvToObjects(csvText) {
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) =>
    header.trim().toLowerCase()
  );

  return rows.slice(1).map((row) => {
    const item = {};

    headers.forEach((header, index) => {
      item[header] = row[index]?.trim() ?? "";
    });

    return item;
  });
}

function escapeHTML(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAgendaType(typeValue = "") {
  const normalizedType = typeValue
    .trim()
    .toLowerCase();

  return (
    agendaTypes[normalizedType] || {
      emoji: "✨",
      label: "Actividad",
      className: "agenda-general"
    }
  );
}

function renderAgenda(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingItems = items
    .filter((item) => {
      return item.visible.trim().toUpperCase() !== "NO";
    })
    .map((item) => ({
      ...item,
      parsedDate: new Date(`${item.fecha}T00:00:00`)
    }))
    .filter((item) => {
      return (
        !Number.isNaN(item.parsedDate.getTime()) &&
        item.parsedDate >= today
      );
    })
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 4);

  if (upcomingItems.length === 0) {
    agendaGrid.innerHTML = `
      <article class="agenda-empty">
        <div class="agenda-empty-icon">✨</div>

        <div>
          <span class="agenda-empty-kicker">
            Muy pronto
          </span>

          <h3>
            Estamos preparando nuevas actividades
          </h3>

          <p>
            Síguenos en nuestras redes sociales para conocer
            nuestras próximas presentaciones, talleres y novedades.
          </p>

          <a
            href="#redes"
            class="agenda-empty-link"
          >
            Ir a nuestras redes →
          </a>
        </div>
      </article>
    `;

    return;
  }

  agendaGrid.innerHTML = upcomingItems
    .map((item, index) => {
      const type = getAgendaType(item.tipo);

      const day = item.parsedDate
        .toLocaleDateString("es-PE", {
          day: "2-digit"
        });

      const month = item.parsedDate
        .toLocaleDateString("es-PE", {
          month: "short"
        })
        .replace(".", "")
        .toUpperCase();

      const year = item.parsedDate.getFullYear();

      const place = item.lugar
        ? `
          <p class="agenda-place">
            <i class="fa-solid fa-location-dot"></i>
            ${escapeHTML(item.lugar)}
          </p>
        `
        : "";

      const link = item.enlace
        ? `
          <a
            href="${escapeHTML(item.enlace)}"
            class="agenda-link"
            ${
              item.enlace.startsWith("http")
                ? 'target="_blank" rel="noopener noreferrer"'
                : ""
            }
          >
            Más información →
          </a>
        `
        : "";

      return `
        <article
          class="agenda-card ${type.className}
          ${index === 0 ? "agenda-card-featured" : ""}"
        >
          <div class="agenda-card-top">
            <div class="agenda-emoji">
              ${type.emoji}
            </div>

            <span class="agenda-badge">
              ${type.label}
            </span>
          </div>

          <div class="agenda-card-body">
            <div class="agenda-date">
              <strong>${day}</strong>

              <div>
                <span>${month}</span>
                <small>${year}</small>
              </div>
            </div>

            <h3>${escapeHTML(item.titulo)}</h3>

            <p class="agenda-description">
              ${escapeHTML(item.descripcion)}
            </p>

            ${place}
            ${link}
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadAgenda() {
  if (!agendaGrid) {
    return;
  }

  try {
    const response = await fetch(agendaSheetUrl, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar la agenda: ${response.status}`
      );
    }

    const csvText = await response.text();
    const items = csvToObjects(csvText);

    renderAgenda(items);
  } catch (error) {
    console.error(error);

    agendaGrid.innerHTML = `
      <article class="agenda-empty">
        <div class="agenda-empty-icon">📅</div>

        <div>
          <span class="agenda-empty-kicker">
            Agenda PySC
          </span>

          <h3>
            No pudimos cargar la agenda en este momento
          </h3>

          <p>
            Puedes conocer nuestras novedades a través
            de nuestras redes sociales.
          </p>
        </div>
      </article>
    `;
  }
}

loadAgenda();

/* =========================
   CUMPLEAÑOS
========================= */

const birthdaysSheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5frIUl9HsRVOBcBTw6EXj7bKtzhDUgieCfHXh7A7Bn1w7OE83Ld84_M7__7hlNSg6GvtjSrS6G61L/pub?gid=1460740281&single=true&output=csv";

const birthdaySection =
  document.getElementById("birthdaySection");

const birthdayPhoto =
  document.getElementById("birthdayPhoto");

const birthdayTitle =
  document.getElementById("birthdayTitle");

const birthdayMessage =
  document.getElementById("birthdayMessage");

const birthdayShare =
  document.getElementById("birthdayShare");

const birthdayShareStatus =
  document.getElementById("birthdayShareStatus");

let currentBirthdayShareData = null;
let currentBirthdayImageData = null;

function normalizeVisibleValue(value = "") {
  return value.trim().toUpperCase();
}

function getTodaysBirthdays(items) {
  const today = new Date();

  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  return items.filter((item) => {
    const isVisible =
      normalizeVisibleValue(item.visible) !== "NO";

    const birthdayDay = Number(item.dia);
    const birthdayMonth = Number(item.mes);

    return (
      isVisible &&
      birthdayDay === currentDay &&
      birthdayMonth === currentMonth
    );
  });
}

function renderSingleBirthday(person) {
  const name =
    person.nombre || "Integrante de PySC";

  const message =
    person.mensaje ||
    "Deseamos que este nuevo año esté lleno de alegría, salud y muchos momentos especiales.";

  birthdayTitle.textContent =
    `¡Feliz cumpleaños, ${name}!`;

  birthdayMessage.textContent =
    message;

  if (person.foto) {
    birthdayPhoto.src = person.foto;
    birthdayPhoto.alt =
      `Felicitación de cumpleaños para ${name}`;

    birthdayPhoto.parentElement.hidden = false;
  } else {
    birthdayPhoto.removeAttribute("src");
    birthdayPhoto.alt = "";
    birthdayPhoto.parentElement.hidden = true;
  }

  currentBirthdayShareData = {
    title: `¡Feliz cumpleaños, ${name}!`,
    text:
      `🎂 ¡Feliz cumpleaños, ${name}! ` +
      `${message} ` +
      "Con cariño, Pasión y Sentimiento Cultural.",
    url: window.location.href
  };

  /*
    Estos datos se usarán después para generar
    la imagen mediante Canvas.
  */
  currentBirthdayImageData = {
    name: name,
    message: message,
    photo: person.foto || ""
  };
}

window.getCurrentBirthdayImageData = function(){
  return currentBirthdayImageData;
};

function renderMultipleBirthdays(people) {
  const names = people
    .map((person) => person.nombre)
    .filter(Boolean);

  birthdayTitle.textContent =
    "¡Hoy celebramos varios cumpleaños!";

  birthdayMessage.textContent =
    `Enviamos un saludo muy especial a ${names.join(", ")}. ` +
    "Deseamos que tengan un día lleno de alegría y momentos inolvidables.";

  const firstPhoto = people.find(
    (person) => person.foto
  );

  if (firstPhoto) {
    birthdayPhoto.src = firstPhoto.foto;
    birthdayPhoto.alt =
      "Felicitación de cumpleaños de integrantes de PySC";

    birthdayPhoto.parentElement.hidden = false;
  } else {
    birthdayPhoto.removeAttribute("src");
    birthdayPhoto.alt = "";
    birthdayPhoto.parentElement.hidden = true;
  }

  currentBirthdayShareData = {
    title: "¡Hoy estamos de fiesta!",
    text:
      `🎉 Hoy celebramos los cumpleaños de ${names.join(", ")}. ` +
      "¡Muchas felicidades de parte de Pasión y Sentimiento Cultural!",
    url: window.location.href
  };
}

function renderTodaysBirthdays(people) {
  if (!birthdaySection || people.length === 0) {
    return;
  }

  if (people.length === 1) {
    renderSingleBirthday(people[0]);
  } else {
    renderMultipleBirthdays(people);
  }

  birthdaySection.hidden = false;

  setTimeout(() => {
    launchBirthdayConfetti();
  }, 500);
}

async function loadBirthdays() {
  if (!birthdaySection) {
    return;
  }

  try {
    const response = await fetch(
      birthdaysSheetUrl,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `No se pudieron cargar los cumpleaños: ${response.status}`
      );
    }

    const csvText = await response.text();
    const birthdays = csvToObjects(csvText);

    const todaysBirthdays =
      getTodaysBirthdays(birthdays);

    renderTodaysBirthdays(todaysBirthdays);
  } catch (error) {
    console.error(error);

    /*
      No mostramos un error visual porque esta sección
      es opcional. Si falla, simplemente permanece oculta.
    */
    birthdaySection.hidden = true;
  }
}

async function shareBirthday() {
  if (!currentBirthdayShareData) {
    return;
  }

  birthdayShareStatus.textContent = "";

  try {
    if (navigator.share) {
      await navigator.share(
        currentBirthdayShareData
      );

      birthdayShareStatus.textContent =
        "Felicitación compartida.";
    } else {
      const shareText =
        `${currentBirthdayShareData.text}\n` +
        `${currentBirthdayShareData.url}`;

      await navigator.clipboard.writeText(
        shareText
      );

      birthdayShareStatus.textContent =
        "Felicitación copiada. Ya puedes compartirla.";
    }
  } catch (error) {
    /*
      AbortError ocurre cuando el usuario cierra
      voluntariamente el menú de compartir.
    */
    if (error.name !== "AbortError") {
      console.error(error);

      birthdayShareStatus.textContent =
        "No se pudo compartir la felicitación.";
    }
  }
}

if (birthdayShare) {
  birthdayShare.addEventListener(
    "click",
    shareBirthday
  );
}

loadBirthdays();

let birthdayConfettiHasRun = false;

function launchBirthdayConfetti() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    return;
  }

  if (
    birthdayConfettiHasRun ||
    typeof confetti !== "function"
  ) {
    return;
  }

  birthdayConfettiHasRun = true;

  const duration = 2800;
  const animationEnd = Date.now() + duration;

  const pyscColors = [
    "#8c1832",
    "#132f5d",
    "#e2aa16",
    "#ef75bb",
    "#ffffff"
  ];

  const interval = setInterval(() => {
    const timeLeft =
      animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 58,
      origin: {
        x: 0,
        y: 0.55
      },
      colors: pyscColors,
      gravity: 0.85,
      scalar: 0.9
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 58,
      origin: {
        x: 1,
        y: 0.55
      },
      colors: pyscColors,
      gravity: 0.85,
      scalar: 0.9
    });
  }, 150);
}


/* =========================
   CONTADOR DE HISTORIA
========================= */

function updateHistoryCounter() {
  const yearsElement =
    document.getElementById("historyYears");

  const monthsElement =
    document.getElementById("historyMonths");

  const daysElement =
    document.getElementById("historyDays");

  if (
    !yearsElement ||
    !monthsElement ||
    !daysElement
  ) {
    return;
  }

  const foundationDate =
    new Date(2009, 9, 17);

  const today = new Date();

  const start =
    new Date(
      foundationDate.getFullYear(),
      foundationDate.getMonth(),
      foundationDate.getDate()
    );

  const current =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  let years =
    current.getFullYear() -
    start.getFullYear();

  let months =
    current.getMonth() -
    start.getMonth();

  let days =
    current.getDate() -
    start.getDate();

  if (days < 0) {
    const previousMonthLastDay =
      new Date(
        current.getFullYear(),
        current.getMonth(),
        0
      ).getDate();

    days += previousMonthLastDay;
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  yearsElement.textContent =
    String(years);

  monthsElement.textContent =
    String(months);

  daysElement.textContent =
    String(days);
}

updateHistoryCounter();

/* =========================
   MAPA CULTURAL INTERACTIVO
========================= */

const cultureCountries = {
  PE: {
    flagImage: "img/peru.png",
    flagAlt: "Bandera de Perú",
    name: "Perú",
    type: "Trayectoria nacional",
    years: "Desde 2009",
    description:
      "Hemos participado en actividades, concursos, festivales y presentaciones culturales en diferentes escenarios del país.",
    highlight:
      "Nuestra historia comienza en Catacaos, Piura.",
    color: "#8c1832"
  },

  EC: {
    flagImage: "img/ecuador.svg",
    flagAlt: "Bandera de Ecuador",
    name: "Ecuador",
    type: "Representación internacional",
    years: "2017 · 2018 · 2019",
    description:
      "Representamos nuestra cultura durante tres años, fortaleciendo el intercambio artístico y los vínculos entre agrupaciones latinoamericanas.",
    highlight:
      "Tres experiencias internacionales compartiendo el folklore peruano.",
    color: "#e2aa16"
  },

  BO: {
    flagImage: "img/bolivia.svg",
    flagAlt: "Bandera de Bolivia",
    name: "Bolivia",
    type: "Encuentro internacional",
    years: "2025",
    description:
      "Compartimos nuestras danzas y tradiciones en una nueva experiencia de representación cultural fuera del Perú.",
    highlight:
      "Una experiencia que amplió nuestra trayectoria internacional.",
    color: "#315b9b"
  }
};

const southAmericaMap =
  document.getElementById("southAmericaMap");

const cultureCountryDetail =
  document.getElementById("cultureCountryDetail");

function updateCultureCountry(countryId) {
  const country = cultureCountries[countryId];

  if (!country) {
    return;
  }

  const flagElement =
    document.getElementById("cultureCountryFlag");

  flagElement.src = country.flagImage;
  flagElement.alt = country.flagAlt;

  document.getElementById(
    "cultureCountryType"
  ).textContent = country.type;

  document.getElementById(
    "cultureCountryName"
  ).textContent = country.name;

  document.getElementById(
    "cultureCountryYears"
  ).textContent = country.years;

  document.getElementById(
    "cultureCountryDescription"
  ).textContent = country.description;

  document.getElementById(
    "cultureCountryHighlight"
  ).textContent = country.highlight;

  document
    .querySelectorAll(".culture-country-button")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.country === countryId
      );
    });

  document
    .querySelectorAll(
      "#southAmericaMap .map-country"
    )
    .forEach((element) => {
      element.classList.toggle(
        "map-country-active",
        element.id === countryId
      );
    });

  cultureCountryDetail.classList.remove(
    "country-changing"
  );

  void cultureCountryDetail.offsetWidth;

  cultureCountryDetail.classList.add(
    "country-changing"
  );
}

async function loadSouthAmericaMap() {
  if (!southAmericaMap) {
    return;
  }

  try {
    const response = await fetch(
      "img/sudamerica-pysc-interactivo.svg"
    );

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar el mapa: ${response.status}`
      );
    }

    const svgContent = await response.text();

    southAmericaMap.innerHTML = svgContent;

    const svg =
      southAmericaMap.querySelector("svg");

    if (!svg) {
      throw new Error(
        "El archivo cargado no contiene un SVG válido."
      );
    }

    svg.setAttribute(
      "role",
      "img"
    );

    svg.setAttribute(
      "aria-label",
      "Mapa de Sudamérica con los países visitados por PySC"
    );

    Object.entries(cultureCountries).forEach(
      ([countryId, country]) => {
        const element =
          svg.querySelector(`#${countryId}`);

        if (!element) {
          console.warn(
            `No se encontró el país ${countryId} en el SVG.`
          );

          return;
        }

        element.classList.add(
          "map-country"
        );

        element.style.fill =
          country.color;

        element.setAttribute(
          "tabindex",
          "0"
        );

        element.setAttribute(
          "role",
          "button"
        );

        element.setAttribute(
          "aria-label",
          `Ver trayectoria en ${country.name}`
        );

        element.addEventListener(
          "click",
          () => {
            updateCultureCountry(countryId);
          }
        );

        element.addEventListener(
          "keydown",
          (event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              updateCultureCountry(countryId);
            }
          }
        );
      }
    );

    updateCultureCountry("PE");
  } catch (error) {
    console.error(error);

    southAmericaMap.innerHTML = `
      <div class="map-loading">
        <i class="fa-solid fa-map"></i>
        No se pudo cargar el mapa.
      </div>
    `;
  }
}

document
  .querySelectorAll(".culture-country-button")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        updateCultureCountry(
          button.dataset.country
        );
      }
    );
  });

loadSouthAmericaMap();








/* =========================
   ANIMACIONES GENERALES
========================= */

function initializeScrollReveal() {
  const revealElements =
    document.querySelectorAll(
      "[data-reveal]"
    );

  if (revealElements.length === 0) {
    return;
  }

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (
    reduceMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach(
      (element) => {
        element.classList.add(
          "reveal-active"
        );
      }
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target;

          const delay = Number(
            element.dataset.revealDelay || 0
          );

          element.style.transitionDelay =
            `${Math.max(0, delay)}ms`;

          element.classList.add(
            "reveal-active"
          );

          currentObserver.unobserve(
            element
          );
        });
      },
      {
        threshold: 0.14,
        rootMargin:
          "0px 0px -45px 0px"
      }
    );

  revealElements.forEach(
    (element) => {
      observer.observe(element);
    }
  );
}

initializeScrollReveal();


/* =========================
   PARALLAX DEL HERO
========================= */

function initializeHeroParallax() {
  const hero =
    document.querySelector(".hero");

  if (!hero) {
    return;
  }

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  const isMobile =
    window.matchMedia(
      "(max-width: 900px)"
    ).matches;

  if (reduceMotion || isMobile) {
    hero.style.setProperty(
      "--hero-parallax",
      "0px"
    );

    return;
  }

  let ticking = false;

  function updateHeroParallax() {
    const heroHeight =
      hero.offsetHeight;

    const scrollPosition =
      Math.min(
        window.scrollY,
        heroHeight
      );

    const movement =
      scrollPosition * 0.16;

    hero.style.setProperty(
      "--hero-parallax",
      `${movement}px`
    );

    ticking = false;
  }

  function requestHeroParallax() {
    if (ticking) {
      return;
    }

    window.requestAnimationFrame(
      updateHeroParallax
    );

    ticking = true;
  }

  window.addEventListener(
    "scroll",
    requestHeroParallax,
    {
      passive: true
    }
  );

  updateHeroParallax();
}

initializeHeroParallax();


const galleryFolders = {
  presentaciones: 18,
  concursos: 9,
  viajes: 12,
  proyectos: 15,
  actividades: 20
};

const galleryGrid =
  document.getElementById("galleryGrid");

const filterButtons =
  document.querySelectorAll(".gallery-filter");

const lightbox =
  document.getElementById("galleryLightbox");

const lightboxImage =
  document.getElementById("lightboxImage");

const lightboxCounter =
  document.getElementById("lightboxCounter");

const lightboxClose =
  document.getElementById("lightboxClose");

const lightboxPrev =
  document.getElementById("lightboxPrev");

const lightboxNext =
  document.getElementById("lightboxNext");

let visibleImages = [];
let currentImageIndex = 0;


/* CREAR GALERÍA */

function buildGallery() {
  galleryGrid.innerHTML = "";

  Object.entries(galleryFolders).forEach(
    ([category, total]) => {

      for (let i = 1; i <= total; i++) {
        const number =
          String(i).padStart(2, "0");

        const imagePath =
          `img/galeria/${category}/${number}.jpg`;

        const article =
          document.createElement("article");

        article.className = "gallery-item";
        article.dataset.category = category;
        article.dataset.image = imagePath;

        article.innerHTML = `
          <button
            class="gallery-item-button"
            type="button"
            aria-label="Ampliar fotografía"
          >
            <img
              src="${imagePath}"
              alt="Fotografía de ${category}"
              loading="lazy"
            >

            <span class="gallery-item-overlay">
              <span class="gallery-item-icon">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
              </span>
            </span>
          </button>
        `;

        galleryGrid.appendChild(article);
      }
    }
  );

  addGalleryEvents();
  updateVisibleImages();
}


/* EVENTOS DE LAS FOTOS */

function addGalleryEvents() {
  const galleryButtons =
    document.querySelectorAll(
      ".gallery-item-button"
    );

  galleryButtons.forEach(button => {
    button.addEventListener("click", () => {
      const item =
        button.closest(".gallery-item");

      updateVisibleImages();

      currentImageIndex =
        visibleImages.indexOf(item);

      openLightbox();
    });
  });
}


/* FOTOS VISIBLES SEGÚN FILTRO */

function updateVisibleImages() {
  visibleImages = Array.from(
    document.querySelectorAll(
      ".gallery-item:not(.is-hidden)"
    )
  );
}


/* ABRIR LIGHTBOX */

function openLightbox() {
  const selectedItem =
    visibleImages[currentImageIndex];

  if (!selectedItem) {
    return;
  }

  const image =
    selectedItem.querySelector("img");

  lightboxImage.src =
    selectedItem.dataset.image;

  lightboxImage.alt =
    image.alt;

  lightboxCounter.textContent =
    `${currentImageIndex + 1} de ${visibleImages.length}`;

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");

  document.body.classList.add(
    "lightbox-open"
  );
}


/* CERRAR LIGHTBOX */

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");

  document.body.classList.remove(
    "lightbox-open"
  );

  lightboxImage.src = "";
}


/* IMAGEN ANTERIOR */

function showPreviousImage() {
  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex =
      visibleImages.length - 1;
  }

  openLightbox();
}


/* IMAGEN SIGUIENTE */

function showNextImage() {
  currentImageIndex++;

  if (
    currentImageIndex >= visibleImages.length
  ) {
    currentImageIndex = 0;
  }

  openLightbox();
}


/* FILTROS */

filterButtons.forEach(button => {
  button.addEventListener("click", () => {

    filterButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const filter =
      button.dataset.filter;

    document
      .querySelectorAll(".gallery-item")
      .forEach(item => {

        const shouldShow =
          filter === "all" ||
          item.dataset.category === filter;

        item.classList.toggle(
          "is-hidden",
          !shouldShow
        );
      });

    updateVisibleImages();
  });
});


/* CONTROLES DEL LIGHTBOX */

if (
  lightbox &&
  lightboxImage &&
  lightboxClose &&
  lightboxPrev &&
  lightboxNext
) {
  lightboxClose.addEventListener(
    "click",
    closeLightbox
  );

  lightboxPrev.addEventListener(
    "click",
    showPreviousImage
  );

  lightboxNext.addEventListener(
    "click",
    showNextImage
  );

  /* CERRAR AL HACER CLIC EN EL FONDO */

  lightbox.addEventListener(
    "click",
    (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    }
  );

  /* CONTROLES DEL TECLADO */

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        !lightbox.classList.contains("is-open")
      ) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    }
  );
}

/* INICIAR GALERÍA */

if (galleryGrid) {
  buildGallery();
}


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/PySC-web/sw.js")
            .then(() => {
                console.log("Service Worker registrado");
            })
            .catch(error => {
                console.error(error);
            });
    });
}