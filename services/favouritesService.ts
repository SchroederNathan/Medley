import { supabase } from "../lib/utils";
import { throwIfError, toAppError } from "../lib/app-error";
import { Media } from "../types/media";

export const MAX_FAVOURITES = 5;

interface FavouriteRow {
  position: number;
  media: Media;
}

export class FavouritesService {
  /**
   * Fetches a user's favourites with full media details, ordered by position.
   * Returns an empty array when the user has no favourites.
   */
  static async getFavourites(userId: string): Promise<Media[]> {
    const { data, error } = await supabase
      .from("favourites")
      .select("position, media (*)")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    throwIfError(error, "Failed to load favourites");

    // Supabase types the embedded to-one `media (*)` relation loosely, so we
    // narrow through `unknown` to our known row shape.
    const rows = (data as unknown as FavouriteRow[] | null) ?? [];
    return rows.filter((row) => !!row.media).map((row) => row.media);
  }

  /**
   * Replaces a user's favourites with the given ordered list (capped at 5).
   * Uses a delete-all-then-insert flow, mirroring
   * CollectionService.updateCollectionWithItems.
   */
  static async setFavourites(
    userId: string,
    items: Media[]
  ): Promise<{ success: true }> {
    // Step 1: clear existing favourites for this user
    const { error: deleteError } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw toAppError(deleteError, "Failed to update favourites");
    }

    // Step 2: insert the new favourites (positions are 1-indexed)
    const rows = items.slice(0, MAX_FAVOURITES).map((media, index) => ({
      user_id: userId,
      media_id: media.id,
      position: index + 1,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("favourites")
        .insert(rows);

      if (insertError) {
        throw toAppError(insertError, "Failed to save favourites");
      }
    }

    return { success: true };
  }
}
