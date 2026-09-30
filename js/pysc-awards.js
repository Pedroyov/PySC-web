document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");

  if (!header) {
    return;
  }

  const actualizarHeader = () => {
    header.classList.toggle(
      "scrolled",
      window.scrollY > 40
    );
  };

  actualizarHeader();

  window.addEventListener(
    "scroll",
    actualizarHeader,
    {
      passive: true
    }
  );
});


/* =========================================================
   GOOGLE SHEETS
   ========================================================= */

const awardsSheets = {
  editions:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6_HBWSqyzKN0nLp4wSOFyTTR1aLMsEJmf3y86GeC-An9t3XzGhOZAl4cxH7_fwnk5-0n8lwAWVIHH/pub?gid=0&single=true&output=csv",

  winners:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6_HBWSqyzKN0nLp4wSOFyTTR1aLMsEJmf3y86GeC-An9t3XzGhOZAl4cxH7_fwnk5-0n8lwAWVIHH/pub?gid=1748091510&single=true&output=csv",

  nominees:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6_HBWSqyzKN0nLp4wSOFyTTR1aLMsEJmf3y86GeC-An9t3XzGhOZAl4cxH7_fwnk5-0n8lwAWVIHH/pub?gid=1737639824&single=true&output=csv"
};

/* =========================================================
   ELEMENTOS HTML
   ========================================================= */

const awardsYearSelector =
  document.getElementById("awards-year-selector");

const awardsCurrentYear =
  document.getElementById("awards-current-year");

const awardsEditionTitle =
  document.getElementById("awards-edition-title");

const awardsEditionDescription =
  document.getElementById(
    "awards-edition-description"
  );

const awardsWinnersGrid =
  document.getElementById("awards-winners-grid");


const awardsModal =
  document.getElementById("awardsModal");

const awardsModalClose =
  document.getElementById("awardsModalClose");

const awardsModalTitle =
  document.getElementById("awardsModalTitle");

const awardsModalWinner =
  document.getElementById("awardsModalWinner");

const awardsNomineesList =
  document.getElementById("awardsNomineesList");

/* =========================================================
   DATOS GLOBALES
   ========================================================= */

let awardsEditions = [];
let awardsWinners = [];
let awardsNominees = [];

/* =========================================================
   CSV
   ========================================================= */

function parseAwardsCSV(csvText) {
  const rows = [];

  let row = [];
  let value = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < csvText.length;
    index++
  ) {
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

    if (
      character === "," &&
      !insideQuotes
    ) {
      row.push(value.trim());
      value = "";

      continue;
    }

    if (
      (
        character === "\n" ||
        character === "\r"
      ) &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index++;
      }

      row.push(value.trim());

      if (
        row.some(
          (cell) => cell !== ""
        )
      ) {
        rows.push(row);
      }

      row = [];
      value = "";

      continue;
    }

    value += character;
  }

  if (
    value !== "" ||
    row.length > 0
  ) {
    row.push(value.trim());

    if (
      row.some(
        (cell) => cell !== ""
      )
    ) {
      rows.push(row);
    }
  }

  return rows;
}

function awardsCSVToObjects(csvText) {
  const rows = parseAwardsCSV(csvText);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(
    (header) =>
      header
        .trim()
        .toLowerCase()
  );

  return rows
    .slice(1)
    .map((row) => {
      const item = {};

      headers.forEach(
        (header, index) => {
          item[header] =
            row[index]?.trim() ?? "";
        }
      );

      return item;
    });
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function escapeAwardsHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeAwardsVisible(value = "") {
  return value
    .trim()
    .toUpperCase();
}

function isAwardsVisible(item) {
  return (
    normalizeAwardsVisible(
      item.visible
    ) !== "NO"
  );
}

function getAwardsNumber(
  value,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getWinnerInitials(name = "") {
  const cleanName = name.trim();

  if (!cleanName) {
    return "PySC";
  }

  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0)
    )
    .join("")
    .toUpperCase();
}

/* =========================================================
   YOUTUBE
   Acepta: enlace normal, youtu.be, shorts, embed o solo el ID.
   ========================================================= */

function getYouTubeId(value = "") {
  const text = String(value).trim();

  if (!text) {
    return "";
  }

  if (/^[\w-]{11}$/.test(text)) {
    return text;
  }

  const match = text.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/
  );

  return match ? match[1] : "";
}

function getYouTubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function getYouTubeEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}

/* =========================================================
   MODAL DE CATEGORÍA
   ========================================================= */

const awardsModalVideo =
  document.getElementById("awardsModalVideo");

const awardsModalDescription =
  document.getElementById("awardsModalDescription");

