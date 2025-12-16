import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";
import { useUserProfile } from "./use-user-profile";

type DbMediaType = "game" | "movie" | "tv_show" | "book";

// Map profile values to DB values
const PROFILE_TO_DB_MAP: Record<string, DbMediaType[]> = {
  Games: ["game"],
  Movies: ["movie", "tv_show"], // If Movies, also include tv_show
  Books: ["book"],
  TVShows: ["tv_show"],
};

/**
 * Hook for fetching media based on user's preferences
 * Uses the user profile to determine preferred media types
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
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}
