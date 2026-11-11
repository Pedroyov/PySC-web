/**
 * PySC Awards 2026 – Pre-evaluación de nominados
 * ------------------------------------------------
 * Crea el Google Form completo + su hoja de respuestas.
 *
 * CÓMO USARLO
 * 1. Entra a https://script.google.com  →  "Nuevo proyecto".
 * 2. Borra lo que aparece y pega TODO este código.
 * 3. Arriba, elige la función "crearFormulario" y pulsa "Ejecutar".
 * 4. La primera vez Google pedirá permisos: "Revisar permisos" → tu cuenta →
 *    "Configuración avanzada" → "Ir a proyecto (no seguro)" → "Permitir".
 * 5. Abre "Registro de ejecución": ahí salen los enlaces del formulario,
 *    del enlace para compartir y de la hoja de respuestas.
 *
 * PARA ELEGIR CATEGORÍAS
 * Cambia  activa: true / false  en cada categoría (las opcionales vienen en false).
 *
 * EVIDENCIA (foto o video)
 *  - evidencia: "archivo" → agrega una pregunta para la foto o video.
 *  - evidencia: "enlace"  → agrega una pregunta que solo acepta enlaces (TikTok, Drive...).
 *  - evidencia: ""        → sin evidencia.
 * Google no permite crear preguntas de "Subir archivo" por código. Por eso el
 * script las crea como respuesta corta con el texto [CAMBIAR A SUBIR ARCHIVO].
 * Luego, en el formulario, cambia el tipo de esas preguntas a "Subir archivo"
 * (son pocos clics). Si prefieres no hacerlo, déjalas así: la gente pegará un
 * enlace de Drive o Google Fotos.
 */

const CONFIG = {
  titulo: "PySC Awards 2026 – Pre-evaluación de nominados",

  descripcion:
    "¡Llegaron los PySC Awards 2026! Este año celebramos 17 años y queremos que tú propongas a los nominados.\n\n" +
    "• En cada categoría escribe hasta 3 nombres, separados por comas.\n" +
    "• Si no se te ocurre nadie, déjala en blanco.\n" +
    "• En algunas categorías puedes enviar una foto o video como prueba (opcional).\n\n" +
    "Tus respuestas son confidenciales: solo las verá la organización. " +
    "Con todas las propuestas elegiremos a los finalistas de cada categoría.",

  confirmacion:
    "¡Gracias por participar! Pronto anunciaremos a los finalistas de los PySC Awards 2026.",

  textoNombres: "Escribe hasta 3 nombres, separados por comas."
};

/* =========================================================
   CATEGORÍAS
   ========================================================= */

const MAYORES = [
  { nombre: "La Danzante 2026", activa: true, evidencia: "",
    desc: "La bailarina que más destacó este año por su talento, disciplina, constancia y entrega en ensayos y presentaciones." },
  { nombre: "El Danzante 2026", activa: true, evidencia: "",
    desc: "El bailarín que más destacó este año por su talento, técnica, expresión, disciplina y compromiso." },
  { nombre: "Estrella en Ascenso", activa: true, evidencia: "",
    desc: "Quien más ha crecido este año gracias a su esfuerzo, disciplina y ganas de superarse." },
  { nombre: "El Jale del Año", activa: true, evidencia: "",
    desc: "La mejor incorporación del año: llegó, se adaptó rápido y se volvió un gran refuerzo." },

  // ----- Opcionales -----
  { nombre: "El Corazón PySC", activa: false, evidencia: "",
    desc: "Quien vive el grupo como su familia: siempre presente, leal y comprometido, en las buenas y en las malas." },
  { nombre: "El Profe del Año", activa: false, evidencia: "",
    desc: "Quien más ayuda a enseñar pasos y coreografías a los demás, con paciencia." },
  { nombre: "El Espíritu Folklórico", activa: false, evidencia: "",
    desc: "Quien mejor transmite el sentimiento y la identidad de cada danza en escena." }
];

