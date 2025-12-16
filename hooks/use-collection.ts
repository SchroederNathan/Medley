import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/query-keys";
import {
  CollectionService,
  CollectionWithItems,
} from "../services/collectionService";

// Re-export the type for convenience
export type { CollectionWithItems } from "../services/collectionService";

/**
 * Hook for fetching a single collection with its items
 */
export function useCollection(collectionId?: string) {
  return useQuery<CollectionWithItems | null>({
    queryKey: queryKeys.collections.detail(collectionId ?? ""),
    queryFn: async () => {
      if (!collectionId) throw new Error("No collection ID provided");
      const data = await CollectionService.getCollection(collectionId);
      if (!data) return null;

      // Sort collection items by position
      return {
        ...data,
        collection_items: [...(data.collection_items || [])].sort(
          (a, b) => (a.position || 0) - (b.position || 0)
        ),
      };
    },
    enabled: !!collectionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
