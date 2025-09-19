// Firebase configuration and authentication setup
// This replaces the Replit authentication with Google OAuth via Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, signOut, onAuthStateChanged, GoogleAuthProvider, getRedirectResult, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Log Firebase configuration
console.log("Firebase Config Debug:", {
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Debug: Log successful Firebase initialization
console.log("Firebase initialized successfully");

// Google OAuth provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = () => {
  console.log("Attempting Google sign-in...");
  try {
    const result = signInWithRedirect(auth, googleProvider);
    console.log("Google sign-in redirect initiated");
    return result;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = () => {
  return signOut(auth);
};

// Handle redirect result (call this on app load)
export const handleRedirectResult = () => {
  return getRedirectResult(auth);
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};