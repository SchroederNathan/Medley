import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/query-keys";
import { TvEpisode } from "../types/media";
import { MediaService } from "../services/mediaService";

export function useSeasonEpisodes(mediaId: string, seasonNumber: number) {
  return useQuery<TvEpisode[]>({
    queryKey: queryKeys.media.seasonEpisodes(mediaId, seasonNumber),
    queryFn: () => MediaService.getSeasonEpisodes(mediaId, seasonNumber),
    enabled: !!mediaId && seasonNumber > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
