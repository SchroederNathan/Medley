import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import {
  MediaTypeDb,
  RecommendationFilters,
  RecommendationService,
} from "../services/recommendationService";
import { Media } from "../types/media";

type RecommendationOptions =
  | { kind: "all"; filters?: RecommendationFilters }
  | { kind: "type"; mediaType: MediaTypeDb; filters?: RecommendationFilters }
  | {
      kind: "similar";
      sourceMediaId: string;
      targetType?: MediaTypeDb;
      filters?: RecommendationFilters;
    };

/**
 * Hook for fetching recommendations based on user's library
 */
export function useRecommendations(options: RecommendationOptions) {
  const { user, isLoggedIn } = useContext(AuthContext);

  // Build the query key based on options
  const getQueryKey = () => {
    if (!user?.id) return ["recommendations", null];

    switch (options.kind) {
      case "all":
        return queryKeys.recommendations.all(user.id);
      case "type":
        return queryKeys.recommendations.byType(user.id, options.mediaType);
      case "similar":
        return queryKeys.recommendations.similar(
          user.id,
          options.sourceMediaId,
          options.targetType
        );
    }
  };

  return useQuery<Media[]>({
    queryKey: getQueryKey(),
    enabled: isLoggedIn && !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      switch (options.kind) {
        case "all":
          return RecommendationService.getAll(user.id, options.filters);
        case "type":
          return RecommendationService.getByType(
            user.id,
            options.mediaType,
            options.filters
          );
        case "similar":
          return RecommendationService.getSimilarToMedia(
            user.id,
            options.sourceMediaId,
            options.targetType,
            options.filters
          );
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
