import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";
import { MediaService } from "../services/mediaService";
import { useUserProfile } from "./use-user-profile";

type DbMediaType = "game" | "movie" | "tv_show" | "book";

// Map profile values to DB values
const PROFILE_TO_DB_MAP: Record<string, DbMediaType[]> = {
  Games: ["game"],
  Movies: ["movie", "tv_show"], // If Movies, also include tv_show
  Books: ["book"],
  TVShows: ["tv_show"],
};

/** Minimum local results before we skip the TMDB fallback */
const LOCAL_RESULT_THRESHOLD = 5;

/**
 * Hook for fetching media based on user's preferences.
 * When searching, if local results are sparse it automatically
 * fetches from TMDB via the search-tmdb edge function.
 */
export function usePreferredMedia(searchQuery?: string) {
  const { user, isLoggedIn } = useContext(AuthContext);

  // Use the profile query hook to get preferences
  const profileQuery = useUserProfile();

  const enabled = isLoggedIn && !!user?.id;

  return useQuery<Media[]>({
    queryKey: queryKeys.media.preferred(user?.id ?? "", searchQuery?.trim()),
    enabled,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // Get preferred media types from the profile data
      const profilePrefs: string[] =
        profileQuery.data?.media_preferences?.preferred_media ?? [];

      const dbTypes: DbMediaType[] = profilePrefs
        .flatMap((p) => PROFILE_TO_DB_MAP[p] ?? [])
        .filter(Boolean) as DbMediaType[];

      // If no preferences are set, show all media types
      const mediaTypesToQuery =
        dbTypes.length > 0
          ? dbTypes
          : (["game", "movie", "tv_show", "book"] as DbMediaType[]);

      let query = supabase
        .from("media")
        .select("*")
        .in("media_type", mediaTypesToQuery);

      const q = (searchQuery || "").trim();
      if (q.length > 0) {
        // Basic title ilike filter
        query = query.ilike("title", `%${q}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      const localResults = data ?? [];

      // If the user is actively searching and local results are sparse,
      // fetch from TMDB to backfill the catalog
      const wantsMovies =
        mediaTypesToQuery.includes("movie") ||
        mediaTypesToQuery.includes("tv_show");

      if (
        q.length >= 2 &&
        wantsMovies &&
        localResults.length < LOCAL_RESULT_THRESHOLD
      ) {
        try {
          const tmdbResult = await MediaService.searchTmdb(q);
          if (tmdbResult.data.length > 0) {
            // Merge: local results first, then TMDB results (deduplicated)
            const existingIds = new Set(localResults.map((m) => m.id));
            const newItems = tmdbResult.data.filter(
              (m) => !existingIds.has(m.id)
            );
            return [...localResults, ...newItems].slice(0, 50);
          }
        } catch (err) {
          // TMDB search is best-effort; return local results on failure
          console.warn("TMDB search fallback failed:", err);
        }
      }

      return localResults;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}
