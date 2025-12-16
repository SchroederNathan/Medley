import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import {
  CollectionService,
  CreateCollectionParams,
} from "../../services/collectionService";

/**
 * Mutation hook for creating a new collection
 * Handles cache invalidation for user collections
 */
export function useCreateCollection() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: Omit<CreateCollectionParams, "userId">
    ) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return CollectionService.createCollection({
        ...params,
        userId: user.id,
      });
    },
    onSuccess: () => {
      if (!user?.id) return;

      // Invalidate user collections list
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all(user.id),
      });
    },
  });
}

/**
 * Mutation hook for deleting a collection
 */
export function useDeleteCollection() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      return CollectionService.deleteCollection(collectionId);
    },
    onSuccess: (_, collectionId) => {
      if (!user?.id) return;

      // Invalidate user collections list
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all(user.id),
      });

      // Remove the specific collection from cache
      queryClient.removeQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });
    },
  });
}

/**
 * Mutation hook for adding media to a collection
 */
export function useAddToCollection() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      mediaId,
    }: {
      collectionId: string;
      mediaId: string;
    }) => {
      return CollectionService.addMediaToCollection(collectionId, mediaId);
    },
    onSuccess: (_, { collectionId }) => {
      if (!user?.id) return;

      // Invalidate the specific collection
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(collectionId),
      });

      // Invalidate user collections list (to update item counts, etc.)
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all(user.id),
      });
    },
  });
}

/**
 * Mutation hook for removing media from a collection
 */
export function useRemoveFromCollection() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      mediaId,
    }: {
      collectionId: string;
      mediaId: string;
    }) => {
      return CollectionService.removeMediaFromCollection(collectionId, mediaId);
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