const DEL_ANIO = [
  { nombre: "La Risa Más Contagiosa", activa: true, evidencia: "archivo",
    desc: "Esa risa imposible de ignorar que termina haciendo reír a todos." },
  { nombre: "El Maestro de Caídas", activa: true, evidencia: "archivo",
    desc: "Quien tuvo la caída más memorable del año." },
  { nombre: "El Fuera de Tiempo", activa: true, evidencia: "archivo",
    desc: "Quien a veces baila con su propio conteo: se adelanta, se atrasa o se pierde en la coreografía." },
  { nombre: "El Soñador", activa: true, evidencia: "archivo",
    desc: "Quien se queda dormido en cualquier momento y lugar." },
  { nombre: "El Buen Diente", activa: true, evidencia: "archivo",
    desc: "Quien nunca le dice que no a la comida." },
  { nombre: "El Despistado", activa: true, evidencia: "",
    desc: "Quien siempre olvida algo: una prenda, un accesorio, un encargo…" },
  { nombre: "El Turista Folclórico", activa: true, evidencia: "",
    desc: "Quien aparece de vez en cuando, pero vuelve como si nunca se hubiera ido." },
  { nombre: "El Alocado / La Alocada", activa: true, evidencia: "archivo",
    desc: "Quien tiene la energía al máximo y las ocurrencias que nadie ve venir." },
  { nombre: "El Angelito", activa: true, evidencia: "",
    desc: "La carita de \"yo no fui\"… o eso quiere hacernos creer." },
  { nombre: "El Más Chamba", activa: true, evidencia: "",
    desc: "Quien siempre pone manos a la obra por PySC: organiza, carga, prepara y ayuda." },
  { nombre: "El Sticker del Año", activa: true, evidencia: "archivo",
    desc: "¿De quién es la cara o el gesto que más usamos como sticker en el grupo? Si puedes, sube el sticker." },
  { nombre: "TikTok – Entretenimiento del Año", activa: true, evidencia: "enlace",
    desc: "¿Quiénes salieron en los TikToks más divertidos del año?" },
  { nombre: "TikTok con Propósito", activa: true, evidencia: "enlace",
    desc: "¿Quiénes hicieron TikToks que enseñan o dejan un mensaje sobre nuestras danzas, Catacaos o nuestra cultura?" },
  { nombre: "La Hora PySC", activa: true, evidencia: "archivo",
    desc: "Quien siempre llega tarde… pero llega. Si tienes la captura del \"ya estoy saliendo\", súbela." },

  // ----- Opcionales -----
  { nombre: "Los Inseparables del Año", activa: false, evidencia: "archivo",
    desc: "Los que siempre andan juntos: es difícil ver a uno sin los demás." },
  { nombre: "El Más Fashion", activa: false, evidencia: "archivo",
    desc: "Quien siempre sorprende con su estilo y sus nuevos looks." },
  { nombre: "El Más Enojón", activa: false, evidencia: "",
    desc: "Quien tiene poca paciencia y cuyos reniegos ya son parte de las anécdotas." },
  { nombre: "Los Guapeadores", activa: false, evidencia: "archivo",
    desc: "Quienes levantan cada presentación con sus guapeos y gritos de energía." },
  { nombre: "Silencio que Inspira", activa: false, evidencia: "",
    desc: "Quien es de los más callados del grupo, pero poco a poco muestra su personalidad." },
  { nombre: "El Alma de la Fiesta", activa: false, evidencia: "archivo",
    desc: "Quien prende cualquier reunión: primero en bailar y último en irse." },
  { nombre: "El Fotógrafo Oficial", activa: false, evidencia: "",
    desc: "Quien siempre está grabando o tomando fotos; gracias a él tenemos recuerdos de todo." },
  { nombre: "El Informante", activa: false, evidencia: "",
    desc: "Quien siempre sabe todo lo que pasa en el grupo antes que nadie." },
  { nombre: "El Dramático / La Dramática", activa: false, evidencia: "archivo",
    desc: "Quien vive todo con intensidad de telenovela, desde una ampolla hasta un cambio de coreografía." },
  { nombre: "Manos de Oro", activa: false, evidencia: "",
    desc: "Quien siempre ayuda a peinar, maquillar o arreglar el vestuario de los demás." },
  { nombre: "El Cantante del Bus", activa: false, evidencia: "archivo",
    desc: "Quien pone la música y el karaoke en cada viaje." },
  { nombre: "El Mejor Compañero de Viaje", activa: false, evidencia: "",
    desc: "Con quien todos quieren sentarse o compartir cuarto en los viajes." },
  { nombre: "El Puntual", activa: false, evidencia: "",
    desc: "Quien siempre llega primero a ensayos y presentaciones." }
];

