import { useInfiniteQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";

import { AuthContext } from "../contexts/auth-context";
import { upcomingMoviesInfiniteQueryOptions } from "../lib/query-options";
import { getDeviceRegion } from "../lib/region";
import type { UpcomingMovieItem } from "../services/mediaService";

/**
 * Infinite feed of upcoming theatrical releases (next 12 months) for the
 * device's region. Pages are appended by the edge function's cursor.
 */
export function useUpcomingMovies() {
  const { isLoggedIn } = useContext(AuthContext);
  const region = getDeviceRegion();

  const query = useInfiniteQuery({
    ...upcomingMoviesInfiniteQueryOptions({ region }),
    enabled: isLoggedIn,
  });

  const items: UpcomingMovieItem[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  return { items, query };
}
