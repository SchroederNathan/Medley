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
import { UserCoords, useUserLocation } from "./use-user-location";

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

type UseShowtimesArgs = {
  coords: UserCoords | null;
  date?: string;
  windowStart?: string;
};

export function useShowtimes({ coords, date, windowStart }: UseShowtimesArgs) {
  const { isLoggedIn } = useContext(AuthContext);
  const resolvedDate = date ?? todayLocalDate();
  const resolvedWindowStart = windowStart ?? resolvedDate;

  return useQuery<ShowtimesResponse>({
    enabled: isLoggedIn && !!coords,
    queryFn: () =>
      ShowtimesService.getShowtimes({
        date: resolvedDate,
        lat: coords!.lat,
        lng: coords!.lng,
        windowStart: resolvedWindowStart,
      }),
    queryKey: queryKeys.showtimes.list(
      coords?.lat ?? 0,
      coords?.lng ?? 0,
      resolvedDate
    ),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 6,
  });
}

/**
 * Fetches showtimes for the user's location and picks the entry matching `media`.
 * Matches first by `media_id`, then falls back to normalized title + year.
 */
export function useShowtimesForMedia(
  media: Media | null | undefined,
  date?: string,
  windowStart?: string
) {
  const { coords, status, requestLocation } = useUserLocation();
  const query = useShowtimes({ coords, date, windowStart });

  const movie: ShowtimesMovie | null = useMemo(() => {
    if (!media || !query.data) return null;
    const movies = query.data.movies;
    const byMediaId = movies.find((m) => m.media_id && m.media_id === media.id);
    if (byMediaId) return byMediaId;

    const targetTitle = normalizeTitle(media.title ?? "");
    const targetYear = media.year ?? null;
    if (!targetTitle) return null;

    const match = movies.find(
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
