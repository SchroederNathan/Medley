import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { Profile, ProfileService } from "../services/profileService";

/**
 * Hook for fetching the current user's profile
 */
export function useUserProfile() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<Profile | null>({
    queryKey: queryKeys.userProfile.detail(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      return ProfileService.getProfile(user.id);
    },
    enabled: isLoggedIn && !!user?.id,
    // Longer stale time because profiles rarely change
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching a user profile by ID
 * Useful for displaying other users' profiles
 */
export function useUserProfileById(userId?: string) {
  return useQuery<Profile | null>({
    queryKey: queryKeys.userProfile.detail(userId ?? ""),
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      return ProfileService.getProfile(userId);
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
 * @deprecated Use useUploadAvatar from hooks/mutations instead
 */
export function useUploadProfileImage() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return ProfileService.uploadAvatar(user.id, imageUri);
    },
    onSuccess: () => {
      if (!user?.id) return;
      // Invalidate and refetch the user profile to get the updated avatar_url
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.detail(user.id),
      });
    },
  });
}

/**
 * Hook for prefetching user profile
 */
export function usePrefetchUserProfile() {
  const { user, isLoggedIn } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const prefetchProfile = async () => {
    if (isLoggedIn && user?.id) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.userProfile.detail(user.id),
        queryFn: () => ProfileService.getProfile(user.id!),
        staleTime: 1000 * 60 * 30,
      });
    }
  };

  return { prefetchProfile };
}
