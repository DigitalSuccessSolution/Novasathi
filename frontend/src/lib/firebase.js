import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDQSawfpKEN6xZyJDO46Uux2p3X56VcsyA",
  authDomain: "nova-sathi.firebaseapp.com",
  projectId: "nova-sathi",
  storageBucket: "nova-sathi.firebasestorage.app",
  messagingSenderId: "968633028070",
  appId: "1:968633028070:web:4087f6446500045f1ada27",
  measurementId: "G-ZS8MF7F4EC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('Firebase messaging not supported in this browser');
}

/**
 * Request push notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
    });

    return token;
  } catch (err) {
    console.error('FCM token error:', err);
    return null;
  }
};

/**
 * Listen for foreground push notifications
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export { app, messaging, auth };
