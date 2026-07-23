import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getMessaging,
  getToken,
  isSupported
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyC28HBU7cdTWoheMO5-QTw2Wo2sEe7ww-Q",
  authDomain: "pysc-web.firebaseapp.com",
  projectId: "pysc-web",
  storageBucket: "pysc-web.firebasestorage.app",
  messagingSenderId: "303778740151",
  appId: "1:303778740151:web:3ece8d0762843783981a32"
};

/*
  Coloca aquí la nueva clave pública
  que aparece en Firebase.
*/
const vapidKey =
  "BGdlHDCrZBY3AHLIh4oPamVXZqTh5s5YoyTmoVVmFAH6MruJGQFf4i_NdRvNq58GSdFbBaT4HZfQxrdxx51vVik";

const tokenRegistrationUrl =
  "https://script.google.com/macros/s/AKfycbzsZC3ntbE28yjN8_Bh724yBk-qkwcSOZWpq8ZqKPfsL_wb5KiK07RHIa-GVQTgDJFd/exec";

const firebaseApp =
  initializeApp(firebaseConfig);

function detectBrowser() {
  const userAgent =
    navigator.userAgent;

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  if (
    userAgent.includes("CriOS") ||
    userAgent.includes("Chrome")
  ) {
    return "Chrome";
  }

  if (
    userAgent.includes("Safari") &&
    !userAgent.includes("Chrome")
  ) {
    return "Safari";
  }

  return "Otro";
}

function detectOperatingSystem() {
  const userAgent =
    navigator.userAgent;

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iOS";
  }

  if (/Windows/i.test(userAgent)) {
    return "Windows";
  }

  if (/Macintosh|Mac OS/i.test(userAgent)) {
    return "macOS";
  }

  if (/Linux/i.test(userAgent)) {
    return "Linux";
  }

  return "Otro";
}

async function saveToken(token) {
  await fetch(tokenRegistrationUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "registerToken",
      token: token,
      browser: detectBrowser(),
      operatingSystem:
        detectOperatingSystem()
    })
  });
}

export async function activateNotifications() {
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    throw new Error(
      "Este navegador no admite notificaciones."
    );
  }

  const messagingSupported =
    await isSupported();

  if (!messagingSupported) {
    throw new Error(
      "Firebase Messaging no está disponible en este navegador."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "El permiso de notificaciones no fue concedido."
    );
  }

  const serviceWorkerRegistration =
    await navigator.serviceWorker.ready;

  const messaging =
    getMessaging(firebaseApp);

  const token =
    await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration
    });

  if (!token) {
    throw new Error(
        "No se pudo generar el identificador del dispositivo."
    );
  }

  await saveToken(token);

  console.log(
    "Dispositivo enviado para su registro."
  );

  return token;
}