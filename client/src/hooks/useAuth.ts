import { useFirebaseAuth } from "./useFirebaseAuth";

export function useAuth() {
  const { user, loading: isLoading, token, getToken, refreshUserData } = useFirebaseAuth();

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    token,
    getToken,
    refreshUserData
  };
}