const awardsModalKicker =
  document.getElementById("awardsModalKicker");

function setAwardsModalVideo(videoId, title) {
  if (!awardsModalVideo) {
    return;
  }

  if (!videoId) {
    awardsModalVideo.innerHTML = "";
    awardsModalVideo.hidden = true;
    awardsModal?.classList.remove("has-video");
    return;
  }

  awardsModalVideo.hidden = false;
  awardsModal?.classList.add("has-video");

  awardsModalVideo.innerHTML = `
    <iframe
      src="${getYouTubeEmbed(videoId)}"
      title="Video: ${escapeAwardsHTML(title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  `;
}

function getAwardsNominees(categoryId) {
  return awardsNominees
    .filter((nominee) => {
      return (
        isAwardsVisible(nominee) &&
        (nominee.id_categoria || "").trim() === categoryId.trim() &&
        (nominee.nominado || "").trim() !== ""
      );
    })
    .sort(
      (first, second) =>
        getAwardsNumber(first.orden, 999) -
        getAwardsNumber(second.orden, 999)
    );
}

function openAwardsModal(categoryId) {
  const winner = awardsWinners.find(
    (item) =>
      (item.id_categoria || "").trim() === categoryId.trim()
  );

  if (!winner || !awardsModal) {
    return;
  }

  const nominees = getAwardsNominees(categoryId);
  const winnerName = (winner.ganador || "").trim();

  if (awardsModalKicker) {
    awardsModalKicker.textContent =
      `PySC Awards ${winner.anio || ""}`.trim();
  }

  awardsModalTitle.textContent = winner.categoria;
  awardsModalWinner.textContent = winnerName || "Ganador pendiente";

  if (awardsModalDescription) {
    awardsModalDescription.textContent = winner.descripcion || "";
    awardsModalDescription.hidden = !winner.descripcion;
  }

  setAwardsModalVideo(
    getYouTubeId(winner.video),
    winner.categoria
  );

  if (nominees.length === 0) {
    awardsNomineesList.innerHTML = `
      <p class="awards-no-nominees">
        No hay nominados registrados para esta categoría.
      </p>
    `;
  } else {
    awardsNomineesList.innerHTML = nominees
      .map((nominee) => {
        const isWinner =
          nominee.nominado.trim().toLowerCase() ===
          winnerName.toLowerCase();

        return `
          <div class="awards-nominee ${isWinner ? "awards-nominee-winner" : ""}">
            <span class="awards-nominee-name">
              ${escapeAwardsHTML(nominee.nominado)}
            </span>
            ${
              isWinner
                ? `<span class="awards-nominee-badge">
                     <i class="fa-solid fa-trophy" aria-hidden="true"></i>
                     Ganador
                   </span>`
                : ""
            }
          </div>
        `;
      })
      .join("");
  }

  awardsModal.classList.add("open");
  awardsModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("awards-modal-open");

  awardsModalClose?.focus({ preventScroll: true });
}

function closeAwardsModal() {
  if (!awardsModal) {
    return;
  }

  awardsModal.classList.remove("open");
  awardsModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("awards-modal-open");

  // Detiene el video al cerrar
  setAwardsModalVideo("");
}

/* =========================================================
   TARJETAS
   ========================================================= */

function createAwardsMedia(winner, size) {
  const videoId = getYouTubeId(winner.video);
  const image = (winner.imagen || "").trim();

  if (image) {
    return `
      <div class="aw-media">
        <img src="${escapeAwardsHTML(image)}"
             alt="${escapeAwardsHTML(winner.ganador)}"
             loading="lazy" decoding="async">
        ${videoId ? '<span class="aw-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>' : ""}
      </div>
    `;
  }

  if (videoId) {
    return `
      <div class="aw-media">
        <img src="${getYouTubeThumb(videoId)}"
             alt="Video de ${escapeAwardsHTML(winner.categoria)}"
             loading="lazy" decoding="async">
        <span class="aw-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
      </div>
    `;
  }

  return `
    <div class="aw-media aw-media-empty" aria-hidden="true">
      <span class="aw-medal ${size === "major" ? "aw-medal-lg" : ""}">
        <i class="fa-solid fa-trophy"></i>
      </span>
    </div>
  `;
}

