import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import { CollectionService } from "../../services/collectionService";
import { Media } from "../../types/media";

interface UpdateCollectionParams {
  collectionId: string;
  name?: string;
  description?: string;
  ranked?: boolean;
}

interface UpdateCollectionWithItemsParams {
  collectionId: string;
  name: string;
  description?: string;
  ranked: boolean;
  items: Media[];
}

/**
 * Mutation hook for updating collection metadata (name, description, ranked)
 */
export function useUpdateCollection() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, ...updates }: UpdateCollectionParams) => {
      return CollectionService.updateCollection(collectionId, updates);
    },
    onSuccess: (_, { collectionId }) => {
      if (!user?.id) return;

      // Invalidate the specific collection
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });

      // Invalidate user collections list
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all(user.id),
      });
    },
  });
}

/**
 * Mutation hook for updating a collection with its items
 * (name, description, ranked status, and items in order)
 */
export function useUpdateCollectionWithItems() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      ...updates
    }: UpdateCollectionWithItemsParams) => {
      return CollectionService.updateCollectionWithItems(collectionId, updates);
    },
    onSuccess: (_, { collectionId }) => {
      if (!user?.id) return;

      // Invalidate the specific collection
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });

      // Invalidate user collections list
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all(user.id),
      });
    },
  });
}

