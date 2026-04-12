import { useQuery } from "@tanstack/react-query";
import { seasonEpisodesQueryOptions } from "../lib/query-options";
import { TvEpisode } from "../types/media";

export function useSeasonEpisodes(mediaId: string, seasonNumber: number) {
  return useQuery<TvEpisode[]>({
    ...seasonEpisodesQueryOptions(mediaId, seasonNumber),
    enabled: !!mediaId && seasonNumber > 0,
  });
}
