import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import { ProfileService } from "../../services/profileService";

/**
 * Mutation hook for uploading a profile avatar
 * Handles cache invalidation for user profile
 */
export function useUploadAvatar() {
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

      // Invalidate and refetch the user profile
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.detail(user.id),
      });

      // Force immediate refetch
      queryClient.refetchQueries({
        queryKey: queryKeys.userProfile.detail(user.id),
      });
    },
  });
}

/**
 * Mutation hook for updating user profile
 */
export function useUpdateProfile() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      name?: string;
      media_preferences?: {
        preferred_media?: ("Games" | "Movies" | "Books")[];
        onboarding_completed?: boolean;
      };
    }) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return ProfileService.updateProfile(user.id, updates);
    },
    onSuccess: () => {
      if (!user?.id) return;

      // Invalidate the user profile
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.detail(user.id),
      });
    },
  });
}
