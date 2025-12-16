import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { MediaService } from "../services/mediaService";
import { Media } from "../types/media";

export function usePopularMovies(limit: number = 20) {
  const { isLoggedIn } = useContext(AuthContext);

  return useQuery<Media[]>({
    queryKey: queryKeys.media.popularMovies(limit),
    enabled: isLoggedIn,
    queryFn: () => MediaService.getPopularMovies(limit),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours (cron updates weekly)
  });
}