function createAwardsCard(winner, size) {
  const videoId = getYouTubeId(winner.video);
  const category = escapeAwardsHTML((winner.categoria || "").trim());
  const name = escapeAwardsHTML((winner.ganador || "").trim() || "Ganador pendiente");

  return `
    <article
      class="aw-card aw-card-${size}"
      data-category-id="${escapeAwardsHTML(winner.id_categoria)}"
      tabindex="0"
      role="button"
      aria-label="${category}: ${name}. Ver detalle${videoId ? " y video" : ""}"
    >
      ${createAwardsMedia(winner, size)}

      <div class="aw-body">
        <span class="aw-category">${category}</span>
        <h4 class="aw-winner">${name}</h4>
        ${
          size === "major" && winner.descripcion
            ? `<p class="aw-desc">${escapeAwardsHTML(winner.descripcion)}</p>`
            : ""
        }
        <span class="aw-more">
          ${videoId ? '<i class="fa-brands fa-youtube" aria-hidden="true"></i> Ver video y nominados' : "Ver nominados"}
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </span>
      </div>
    </article>
  `;
}

/* =========================================================
   GANADORES DE LA EDICIÓN
   Premios mayores (destacado = SI) y premios del año.
   ========================================================= */

function renderAwardsWinners(year) {
  if (!awardsWinnersGrid) {
    return;
  }

  const currentWinners = awardsWinners
    .filter(
      (winner) =>
        isAwardsVisible(winner) &&
        (winner.id_categoria || "").trim() !== "" &&
        getAwardsNumber(winner.anio) === Number(year)
    )
    .sort(
      (first, second) =>
        getAwardsNumber(first.orden, 999) -
        getAwardsNumber(second.orden, 999)
    );

  if (currentWinners.length === 0) {
    awardsWinnersGrid.classList.remove("aw-layout");
    awardsWinnersGrid.innerHTML = `
      <article class="awards-empty-state">
        <div class="awards-empty-icon">🏆</div>
        <h3>Todavía no hay ganadores registrados</h3>
        <p>Los resultados de esta edición se publicarán próximamente.</p>
      </article>
    `;
    return;
  }

  const isMajor = (winner) =>
    (winner.destacado || "").trim().toUpperCase() === "SI";

  const major = currentWinners.filter(isMajor);
  const minor = currentWinners.filter((winner) => !isMajor(winner));

  awardsWinnersGrid.classList.add("aw-layout");

  awardsWinnersGrid.innerHTML = `
    ${
      major.length
        ? `<div class="aw-block">
             <div class="aw-block-head">
               <span class="aw-block-icon" aria-hidden="true"><i class="fa-solid fa-crown"></i></span>
               <h3>Premios mayores</h3>
               <span class="aw-block-count">${major.length}</span>
             </div>
             <div class="aw-major-grid">
               ${major.map((winner) => createAwardsCard(winner, "major")).join("")}
             </div>
           </div>`
        : ""
    }
    ${
      minor.length
        ? `<div class="aw-block">
             <div class="aw-block-head">
               <span class="aw-block-icon" aria-hidden="true"><i class="fa-solid fa-face-laugh-beam"></i></span>
               <h3>Premios del año</h3>
               <span class="aw-block-count">${minor.length}</span>
             </div>
             <div class="aw-minor-grid">
               ${minor.map((winner) => createAwardsCard(winner, "minor")).join("")}
             </div>
           </div>`
        : ""
    }
  `;

  awardsWinnersGrid.querySelectorAll(".aw-card").forEach((card) => {
    card.addEventListener("click", () => {
      openAwardsModal(card.dataset.categoryId);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAwardsModal(card.dataset.categoryId);
      }
    });
  });
}

if (awardsModalClose) {
  awardsModalClose.addEventListener("click", closeAwardsModal);
}

document
  .querySelectorAll("[data-awards-modal-close]")
  .forEach((element) => {
    element.addEventListener("click", closeAwardsModal);
  });

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    awardsModal?.classList.contains("open")
  ) {
    closeAwardsModal();
  }
});

/* =========================================================
   EDICIÓN SELECCIONADA
   ========================================================= */

const awardsEditionMeta =
  document.getElementById("awards-edition-meta");

function formatAwardsDate(value = "") {
  const match = String(value).trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

  if (!match) {
    return value;
  }

  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  return `${Number(match[1])} de ${months[Number(match[2]) - 1] || ""} de ${match[3]}`;
}

