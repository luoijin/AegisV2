// frontend/src/config/index.js
// Single source of truth for all frontend configuration.
// All env-driven values should be read from here, not from process.env directly
// in component/service code.

const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  socketUrl: process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000',
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
  },
};

export default config;
