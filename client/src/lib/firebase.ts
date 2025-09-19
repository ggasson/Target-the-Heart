// Firebase configuration and authentication setup
// This replaces the Replit authentication with Google OAuth via Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, GoogleAuthProvider, User, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile } from "firebase/auth";

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

// Sign in with Google using popup (avoids sessionStorage issues)
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

// Get redirect result for Google sign-in
export const getGoogleRedirectResult = () => {
  return getRedirectResult(auth);
};

// Sign out
export const signOutUser = () => {
  return signOut(auth);
};

// Email/Password Authentication
export const signUpWithEmail = async (email: string, password: string, firstName?: string, lastName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with name if provided
    if (firstName || lastName) {
      await updateProfile(user, {
        displayName: `${firstName || ''} ${lastName || ''}`.trim()
      });
    }
    
    // Send email verification
    await sendEmailVerification(user);
    
    return { user, emailSent: true };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const resendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error: any) {
    console.error('Resend verification error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};