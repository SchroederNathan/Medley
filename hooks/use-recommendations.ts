import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import {
  RecommendationQueryInput,
  recommendationsQueryOptions,
} from "../lib/query-options";
import { Media } from "../types/media";

/**
 * Hook for fetching recommendations based on user's library
 */
export function useRecommendations(options: RecommendationQueryInput) {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<Media[]>({
    ...recommendationsQueryOptions({
      request: options,
      userId: user?.id ?? "",
    }),
    enabled: isLoggedIn && !!user?.id,
  });
}
