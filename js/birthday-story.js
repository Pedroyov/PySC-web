/* =========================
   GENERADOR DE HISTORIAS
   DE CUMPLEAÑOS
========================= */

const birthdayStoryConfig = {
  width: 1080,
  height: 1920,

  template:
    "img/plantillas/cumpleanos-1.png",

  name: {
    x: 540,
    y: 1340,
    maxWidth: 820,
    fontSize: 190,
    minFontSize: 54,
    fontFamily: "Rouge Script",
    fontWeight: "400",
    color: "#bb1e40"
  },

  photo: {
    x: 540,
    y: 1090,
    radius: 280,
    borderWidth: 18,
    innerBorderWidth: 1
  },

  message: {
    x: 540,
    y: 1530,
    maxWidth: 760,
    fontSize: 38,
    lineHeight: 54,
    maxLines: 4,
    fontFamily: "Nunito Sans",
    fontWeight: "700",
    color: "#201a1a"
  }
};

const storyDownloadButton =
  document.getElementById("birthdayDownload");

const storyStatusElement =
  document.getElementById("birthdayShareStatus");

/*
  Carga una imagen y espera hasta que esté lista.
*/
function loadCanvasImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    /*
      Es necesario para fotografías externas que permitan CORS.
      Las imágenes guardadas en GitHub Pages funcionan normalmente.
    */
    image.crossOrigin = "anonymous";

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(
        new Error(`No se pudo cargar la imagen: ${source}`)
      );
    };

    image.src = source;
  });
}

/*
  Espera a que las fuentes estén cargadas antes
  de generar la imagen.
*/
async function waitForCanvasFonts() {
  if (!document.fonts) {
    return;
  }

  await Promise.all([
    document.fonts.load("400 150px 'Rouge Script'"),
    document.fonts.load("700 38px 'Nunito Sans'")
  ]);
}

/*
  Reduce el tamaño del nombre cuando es demasiado largo.
*/
function getResponsiveFontSize(
  context,
  text,
  config
) {
  let fontSize = config.fontSize;

  while (fontSize > config.minFontSize) {
    context.font =
      `${config.fontWeight} ${fontSize}px "${config.fontFamily}"`;

    if (
      context.measureText(text).width <=
      config.maxWidth
    ) {
      break;
    }

    fontSize -= 2;
  }

  return fontSize;
}

/*
  Escribe el nombre centrado.
*/
function drawBirthdayName(
  context,
  name
) {
  const config =
    birthdayStoryConfig.name;

  const fontSize =
    getResponsiveFontSize(
      context,
      name,
      config
    );

  context.save();

  context.font =
    `${config.fontWeight} ${fontSize}px "${config.fontFamily}"`;

  context.textAlign = "center";
  context.textBaseline = "middle";

  /*
    Sombra muy sutil
  */
  context.shadowColor =
    "rgba(0, 0, 0, 0.18)";

  context.shadowBlur = 14;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 6;

  /*
    Contorno blanco
  */
  context.lineJoin = "round";
  context.lineWidth = 8;
  context.strokeStyle = "#ffffff";

  context.strokeText(
    name,
    config.x,
    config.y,
    config.maxWidth
  );

  /*
    Relleno principal
  */
  const gradient =
    context.createLinearGradient(
        0,
        config.y - fontSize,
        0,
        config.y + fontSize
    );

    gradient.addColorStop(
    0,
    "#b41d46"
    );

    gradient.addColorStop(
    1,
    "#7b1631"
    );

    context.fillStyle =
    gradient;

  context.fillText(
    name,
    config.x,
    config.y,
    config.maxWidth
  );

  context.restore();
}

/*
  Recorta y dibuja una fotografía circular
  llenando correctamente el espacio.
*/
function drawCircularPhoto(
  context,
  image
) {
  const config =
    birthdayStoryConfig.photo;

  const diameter =
    config.radius * 2;

  /*
    Determina el recorte tipo object-fit: cover.
  */
  const imageRatio =
    image.width / image.height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageRatio > 1) {
    sourceWidth = image.height;
    sourceX =
      (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width;
    sourceY =
      (image.height - sourceHeight) / 2;
  }

  context.save();

  /*
    Sombra exterior.
  */
  context.beginPath();
  context.arc(
    config.x,
    config.y,
    config.radius +
      config.borderWidth,
    0,
    Math.PI * 2
  );

  context.shadowColor =
    "rgba(87, 33, 70, 0.32)";

  context.shadowBlur = 35;
  context.shadowOffsetY = 18;

  context.fillStyle = "#ffffff";
  context.fill();

  context.restore();

  /*
    Aro multicolor similar al de la tarjeta web.
  */
  const gradient =
    context.createConicGradient(
      0,
      config.x,
      config.y
    );

  gradient.addColorStop(
    0,
    "#e2aa16"
  );

  gradient.addColorStop(
    0.18,
    "#ff814d"
  );

  gradient.addColorStop(
    0.36,
    "#ef75bb"
  );

  gradient.addColorStop(
    0.55,
    "#8c1832"
  );

  gradient.addColorStop(
    0.76,
    "#132f5d"
  );

  gradient.addColorStop(
    1,
    "#e2aa16"
  );

  context.save();

  context.beginPath();
  context.arc(
    config.x,
    config.y,
    config.radius +
      config.borderWidth,
    0,
    Math.PI * 2
  );

  context.fillStyle = gradient;
  context.fill();

  /*
    Borde blanco interior.
  */
  context.beginPath();
  context.arc(
    config.x,
    config.y,
    config.radius,
    0,
    Math.PI * 2
  );

  context.fillStyle = "#ffffff";
  context.fill();

  /*
    Recorte circular de la fotografía.
  */
  const photoRadius =
    config.radius -
    config.innerBorderWidth;

  context.beginPath();
  context.arc(
    config.x,
    config.y,
    photoRadius,
    0,
    Math.PI * 2
  );

  context.clip();

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    config.x - photoRadius,
    config.y - photoRadius,
    photoRadius * 2,
    photoRadius * 2
  );

  context.restore();
}

