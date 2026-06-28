// frontend/scripts/generate-firebase-config.js
// Generates public/firebase-config.js at build time so the service worker
// (which cannot access process.env) can initialize Firebase.
// Run automatically via the "prebuild" / "prestart" npm scripts.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const config = `// AUTO-GENERATED at build time by scripts/generate-firebase-config.js
// Do not edit by hand and do not commit this file (see .gitignore).
firebase.initializeApp({
  apiKey: "${process.env.REACT_APP_FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.REACT_APP_FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${process.env.REACT_APP_FIREBASE_APP_ID || ''}",
});
`;

const outputPath = path.join(__dirname, '../public/firebase-config.js');
fs.writeFileSync(outputPath, config);
console.log('Firebase config generated for service worker at', outputPath);
