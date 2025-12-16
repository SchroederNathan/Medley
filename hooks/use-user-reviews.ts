import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { UserMediaService, UserReview } from "../services/userMediaService";

// Re-export the UserReview type for convenience
export type { UserReview } from "../services/userMediaService";

/**
 * Hook for fetching user's reviews with full media details
 */
export function useUserReviews() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<UserReview[]>({
    queryKey: queryKeys.userReviews.all(user?.id ?? ""),
    enabled: isLoggedIn && !!user?.id,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      return UserMediaService.getUserReviews(user.id);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
