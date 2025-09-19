import { useFirebaseAuth } from "./useFirebaseAuth";

export function useAuth() {
  const { user, loading: isLoading } = useFirebaseAuth();

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
