/* =========================
   FIREBASE CLOUD MESSAGING
========================= */

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyC28HBU7cdTWoheMO5-QTw2Wo2sEe7ww-Q",
  authDomain: "pysc-web.firebaseapp.com",
  projectId: "pysc-web",
  storageBucket: "pysc-web.firebasestorage.app",
  messagingSenderId: "303778740151",
  appId: "1:303778740151:web:3ece8d0762843783981a32"
});

const messaging = firebase.messaging();

/* =========================
   CICLO DEL SERVICE WORKER
========================= */

self.addEventListener("install", () => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");

  event.waitUntil(
    self.clients.claim()
  );
});