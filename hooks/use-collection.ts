import { useQuery } from "@tanstack/react-query";
import { collectionDetailQueryOptions } from "../lib/query-options";
import { CollectionWithItems } from "../services/collectionService";

// Re-export the type for convenience
export type { CollectionWithItems } from "../services/collectionService";

/**
 * Hook for fetching a single collection with its items
 */
export function useCollection(collectionId?: string) {
  return useQuery<CollectionWithItems | null>({
    ...collectionDetailQueryOptions(collectionId ?? ""),
    enabled: !!collectionId,
  });
}
