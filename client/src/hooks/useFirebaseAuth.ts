// Firebase authentication hook to replace the Replit auth hook
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

interface FirebaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  profileImageUrl?: string;
  birthday?: string;
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
      
      console.log('🔄 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      
      if (firebaseUser) {
        // Get the ID token for API requests
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          console.log('🔑 ID token obtained for:', firebaseUser.email);
        } catch (error) {
          console.error('❌ Error getting ID token:', error);
        }
        
               // Fetch complete user data from our API
               try {
                 const response = await apiRequest('GET', '/api/auth/user');
                 const userData = await response.json() as unknown as FirebaseUser;
                 setUser(userData);
                 console.log('👤 User state set from API:', userData.email);
               } catch (error) {
          console.error('❌ Error fetching user data:', error);
          // Fallback to Firebase user data if API fails
          const appUser: FirebaseUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            avatar: firebaseUser.photoURL || undefined,
          };
          setUser(appUser);
          console.log('👤 User state set from Firebase fallback:', appUser.email);
        }
      } else {
        setUser(null);
        setToken(null);
        console.log('🚪 User logged out - clearing state');
      }
      setLoading(false);
      console.log('✅ Auth loading complete');
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

        // Function to refresh user data from API
        const refreshUserData = async () => {
          if (auth.currentUser) {
            try {
              const response = await apiRequest('GET', '/api/auth/user');
              const userData = await response.json() as unknown as FirebaseUser;
              setUser(userData);
              console.log('👤 User data refreshed:', userData.email);
            } catch (error) {
              console.error('❌ Error refreshing user data:', error);
            }
          }
        };

  return { user, loading, token, getToken, refreshUserData };
}