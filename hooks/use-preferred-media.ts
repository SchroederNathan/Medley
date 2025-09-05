import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { AuthContext } from "../contexts/auth-context";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";

type DbMediaType = "game" | "movie" | "tv_show" | "book";

// Map profile values to DB values
const PROFILE_TO_DB_MAP: Record<string, DbMediaType> = {
  Games: "game",
  Movies: "movie",
  Books: "book",
  // If TV shows are added to onboarding later, map accordingly
  "TV Shows": "tv_show",
};

export function usePreferredMedia(searchQuery?: string) {
  const { user, isLoggedIn, fetchUserProfile } = useContext(AuthContext);

  // Resolve preferred media types from the profile
  const { preferredDbTypesKey, enabled } = useMemo(() => {
    // We rely on the profile fetch to read preferences. If not logged in or missing id, disable.
    const baseEnabled = isLoggedIn && !!user?.id;
    return { preferredDbTypesKey: user?.id ?? null, enabled: baseEnabled };
  }, [isLoggedIn, user?.id]);

  return useQuery<Media[]>({
    queryKey: [
      "preferredMedia",
      preferredDbTypesKey,
      searchQuery?.trim() || "",
    ],
    enabled,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // Fetch profile to get preferred media types
      const profile = await fetchUserProfile(user.id);
      const profilePrefs: string[] =
        profile?.media_preferences?.preferred_media ?? [];

      const dbTypes: DbMediaType[] = profilePrefs
        .map((p) => PROFILE_TO_DB_MAP[p])
        .filter(Boolean) as DbMediaType[];

      if (dbTypes.length === 0) return [];

      let query = supabase.from("media").select("*").in("media_type", dbTypes);

      const q = (searchQuery || "").trim();
      if (q.length > 0) {
        // Basic title ilike filter; consider trigram/fts later
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
