import { useShowtimesPrefetch } from "../../hooks/use-showtimes-prefetch";

/** Prefetches today's showtimes into the persisted query cache after login. */
export function ShowtimesPrefetcher() {
  useShowtimesPrefetch();
  return null;
}
