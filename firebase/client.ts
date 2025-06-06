import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCoPYeP8cQEX7sH9rMU8BtszvLcJC5nq0o",
  authDomain: "prepwise-560b3.firebaseapp.com",
  projectId: "prepwise-560b3",
  storageBucket: "prepwise-560b3.firebasestorage.app",
  messagingSenderId: "670758206941",
  appId: "1:670758206941:web:62ba79cd5e0e7d7be44a34",
  measurementId: "G-1XQZYXGEB3",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
