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

const firebaseApp =
  initializeApp(firebaseConfig);

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

  console.log(
    "Token FCM del dispositivo:",
    token
  );

  return token;
}