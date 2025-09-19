// Firebase configuration and authentication setup
// This replaces the Replit authentication with Google OAuth via Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, signOut, onAuthStateChanged, GoogleAuthProvider, getRedirectResult, User, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set up auth persistence to local storage (survives browser sessions)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Google OAuth provider
const googleProvider = new GoogleAuthProvider();
// Set custom parameters to ensure we get the user's full profile
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
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