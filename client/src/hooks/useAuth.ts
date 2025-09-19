import { useFirebaseAuth } from "./useFirebaseAuth";

export function useAuth() {
  const { user, loading: isLoading, token, getToken } = useFirebaseAuth();

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    token,
    getToken
  };
}