function renderAwardsEdition(year) {
  const edition = awardsEditions.find(
    (item) => getAwardsNumber(item.anio) === Number(year)
  );

  if (!edition) {
    return;
  }

  awardsCurrentYear.textContent = edition.anio;

  awardsEditionTitle.textContent =
    edition.titulo || `PySC Awards ${edition.anio}`;

  awardsEditionDescription.textContent =
    edition.descripcion || "Una edición especial de los PySC Awards.";

  if (awardsEditionMeta) {
    const total = awardsWinners.filter(
      (winner) =>
        isAwardsVisible(winner) &&
        (winner.id_categoria || "").trim() !== "" &&
        getAwardsNumber(winner.anio) === Number(edition.anio)
    ).length;

    const galaVideo = getYouTubeId(edition.video);

    const chips = [];

    if (edition.fecha) {
      chips.push(`<span class="aw-chip"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${escapeAwardsHTML(formatAwardsDate(edition.fecha))}</span>`);
    }

    if (edition.lugar) {
      chips.push(`<span class="aw-chip"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeAwardsHTML(edition.lugar)}</span>`);
    }

    if (total) {
      chips.push(`<span class="aw-chip"><i class="fa-solid fa-trophy" aria-hidden="true"></i>${total} categorías</span>`);
    }

    if (galaVideo) {
      chips.push(`<a class="aw-chip aw-chip-video" href="https://www.youtube.com/watch?v=${galaVideo}" target="_blank" rel="noopener"><i class="fa-brands fa-youtube" aria-hidden="true"></i>Ver la gala</a>`);
    }

    awardsEditionMeta.innerHTML = chips.join("");
    awardsEditionMeta.hidden = chips.length === 0;
  }

  document.querySelectorAll(".awards-year-button").forEach((button) => {
    const isActive = Number(button.dataset.year) === Number(edition.anio);
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderAwardsWinners(edition.anio);
}

/* =========================================================
   SELECTOR DE AÑOS
   ========================================================= */

function renderAwardsYearSelector() {
  if (!awardsYearSelector) {
    return;
  }

  awardsEditions.sort(
    (first, second) =>
      getAwardsNumber(
        second.anio
      ) -
      getAwardsNumber(
        first.anio
      )
  );

  awardsYearSelector.innerHTML =
    awardsEditions
      .map((edition, index) => {
        return `
          <button
            type="button"
            class="awards-year-button
            ${index === 0
            ? "active"
            : ""
          }"
            data-year="${escapeAwardsHTML(
            edition.anio
          )}"
            aria-pressed="${index === 0
          }"
          >
            ${escapeAwardsHTML(
            edition.anio
          )}
          </button>
        `;
      })
      .join("");

  awardsYearSelector
    .querySelectorAll(
      ".awards-year-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          renderAwardsEdition(
            button.dataset.year
          );
        }
      );
    });
}

/* =========================================================
   CARGAR UNA HOJA
   ========================================================= */

async function fetchAwardsSheet(url) {
  const response = await fetch(
    url,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar la hoja: ${response.status}`
    );
  }

  const csvText =
    await response.text();

  return awardsCSVToObjects(
    csvText
  );
}

/* =========================================================
   CARGAR TODOS LOS DATOS
   ========================================================= */

async function loadAwardsData() {
  if (
    !awardsYearSelector ||
    !awardsCurrentYear ||
    !awardsEditionTitle ||
    !awardsEditionDescription ||
    !awardsWinnersGrid
  ) {
    return;
  }

  try {
    const [
      editionsData,
      winnersData,
      nomineesData
    ] = await Promise.all([
      fetchAwardsSheet(
        awardsSheets.editions
      ),

      fetchAwardsSheet(
        awardsSheets.winners
      ),

      fetchAwardsSheet(
        awardsSheets.nominees
      )
    ]);

    awardsEditions =
      editionsData.filter(
        isAwardsVisible
      );

    awardsWinners =
      winnersData.filter(
        isAwardsVisible
      );

    awardsNominees =
      nomineesData.filter(
        isAwardsVisible
      );

    if (
      awardsEditions.length === 0
    ) {
      throw new Error(
        "No hay ediciones visibles."
      );
    }

    renderAwardsYearSelector();

    const newestEdition =
      awardsEditions[0];

    renderAwardsEdition(
      newestEdition.anio
    );
  } catch (error) {
    console.error(
      "Error al cargar los PySC Awards:",
      error
    );

    awardsYearSelector.innerHTML = "";

    awardsCurrentYear.textContent =
      "—";

    awardsEditionTitle.textContent =
      "No pudimos cargar las ediciones";

    awardsEditionDescription.textContent =
      "Inténtalo nuevamente dentro de unos momentos.";

    awardsWinnersGrid.innerHTML = `
      <article class="awards-empty-state">
        <div class="awards-empty-icon">
          ⚠️
        </div>

        <h3>
          No pudimos cargar los ganadores
        </h3>

        <p>
          Revisa que las hojas estén publicadas
          correctamente y vuelve a intentarlo.
        </p>
      </article>
    `;
  }
}

/* =========================================================
   INICIAR
   ========================================================= */

loadAwardsData();
