// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBUhq707Esl0fIpuLJBG0DpBbRxXe14_uo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vidyaai-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vidyaai-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vidyaai-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "872319959539",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:872319959539:web:1cdb67b9e269a88ca9d286",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-G3YGF6WKSW"
};



// Check if we have valid Firebase config
const isValidConfig = firebaseConfig.apiKey !== "demo-api-key";

let app, auth, googleProvider, db;

try {
  if (isValidConfig) {
    // Initialize Firebase with real config
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  } else {
    // For demo purposes, create mock objects
    console.warn("Using demo Firebase config. Replace with your actual Firebase configuration.");
    auth = null;
    googleProvider = null;
    db = null;
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  auth = null;
  googleProvider = null;
  db = null;
}

export { auth, googleProvider, db };
export default app;