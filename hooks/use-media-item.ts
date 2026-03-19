import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/query-keys";
import { Media } from "../types/media";
import { MediaService } from "../services/mediaService";

/**
 * Hook for fetching a single media item by ID
 */
export function useMediaItem(mediaId?: string) {
  return useQuery<Media>({
    queryKey: queryKeys.media.detail(mediaId ?? ""),
    queryFn: async () => {
      if (!mediaId) throw new Error("No media ID provided");
      return MediaService.getMediaDetail(mediaId);
    },
    enabled: !!mediaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
