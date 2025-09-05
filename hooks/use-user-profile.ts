import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";

export function useUserProfile() {
  const { user, isLoggedIn, fetchUserProfile } = useContext(AuthContext);
  console.log(user?.id);

  return useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () =>
      user?.id ? fetchUserProfile(user.id) : Promise.reject("No user ID"),
    enabled: isLoggedIn && !!user?.id,
    // Longer stale time because profiles rarely change
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Hook for prefetching user profile (useful for loading screens)
export function usePrefetchUserProfile() {
  const { user, isLoggedIn, fetchUserProfile } = useContext(AuthContext);

  const prefetchProfile = () => {
    if (isLoggedIn && user?.id) {
      // This would typically be used with queryClient.prefetchQuery
      // but we'll implement it when the queryClient is available
    }
  };

  return { prefetchProfile };
}
