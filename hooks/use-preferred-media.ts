import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { AuthContext } from "../contexts/auth-context";
import { preferredMediaQueryOptions } from "../lib/query-options";
import { Media } from "../types/media";
import { useUserProfile } from "./use-user-profile";

/**
 * Hook for fetching media based on user's preferences.
 * When searching, if local results are sparse it automatically
 * fetches from external APIs (TMDB for movies, IGDB for games).
 */
export function usePreferredMedia(searchQuery?: string) {
  const { user, isLoggedIn } = useContext(AuthContext);
  const profileQuery = useUserProfile();
  const preferredMedia = useMemo(
    () => profileQuery.data?.media_preferences?.preferred_media ?? [],
    [profileQuery.data?.media_preferences?.preferred_media]
  );
  const enabled = isLoggedIn && !!user?.id && !profileQuery.isPending;

  return useQuery<Media[]>({
    ...preferredMediaQueryOptions({
      preferredMedia,
      searchQuery,
      userId: user?.id ?? "",
    }),
    enabled,
  });
}
