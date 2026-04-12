import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import {
  UserMediaService,
  UserMediaStatus,
} from "../../services/userMediaService";

interface AddToLibraryParams {
  mediaId: string;
  status?: UserMediaStatus;
  rating?: number;
}

/**
 * Mutation hook for adding media to user's library
 * Handles cache invalidation for user media and recommendations
 */
export function useAddToLibrary() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      status = "want",
      rating,
    }: AddToLibraryParams) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return UserMediaService.addToUserList(user.id, mediaId, status, rating);
    },
    onSuccess: (userMediaItem, { mediaId }) => {
      if (!user?.id) return;

      queryClient.setQueryData(
        queryKeys.userMediaItem.detail(user.id, mediaId),
        userMediaItem
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.userMedia.root(user.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.root(user.id),
      });
    },
  });
}

/**
 * Mutation hook for removing media from user's library
 */
export function useRemoveFromLibrary() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return UserMediaService.removeFromUserList(user.id, mediaId);
    },
    onSuccess: (_, mediaId) => {
      if (!user?.id) return;

      queryClient.setQueryData(
        queryKeys.userMediaItem.detail(user.id, mediaId),
        null
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.userMedia.root(user.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.userReviews.root(user.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.root(user.id),
      });
    },
  });
}

/**
 * Mutation hook for updating media status in user's library
 */
export function useUpdateMediaStatus() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      status,
    }: {
      mediaId: string;
      status: UserMediaStatus;
    }) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return UserMediaService.updateStatus(user.id, mediaId, status);
    },
    onSuccess: (userMediaItem, { mediaId }) => {
      if (!user?.id) return;

      queryClient.setQueryData(
        queryKeys.userMediaItem.detail(user.id, mediaId),
        userMediaItem
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.userMedia.root(user.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.root(user.id),
      });
    },
  });
}
