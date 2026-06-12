// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Prefer VITE-prefixed env vars (for Vite). Also support REACT_APP_* names as a fallback.
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Warn in development if critical env vars are missing (helps debugging without exposing secrets)
if (import.meta.env.DEV) {
  if (!firebaseConfig.apiKey) console.warn("VITE_FIREBASE_API_KEY / REACT_APP_FIREBASE_API_KEY is not set.");
  if (!firebaseConfig.authDomain) console.warn("VITE_FIREBASE_AUTH_DOMAIN / REACT_APP_FIREBASE_AUTH_DOMAIN is not set.");
  if (!firebaseConfig.projectId) console.warn("VITE_FIREBASE_PROJECT_ID / REACT_APP_FIREBASE_PROJECT_ID is not set.");
}

let app = null;
let auth = null;
let analytics = null;

// Initialize Firebase only when critical env vars are present to avoid runtime errors
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain && firebaseConfig.appId) {
  try {
    app = initializeApp(firebaseConfig);
    try {
      auth = getAuth(app);
    } catch (e) {
      console.warn("Firebase auth initialization failed:", e);
      auth = null;
    }

    try {
      if (typeof window !== "undefined" && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    } catch (e) {
      // analytics can fail in non-browser environments; ignore silently
      analytics = null;
    }
  } catch (e) {
    console.warn("Firebase initialization skipped due to error:", e);
    app = null;
    auth = null;
    analytics = null;
  }
} else {
  if (import.meta.env.DEV) {
    console.warn("Firebase not initialized: missing VITE_FIREBASE_* or REACT_APP_FIREBASE_* environment variables.");
  }
}

export { auth, analytics };
