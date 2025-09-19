// Firebase authentication hook to replace the Replit auth hook
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChange, handleRedirectResult } from '@/lib/firebase';

interface FirebaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result first
    handleRedirectResult()
      .then((result) => {
        if (result?.user) {
          console.log('Google sign-in successful:', result.user);
        }
      })
      .catch((error) => {
        console.error('Google sign-in error:', error);
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((firebaseUser: User | null) => {
      if (firebaseUser) {
        // Convert Firebase user to our app user format
        const appUser: FirebaseUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          avatar: firebaseUser.photoURL || undefined,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}