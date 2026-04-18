import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";

import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { ShowtimesService } from "../services/showtimesService";
import { UserCoords, useUserLocation } from "./use-user-location";

const COORD_BUCKET = 100;
function bucket(value: number): number {
  return Math.round(value * COORD_BUCKET) / COORD_BUCKET;
}

function todayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function prefetchShowtimesForDate(
  queryClient: QueryClient,
  coords: UserCoords,
  date: string
) {
  const latBucket = bucket(coords.lat);
  const lngBucket = bucket(coords.lng);
  return queryClient.prefetchQuery({
    gcTime: 1000 * 60 * 60 * 6,
    queryFn: () =>
      ShowtimesService.getShowtimes({
        date,
        lat: coords.lat,
        lng: coords.lng,
        windowStart: date,
      }),
    queryKey: queryKeys.showtimes.list(latBucket, lngBucket, date),
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Warms TanStack cache for today's showtimes once coords + auth are ready.
 * Mount once under the protected layout.
 */
export function useShowtimesPrefetch() {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useContext(AuthContext);
  const { coords, status } = useUserLocation();

  useEffect(() => {
    if (!isLoggedIn || !coords || status !== "granted") return;
    void prefetchShowtimesForDate(queryClient, coords, todayLocalDate());
  }, [isLoggedIn, coords, status, queryClient]);
}
