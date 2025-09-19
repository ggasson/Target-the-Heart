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
    let mounted = true;

    // Set up auth state listener first
    const unsubscribe = onAuthStateChange((firebaseUser: User | null) => {
      if (!mounted) return;
      
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

    // Handle redirect result (for OAuth returns)
    console.log('🚀 Starting redirect result check...');
    handleRedirectResult()
      .then((result) => {
        if (!mounted) return;
        
        if (result?.user) {
          console.log('✅ OAuth redirect successful!', {
            email: result.user.email,
            displayName: result.user.displayName,
            uid: result.user.uid
          });
        } else {
          console.log('🔄 No OAuth redirect result (direct page load)');
        }
      })
      .catch((error) => {
        console.error('❌ OAuth redirect error:', error);
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { user, loading };
}