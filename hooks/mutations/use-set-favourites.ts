import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { queryKeys } from "../../lib/query-keys";
import {
  FavouritesService,
  MAX_FAVOURITES,
} from "../../services/favouritesService";
import { Media } from "../../types/media";

interface SetFavouritesContext {
  previous?: Media[];
}

/**
 * Mutation hook for replacing the current user's favourites (up to 5, ordered).
 *
 * Optimistically writes the new order into the favourites cache so inline
 * reordering / removing on the profile feels instant, rolls back on failure,
 * and revalidates on settle.
 */
export function useSetFavourites() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation<{ success: true }, Error, Media[], SetFavouritesContext>({
    mutationFn: async (items: Media[]) => {
      if (!user?.id) {
        throw new Error("User must be logged in");
      }
      return FavouritesService.setFavourites(user.id, items);
    },
    onMutate: async (items) => {
      if (!user?.id) return {};
      const queryKey = queryKeys.favourites.all(user.id);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Media[]>(queryKey);
      queryClient.setQueryData<Media[]>(
        queryKey,
        items.slice(0, MAX_FAVOURITES)
      );
      return { previous };
    },
    onError: (_error, _items, context) => {
      if (!user?.id || context?.previous === undefined) return;
      queryClient.setQueryData(
        queryKeys.favourites.all(user.id),
        context.previous
      );
    },
    onSettled: () => {
      if (!user?.id) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.favourites.root(user.id),
      });
    },
  });
}
