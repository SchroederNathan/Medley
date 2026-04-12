import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { CollectionWithItems } from "../services/collectionService";
import { userCollectionsQueryOptions } from "../lib/query-options";

/**
 * Hook for fetching all collections for the current user
 */
export function useUserCollections() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<CollectionWithItems[]>({
    ...userCollectionsQueryOptions(user?.id ?? ""),
    enabled: isLoggedIn && !!user?.id,
  });
}
