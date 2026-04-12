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
    onSuccess: (avatarUrl) => {
      if (!user?.id) return;

      queryClient.setQueryData(
        queryKeys.userProfile.detail(user.id),
        (currentProfile: { avatar_url?: string } | null | undefined) =>
          currentProfile
            ? { ...currentProfile, avatar_url: avatarUrl }
            : currentProfile
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.root(user.id),
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
    onSuccess: (profile) => {
      if (!user?.id) return;

      queryClient.setQueryData(queryKeys.userProfile.detail(user.id), profile);
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.root(user.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.media.preferredRoot(user.id),
      });
    },
  });
}
