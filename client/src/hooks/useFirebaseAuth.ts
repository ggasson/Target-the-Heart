// Firebase authentication hook to replace the Replit auth hook
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/firebase';

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
    let mounted = true;
    console.log('🚀 Setting up Firebase auth listener...');

    // Set up auth state listener 
    const unsubscribe = onAuthStateChange((firebaseUser: User | null) => {
      if (!mounted) return;
      
      if (firebaseUser) {
        console.log('✅ User authenticated:', firebaseUser.email);
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
        console.log('🔄 No user authenticated');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { user, loading };
}