/* =========================================================
   CREAR FORMULARIO
   ========================================================= */

function crearFormulario() {
  const form = FormApp.create(CONFIG.titulo);

  form
    .setTitle(CONFIG.titulo)
    .setDescription(CONFIG.descripcion)
    .setConfirmationMessage(CONFIG.confirmacion)
    .setProgressBar(true)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setAcceptingResponses(true);

  // Sección 1 – Datos
  form
    .addTextItem()
    .setTitle("Tu nombre")
    .setHelpText("Solo lo usamos para evitar respuestas repetidas. No se publica.")
    .setRequired(true);

  // Sección 2 – Premios mayores
  agregarSeccion(
    form,
    "Premios mayores",
    "Los reconocimientos al talento, la disciplina y el compromiso de este año.",
    MAYORES
  );

  // Sección 3 – Premios del año
  agregarSeccion(
    form,
    "Premios del año",
    "Las categorías más divertidas. Todo con cariño y buen humor.",
    DEL_ANIO
  );

  // Hoja de respuestas
  const hoja = SpreadsheetApp.create(CONFIG.titulo + " (respuestas)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  // Los formularios nuevos pueden crearse sin publicar
  if (typeof form.setPublished === "function") {
    form.setPublished(true);
  }

  const pendientes = contarPendientes();

  Logger.log("✅ Formulario creado");
  Logger.log("Editar:      " + form.getEditUrl());
  Logger.log("Compartir:   " + form.getPublishedUrl());
  Logger.log("Respuestas:  " + hoja.getUrl());

  if (pendientes > 0) {
    Logger.log(
      "⚠️ Hay " + pendientes + " preguntas marcadas [CAMBIAR A SUBIR ARCHIVO]. " +
      "Ábrelas en el editor y cambia su tipo a \"Subir archivo\"."
    );
  }
}

function agregarSeccion(form, titulo, ayuda, categorias) {
  const activas = categorias.filter((c) => c.activa);

  if (activas.length === 0) {
    return;
  }

  form.addPageBreakItem().setTitle(titulo).setHelpText(ayuda);

  activas.forEach((categoria) => {
    form
      .addTextItem()
      .setTitle(categoria.nombre)
      .setHelpText(categoria.desc + " " + CONFIG.textoNombres);

    if (categoria.evidencia === "archivo") {
      form
        .addTextItem()
        .setTitle("[CAMBIAR A SUBIR ARCHIVO] Foto o video – " + categoria.nombre)
        .setHelpText("Opcional. Sube una foto o video como prueba.");
    }

    if (categoria.evidencia === "enlace") {
      const soloEnlaces = FormApp.createTextValidation()
        .requireTextIsUrl()
        .setHelpText("Pega un enlace válido (por ejemplo, https://www.tiktok.com/...).")
        .build();

      form
        .addTextItem()
        .setTitle("Enlace del TikTok – " + categoria.nombre)
        .setHelpText("Opcional. Copia el enlace del TikTok y pégalo aquí.")
        .setValidation(soloEnlaces);
    }
  });
}

function contarPendientes() {
  return MAYORES.concat(DEL_ANIO).filter(
    (c) => c.activa && c.evidencia === "archivo"
  ).length;
}
