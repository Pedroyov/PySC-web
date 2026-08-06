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
   IMAGEN DEL GANADOR
   ========================================================= */

function createAwardsWinnerImage(winner) {
  if (winner.imagen) {
    return `
      <img
        src="${escapeAwardsHTML(
          winner.imagen
        )}"
        alt="Ganador de ${escapeAwardsHTML(
          winner.categoria
        )}: ${escapeAwardsHTML(
          winner.ganador
        )}"
        class="awards-winner-image"
        loading="lazy"
        decoding="async"
      >
    `;
  }

  return `
    <div class="awards-winner-placeholder">
      <span aria-hidden="true">
        🏆
      </span>

      <strong>
        ${escapeAwardsHTML(
          getWinnerInitials(
            winner.ganador
          )
        )}
      </strong>
    </div>
  `;
}

/* =========================================================
   GANADORES
   ========================================================= */

function renderAwardsWinners(year) {
  if (!awardsWinnersGrid) {
    return;
  }

  const currentWinners =
    awardsWinners
      .filter((winner) => {
        return (
          isAwardsVisible(winner) &&
          getAwardsNumber(
            winner.anio
          ) === Number(year)
        );
      })
      .sort((first, second) => {
        return (
          getAwardsNumber(
            first.orden,
            999
          ) -
          getAwardsNumber(
            second.orden,
            999
          )
        );
      });

  if (
    currentWinners.length === 0
  ) {
    awardsWinnersGrid.innerHTML = `
      <article class="awards-empty-state">
        <div class="awards-empty-icon">
          🏆
        </div>

        <h3>
          Todavía no hay ganadores registrados
        </h3>

        <p>
          Los resultados de esta edición
          se publicarán próximamente.
        </p>
      </article>
    `;

    return;
  }

  awardsWinnersGrid.innerHTML =
    currentWinners
      .map((winner) => {
        const isFeatured =
          winner.destacado
            ?.trim()
            .toUpperCase() === "SI";

        return `
          <article
            class="awards-winner-card
            ${
              isFeatured
                ? "awards-winner-card-featured"
                : ""
            }"
            data-category-id="${escapeAwardsHTML(
              winner.id_categoria
            )}"
            tabindex="0"
            role="button"
            aria-label="Ver información de ${escapeAwardsHTML(
              winner.categoria
            )}"
          >
            <div
              class="awards-winner-image-wrapper"
            >
              <span
                class="awards-winner-badge"
              >
                ${
                  isFeatured
                    ? "Premio destacado"
                    : "Ganador"
                }
              </span>

              ${createAwardsWinnerImage(
                winner
              )}
            </div>

            <div
              class="awards-winner-content"
            >
              <span
                class="awards-winner-category"
              >
                ${escapeAwardsHTML(
                  winner.categoria
                )}
              </span>

              <h3
                class="awards-winner-name"
              >
                ${escapeAwardsHTML(
                  winner.ganador ||
                  "Ganador pendiente"
                )}
              </h3>

              ${
                winner.descripcion
                  ? `
                    <p
                      class="awards-winner-description"
                    >
                      ${escapeAwardsHTML(
                        winner.descripcion
                      )}
                    </p>
                  `
                  : ""
              }

              <span
                class="awards-card-details"
              >
                Ver nominados
                <i
                  class="fa-solid fa-arrow-right"
                  aria-hidden="true"
                ></i>
              </span>
            </div>
          </article>
        `;
      })
      .join("");
}

/* =========================================================
   EDICIÓN SELECCIONADA
   ========================================================= */

function renderAwardsEdition(year) {
  const edition =
    awardsEditions.find(
      (item) =>
        getAwardsNumber(
          item.anio
        ) === Number(year)
    );

  if (!edition) {
    return;
  }

  awardsCurrentYear.textContent =
    edition.anio;

  awardsEditionTitle.textContent =
    edition.titulo ||
    `PySC Awards ${edition.anio}`;

  awardsEditionDescription.textContent =
    edition.descripcion ||
    "Una edición especial de los PySC Awards.";

  document
    .querySelectorAll(
      ".awards-year-button"
    )
    .forEach((button) => {
      const isActive =
        Number(button.dataset.year) ===
        Number(edition.anio);

      button.classList.toggle(
        "active",
        isActive
      );

      button.setAttribute(
        "aria-pressed",
        String(isActive)
      );
    });

  renderAwardsWinners(
    edition.anio
  );
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
            ${
              index === 0
                ? "active"
                : ""
            }"
            data-year="${escapeAwardsHTML(
              edition.anio
            )}"
            aria-pressed="${
              index === 0
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