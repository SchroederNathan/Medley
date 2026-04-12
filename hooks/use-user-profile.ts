import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { userProfileQueryOptions } from "../lib/query-options";
import { useUploadAvatar } from "./mutations/use-upload-avatar";
import { Profile } from "../services/profileService";

/**
 * Hook for fetching the current user's profile
 */
export function useUserProfile() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<Profile | null>({
    ...userProfileQueryOptions(user?.id ?? ""),
    enabled: isLoggedIn && !!user?.id,
  });
}

/**
 * Hook for fetching a user profile by ID
 * Useful for displaying other users' profiles
 */
export function useUserProfileById(userId?: string) {
  return useQuery<Profile | null>({
    ...userProfileQueryOptions(userId ?? ""),
    enabled: !!userId,
  });
}

/**
 * Hook for uploading profile images
 * Returns a mutation that can be used to upload a profile image
 * @deprecated Use useUploadAvatar from hooks/mutations instead
 */
export function useUploadProfileImage() {
  return useUploadAvatar();
}

/**
 * Hook for prefetching user profile
 */
export function usePrefetchUserProfile() {
  const { user, isLoggedIn } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const prefetchProfile = async () => {
    if (isLoggedIn && user?.id) {
      await queryClient.prefetchQuery(userProfileQueryOptions(user.id));
    }
  };

  return { prefetchProfile };
}
