import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import type { ProfileLayout } from "../../lib/profile-blocks/types";
import { ProfileService } from "../../services/profileService";

/**
 * Mutation hook for saving the current user's profile layout (block order /
 * enabled state). Updates the cached profile so blocks re-render immediately.
 */
export function useUpdateProfileLayout() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: ProfileLayout) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return ProfileService.updateProfile(user.id, { profile_layout: layout });
    },
    onSuccess: (profile) => {
      if (!user?.id) return;
      queryClient.setQueryData(queryKeys.userProfile.detail(user.id), profile);
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.root(user.id),
      });
    },
  });
}
