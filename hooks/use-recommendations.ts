import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import {
  MediaTypeDb,
  RecommendationFilters,
  RecommendationService,
} from "../services/recommendationService";
import { Media } from "../types/media";

export function useRecommendations(
  options:
    | { kind: "all"; filters?: RecommendationFilters }
    | { kind: "type"; mediaType: MediaTypeDb; filters?: RecommendationFilters }
    | {
        kind: "similar";
        sourceMediaId: string;
        targetType?: MediaTypeDb;
        filters?: RecommendationFilters;
      }
) {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<Media[]>({
    queryKey: ["recommendations2", user?.id, options],
    enabled: isLoggedIn && !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      if (options.kind === "all") {
        return RecommendationService.getAll(user.id, options.filters);
      }
      if (options.kind === "type") {
        return RecommendationService.getByType(
          user.id,
          options.mediaType,
          options.filters
        );
      }
      return RecommendationService.getSimilarToMedia(
        user.id,
        options.sourceMediaId,
        options.targetType,
        options.filters
      );
    },
    staleTime: 1000 * 60 * 15,
  });
}
