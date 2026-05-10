import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { followCountsQueryOptions } from "../lib/query-options";

export function useFollowCounts(userId: string | undefined) {
  const { isLoggedIn } = useContext(AuthContext);

  return useQuery({
    ...followCountsQueryOptions(userId ?? ""),
    enabled: isLoggedIn && !!userId,
  });
}
