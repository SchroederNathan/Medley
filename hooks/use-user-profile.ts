import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";

export function useUserProfile() {
  const { user, isLoggedIn, fetchUserProfile } = useContext(AuthContext);

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

/**
 * Hook for uploading profile images
 * Returns a mutation that can be used to upload a profile image
 */
export function useUploadProfileImage() {
  const { uploadProfileImage, user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File | Blob) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return uploadProfileImage(file);
    },
    onSuccess: () => {
      // Invalidate and refetch the user profile to get the updated avatar_url
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user?.id],
      });
    },
  });
}

// Hook for prefetching user profile (useful for loading screens)
export function usePrefetchUserProfile() {
  const { user, isLoggedIn } = useContext(AuthContext);

  const prefetchProfile = () => {
    if (isLoggedIn && user?.id) {
      // This would typically be used with queryClient.prefetchQuery
      // but we'll implement it when the queryClient is available
    }
  };

  return { prefetchProfile };
}
