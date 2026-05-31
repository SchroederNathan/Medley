import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { favouritesQueryOptions } from "../lib/query-options";
import { Media } from "../types/media";

/**
 * Hook for fetching a user's favourites with full media details.
 * Defaults to the current user; pass a `userId` to read another user's
 * favourites (e.g. when displaying their profile).
 */
export function useFavourites(userId?: string) {
  const { user, isLoggedIn } = useContext(AuthContext);
  const targetId = userId ?? user?.id ?? "";

  return useQuery<Media[]>({
    ...favouritesQueryOptions(targetId),
    enabled: !!targetId && (!!userId || isLoggedIn),
  });
}
