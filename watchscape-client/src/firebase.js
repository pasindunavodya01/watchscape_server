// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAgFsBKhQsegX1fAhoOpXE2e1itgvYTrLw",
  authDomain: "watchscape-b7932.firebaseapp.com",
  projectId: "watchscape-b7932",
  storageBucket: "watchscape-b7932.appspot.com",
  messagingSenderId: "331344730098",
  appId: "1:331344730098:web:311e6b9a80cb91a3f87d6b",
  measurementId: "G-V70YRX5VEP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth };
