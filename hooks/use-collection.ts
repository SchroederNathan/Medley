import { useQuery } from "@tanstack/react-query";
import { CollectionService } from "../services/collectionService";

export interface CollectionWithItems {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  ranked: boolean;
  created_at: string;
  updated_at: string;
  collection_items: {
    id: string;
    collection_id: string;
    media_id: string;
    position: number;
    created_at: string;
    media: any;
  }[];
}

export function useCollection(collectionId?: string) {
  return useQuery<CollectionWithItems>({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      if (!collectionId) throw new Error("No collection ID provided");
      const data = await CollectionService.getCollection(collectionId);
      if (!data) throw new Error("Collection not found");
      const sorted = {
        ...(data as CollectionWithItems),
        collection_items: [
          ...((data as CollectionWithItems).collection_items || []),
        ].sort((a, b) => (a.position || 0) - (b.position || 0)),
      };
      return sorted;
    },
    enabled: !!collectionId,
    staleTime: 1000 * 60 * 5,
  });
}
