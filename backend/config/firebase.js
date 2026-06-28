// backend/config/firebase.js
// Firebase Admin SDK initialized from environment variables only.
// No service account JSON file is read or required - this allows the app
// to run on Railway (or any host) where that file cannot be committed.
const admin = require('firebase-admin');
const config = require('./index');

if (!admin.apps.length) {
  const { projectId, clientEmail, privateKey } = config.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase credentials not configured. Push notifications will be disabled.');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
}

const isFirebaseReady = () => admin.apps.length > 0;

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!isFirebaseReady() || !fcmToken) return null;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: { ...data, timestamp: new Date().toISOString() },
    };
    return await admin.messaging().send(message);
  } catch (error) {
    console.error('Failed to send push notification:', error.message);
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      return { invalidToken: true };
    }
    return null;
  }
};

const broadcastToRole = async (role, title, body, data = {}, excludeUserId = null) => {
  if (!isFirebaseReady()) return [];
  const User = require('../models/User.model');
  const users = await User.find({
    role,
    fcmToken: { $ne: null, $exists: true },
    ...(excludeUserId && { _id: { $ne: excludeUserId } }),
  });
  const tokens = users.map((u) => u.fcmToken).filter(Boolean);
  if (!tokens.length) return [];
  try {
    const response = await admin.messaging().sendEach(
      tokens.map((token) => ({ token, notification: { title, body }, data }))
    );
    return response.responses;
  } catch (error) {
    console.error('Failed to broadcast notification:', error.message);
    return [];
  }
};

module.exports = { admin, sendPushNotification, broadcastToRole, isFirebaseReady };
