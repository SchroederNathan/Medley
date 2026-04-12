import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { popularMoviesQueryOptions } from "../lib/query-options";
import { Media } from "../types/media";

export function usePopularMovies(limit: number = 20) {
  const { isLoggedIn } = useContext(AuthContext);

  return useQuery<Media[]>({
    ...popularMoviesQueryOptions(limit),
    enabled: isLoggedIn,
  });
}
