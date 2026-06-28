// This file must be in the public folder.
// Service workers cannot access process.env, so the Firebase config is
// injected at build time into /firebase-config.js (see scripts/generate-firebase-config.js).
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Generated at build time - calls firebase.initializeApp({...}) with real values
importScripts('/firebase-config.js');

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title;
  if (!notificationTitle) return;

  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.ico',
    data: payload.data,
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