/*
  Divide el mensaje en líneas respetando el ancho máximo.
*/
function createTextLines(
  context,
  text,
  maxWidth
) {
  const words =
    text.trim().split(/\s+/);

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    const width =
      context.measureText(
        testLine
      ).width;

    if (
      width > maxWidth &&
      currentLine
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/*
  Escribe el mensaje centrado en varias líneas.
*/
function drawBirthdayMessage(
  context,
  message
) {
  const config =
    birthdayStoryConfig.message;

  context.save();

  context.font =
    `${config.fontWeight} ${config.fontSize}px "${config.fontFamily}"`;

  context.fillStyle = config.color;
  context.textAlign = "center";
  context.textBaseline = "middle";

  let lines =
    createTextLines(
      context,
      message,
      config.maxWidth
    );

  if (
    lines.length >
    config.maxLines
  ) {
    lines =
      lines.slice(
        0,
        config.maxLines
      );

    let finalLine =
      lines[
        lines.length - 1
      ];

    while (
      context.measureText(
        `${finalLine}…`
      ).width >
        config.maxWidth &&
      finalLine.length > 0
    ) {
      finalLine =
        finalLine.slice(0, -1);
    }

    lines[
      lines.length - 1
    ] = `${finalLine.trim()}…`;
  }

  const totalHeight =
    (lines.length - 1) *
    config.lineHeight;

  const initialY =
    config.y -
    totalHeight / 2;

  lines.forEach(
    (line, index) => {
      context.fillText(
        line,
        config.x,
        initialY +
          index *
            config.lineHeight,
        config.maxWidth
      );
    }
  );

  context.restore();
}

/*
  Convierte el Canvas en Blob.
*/
function canvasToBlob(
  canvas
) {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo generar la imagen."
              )
            );

            return;
          }

          resolve(blob);
        },
        "image/png",
        1
      );
    }
  );
}

/*
  Convierte el nombre en un nombre de archivo válido.
*/
function sanitizeBirthdayFileName(
  value
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .toLowerCase();
}

/*
  Comparte el PNG en celulares compatibles.
  Si no es posible, descarga la imagen.
*/
async function shareOrDownloadBirthdayImage(
  blob,
  name
) {
  const fileName =
    `feliz-cumpleanos-${sanitizeBirthdayFileName(
      name
    )}-pysc.png`;

  const file = new File(
    [blob],
    fileName,
    {
      type: "image/png"
    }
  );

  if (
    navigator.canShare &&
    navigator.canShare({
      files: [file]
    })
  ) {
    await navigator.share({
      title:
        `¡Feliz cumpleaños, ${name}!`,

      text:
        "Felicitación de Pasión y Sentimiento Cultural.",

      files: [file]
    });

    return;
  }

  const imageUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = imageUrl;
  link.download = fileName;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(
      imageUrl
    );
  }, 1000);
}

/*
  Genera la historia usando:
  plantilla + foto + nombre + mensaje.
*/
async function createBirthdayStoryImage() {
  const data =
    window.getCurrentBirthdayImageData?.();

  if (!data || !data.name) {
    if (storyStatusElement) {
      storyStatusElement.textContent =
        "Todavía no hay una felicitación disponible.";
    }

    return;
  }

  if (!storyDownloadButton) {
    console.error(
      "No se encontró el botón #birthdayDownload."
    );

    return;
  }

  storyDownloadButton.disabled = true;

  storyDownloadButton.innerHTML = `
    <i class="fa-solid fa-circle-notch fa-spin"></i>
    Creando imagen...
  `;

  if (storyStatusElement) {
    storyStatusElement.textContent = "";
  }

  try {
    await waitForCanvasFonts();

    const canvas = document.createElement("canvas");

    canvas.width = birthdayStoryConfig.width;
    canvas.height = birthdayStoryConfig.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "El navegador no permite generar la imagen."
      );
    }

    const template = await loadCanvasImage(
      birthdayStoryConfig.template
    );

    context.drawImage(
      template,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    if (data.photo) {
      const photo = await loadCanvasImage(
        data.photo
      );

      drawCircularPhoto(
        context,
        photo
      );
    }

    drawBirthdayName(
      context,
      data.name
    );

    drawBirthdayMessage(
      context,
      data.message
    );

    const imageBlob = await canvasToBlob(
      canvas
    );

    await shareOrDownloadBirthdayImage(
      imageBlob,
      data.name
    );

    if (storyStatusElement) {
      storyStatusElement.textContent =
        "Imagen creada correctamente.";
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);

      if (storyStatusElement) {
        storyStatusElement.textContent =
          "No se pudo crear la imagen. Revisa la plantilla y la fotografía.";
      }
    }
  } finally {
    storyDownloadButton.disabled = false;

    storyDownloadButton.innerHTML = `
      <i class="fa-solid fa-image"></i>
      Crear imagen para historias
    `;
  }
}

if (storyDownloadButton) {
  storyDownloadButton.addEventListener(
    "click",
    createBirthdayStoryImage
  );
}