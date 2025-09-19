// Firebase authentication hook to replace the Replit auth hook
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, auth } from '@/lib/firebase';

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
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener 
    const unsubscribe = onAuthStateChange(async (firebaseUser: User | null) => {
      if (!mounted) return;
      
      if (firebaseUser) {
        // Get the ID token for API requests
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
        
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
        setToken(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Function to get fresh token for API requests
  const getToken = async () => {
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken(true); // Force refresh
      } catch (error) {
        console.error('Error getting fresh token:', error);
        return null;
      }
    }
    return null;
  };

  return { user, loading, token, getToken };
}