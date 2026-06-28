import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import config from '../config';
import api from '../services/api';

let messagingInstance = null;

// Lazily initialize Firebase only if a valid config is present, and only once.
const getFirebaseMessaging = () => {
  if (!config.firebase.apiKey || !config.firebase.projectId) {
    return null;
  }
  if (!messagingInstance) {
    const app = getApps().length ? getApps()[0] : initializeApp(config.firebase);
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

export const useFCM = () => {
  const [permission, setPermission] = useState(false);
  const [token, setToken] = useState(null);

  const requestPermission = async () => {
    const messaging = getFirebaseMessaging();
    if (!messaging || !config.firebase.vapidKey) {
      console.warn('Firebase is not configured. Skipping push notification setup.');
      return;
    }

    try {
      const permissionStatus = await Notification.requestPermission();
      setPermission(permissionStatus === 'granted');

      if (permissionStatus === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: config.firebase.vapidKey,
        });

        if (currentToken) {
          setToken(currentToken);
          await api.post('/notifications/fcm-token', { fcmToken: currentToken });
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error.message);
    }
  };

  const onMessageListener = () => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return Promise.resolve(null);
    return new Promise((resolve) => {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    });
  };

  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      setPermission(true);
      getToken(messaging, { vapidKey: config.firebase.vapidKey })
        .then((currentToken) => {
          if (currentToken) setToken(currentToken);
        })
        .catch((error) => console.error('Error retrieving FCM token:', error.message));
    } else if (Notification.permission !== 'denied') {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { permission, token, requestPermission, onMessageListener };
};
