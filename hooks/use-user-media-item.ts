import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { userMediaItemQueryOptions } from "../lib/query-options";

export function useUserMediaItem(mediaId?: string) {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery({
    ...userMediaItemQueryOptions(user?.id ?? "", mediaId ?? ""),
    enabled: isLoggedIn && !!user?.id && !!mediaId,
  });
}
