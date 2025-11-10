import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { supabase } from "../lib/utils";

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
 * Hook to fetch a user profile by ID
 * Useful for displaying other users' profiles
 */
export function useUserProfileById(userId?: string) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!userId,
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
    mutationFn: async (imageUri: string) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return uploadProfileImage(imageUri);
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
