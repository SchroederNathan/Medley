import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import { UserMediaService } from "../../services/userMediaService";

interface SubmitReviewParams {
  mediaId: string;
  rating: number;
  review: string;
}

/**
 * Mutation hook for submitting or updating a review
 * Handles cache invalidation for user media and reviews
 */
export function useSubmitReview() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, rating, review }: SubmitReviewParams) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return UserMediaService.submitReview(user.id, mediaId, rating, review);
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
        queryKey: queryKeys.userReviews.root(user.id),
      });
    },
  });
}
