/* =========================
   ANIVERSARIO PySC
   - Se activa solo en octubre (hora de Perú).
   - Vista previa en cualquier fecha: agrega ?aniversario=1 a la URL.
   - Para desactivarlo: cambia ENABLED a false.
========================= */

(function () {
  const ENABLED = true;

  const FOUNDATION_YEAR = 2009;
  const ANNIVERSARY_MONTH = 9; // 0 = enero, 9 = octubre
  const ANNIVERSARY_DAY = 17;

  const params = new URLSearchParams(window.location.search);
  const forcePreview = params.get("aniversario") === "1";

  // Fecha actual en hora de Perú (UTC-5, sin horario de verano)
  function nowInPeru() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc - 5 * 3600000);
  }

  const peruNow = nowInPeru();
  const year = peruNow.getFullYear();
  const isOctober = peruNow.getMonth() === ANNIVERSARY_MONTH;

  if (!ENABLED || (!isOctober && !forcePreview)) return;

  const years = year - FOUNDATION_YEAR;

  // Momento exacto del aniversario: 17 de octubre 00:00 hora de Perú (05:00 UTC)
  const anniversaryUTC = Date.UTC(year, ANNIVERSARY_MONTH, ANNIVERSARY_DAY, 5, 0, 0);
  const anniversaryEndUTC = anniversaryUTC + 24 * 3600000;

  document.documentElement.classList.add("pysc-aniversario");

  /* ---------- Sello "17 años" junto al logo ---------- */

  function addLogoSeal() {
    const brand = document.querySelector(".site-header .brand");
    if (!brand || brand.querySelector(".aniv-seal")) return;

    const seal = document.createElement("span");
    seal.className = "aniv-seal";
    seal.setAttribute("aria-label", years + " años");
    seal.innerHTML = "<strong>" + years + "</strong><small>años</small>";
    brand.appendChild(seal);
  }

  /* ---------- Banner con cuenta regresiva (solo inicio) ---------- */

  function buildBanner() {
    const heroContent = document.querySelector(".hero .hero-content");
    if (!heroContent || document.getElementById("anivBanner")) return;

    const banner = document.createElement("div");
    banner.className = "aniv-banner";
    banner.id = "anivBanner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Aniversario " + years + " años");

    banner.innerHTML =
      '<div class="aniv-banner-badge" aria-hidden="true">' +
        '<span class="aniv-banner-number">' + years + "</span>" +
        '<span class="aniv-banner-years">años</span>' +
      "</div>" +
      '<div class="aniv-banner-body">' +
        '<span class="aniv-banner-kicker">' + FOUNDATION_YEAR + " – " + year + "</span>" +
        '<p class="aniv-banner-title" id="anivTitle"></p>' +
        '<div class="aniv-countdown" id="anivCountdown" aria-live="polite">' +
          unit("anivDays", "días") +
          unit("anivHours", "horas") +
          unit("anivMinutes", "min") +
          unit("anivSeconds", "seg") +
        "</div>" +
      "</div>";

    heroContent.appendChild(banner);

    const title = banner.querySelector("#anivTitle");
    const countdown = banner.querySelector("#anivCountdown");
    const els = {
      d: banner.querySelector("#anivDays"),
      h: banner.querySelector("#anivHours"),
      m: banner.querySelector("#anivMinutes"),
      s: banner.querySelector("#anivSeconds")
    };

    let timer = null;

    function tick() {
      const now = Date.now();

      if (now >= anniversaryEndUTC) {
        title.textContent = "¡Gracias por " + years + " años de pasión y sentimiento!";
        countdown.hidden = true;
        clearInterval(timer);
        return;
      }

      if (now >= anniversaryUTC) {
        title.textContent = "¡Hoy cumplimos " + years + " años! Feliz aniversario";
        countdown.hidden = true;
        banner.classList.add("is-today");
        clearInterval(timer);
        return;
      }

      title.textContent = "Faltan pocos días para celebrar nuestro aniversario";

      const diff = anniversaryUTC - now;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      els.d.textContent = d;
      els.h.textContent = pad(h);
      els.m.textContent = pad(m);
      els.s.textContent = pad(s);
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  function unit(id, label) {
    return (
      '<div class="aniv-unit">' +
        '<span class="aniv-unit-value" id="' + id + '">0</span>' +
        '<span class="aniv-unit-label">' + label + "</span>" +
      "</div>"
    );
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* ---------- Confeti (una vez por visitante, o siempre el día 17) ---------- */

  function shouldShowConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

    const isTheDay = Date.now() >= anniversaryUTC && Date.now() < anniversaryEndUTC;
    const key = "pyscAnivConfetti" + year;

    try {
      if (isTheDay || forcePreview) return true;
      if (localStorage.getItem(key)) return false;
      localStorage.setItem(key, "1");
      return true;
    } catch (e) {
      return true;
    }
  }

  function launchConfetti() {
    const canvas = document.createElement("canvas");
    canvas.className = "aniv-confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let w, h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const colors = ["#8C1832", "#e2aa16", "#F2D170", "#132F5D", "#ffffff"];
    const count = w < 600 ? 90 : 160;
    const pieces = [];

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.6,
        size: 6 + Math.random() * 7,
        color: colors[i % colors.length],
        vy: 2 + Math.random() * 3,
        vx: -1.2 + Math.random() * 2.4,
        rot: Math.random() * Math.PI,
        vr: -0.15 + Math.random() * 0.3,
        wobble: Math.random() * 10
      });
    }

    const duration = 4500;
    const start = performance.now();

    function frame(t) {
      const elapsed = t - start;
      ctx.clearRect(0, 0, w, h);

      const fade = elapsed > duration - 1000 ? Math.max(0, (duration - elapsed) / 1000) : 1;
      ctx.globalAlpha = fade;

      pieces.forEach(function (p) {
        p.y += p.vy;
        p.x += p.vx + Math.sin((p.y + p.wobble) / 30);
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener("resize", resize);
        canvas.remove();
      }
    }

    requestAnimationFrame(frame);
  }

  function init() {
    addLogoSeal();
    buildBanner();
    if (shouldShowConfetti()) setTimeout(launchConfetti, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
