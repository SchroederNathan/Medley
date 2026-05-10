import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";

import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import {
  ShowtimesMovie,
  ShowtimesResponse,
  ShowtimesService,
} from "../services/showtimesService";
import { Media } from "../types/media";
import { useUserLocation } from "./use-user-location";

function todayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeTitle(raw: string): string {
  if (!raw) return "";
  let t = raw.toLowerCase().trim();
  t = t.replace(/^(the|a|an)\s+/i, "");
  t = t.replace(/[’'`:.,!?\-–—()\[\]"]/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/**
 * Fetches showtimes near the user's location for `date` and picks the entry
 * matching `media` by normalized title + release year.
 */
export function useShowtimesForMovie(media: Media | null | undefined, date?: string) {
  const { isLoggedIn } = useContext(AuthContext);
  const { coords, status, requestLocation } = useUserLocation();
  const resolvedDate = date ?? todayLocalDate();

  const query = useQuery<ShowtimesResponse>({
    enabled: isLoggedIn && !!coords,
    queryFn: () =>
      ShowtimesService.getShowtimes({
        date: resolvedDate,
        lat: coords!.lat,
        lng: coords!.lng,
      }),
    queryKey: queryKeys.showtimes.list(
      coords?.lat ?? 0,
      coords?.lng ?? 0,
      resolvedDate
    ),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  });

  const movie: ShowtimesMovie | null = useMemo(() => {
    if (!media || !query.data) return null;
    const targetTitle = normalizeTitle(media.title ?? "");
    if (!targetTitle) return null;
    const targetYear = media.year ?? null;

    const match = query.data.movies.find(
      (m) =>
        normalizeTitle(m.title) === targetTitle &&
        (targetYear == null ||
          m.releaseYear == null ||
          m.releaseYear === targetYear)
    );
    return match ?? null;
  }, [media, query.data]);

  return {
    locationStatus: status,
    movie,
    query,
    requestLocation,
  };
}
