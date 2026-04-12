import { useQuery } from "@tanstack/react-query";
import { mediaDetailQueryOptions } from "../lib/query-options";
import { Media } from "../types/media";

/**
 * Hook for fetching a single media item by ID
 */
export function useMediaItem(mediaId?: string) {
  return useQuery<Media>({
    ...mediaDetailQueryOptions(mediaId ?? ""),
    enabled: !!mediaId,
  });
}
