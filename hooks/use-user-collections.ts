import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import {
  CollectionService,
  CollectionWithItems,
} from "../services/collectionService";

/**
 * Hook for fetching all collections for the current user
 */
export function useUserCollections() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<CollectionWithItems[]>({
    queryKey: queryKeys.collections.all(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return CollectionService.getUserCollections(user.id);
    },
    enabled: isLoggedIn && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
