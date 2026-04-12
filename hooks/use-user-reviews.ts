import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { userReviewsQueryOptions } from "../lib/query-options";
import { UserReview } from "../services/userMediaService";

// Re-export the UserReview type for convenience
export type { UserReview } from "../services/userMediaService";

/**
 * Hook for fetching user's reviews with full media details
 */
export function useUserReviews() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<UserReview[]>({
    ...userReviewsQueryOptions(user?.id ?? ""),
    enabled: isLoggedIn && !!user?.id,
  });
}
