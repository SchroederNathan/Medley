import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/query-keys";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";

/**
 * Hook for fetching a single media item by ID
 */
export function useMediaItem(mediaId?: string) {
  return useQuery<Media>({
    queryKey: queryKeys.media.detail(mediaId ?? ""),
    queryFn: async () => {
      if (!mediaId) throw new Error("No media ID provided");

      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("id", mediaId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Media item not found");

      return data;
    },
    enabled: !!mediaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
