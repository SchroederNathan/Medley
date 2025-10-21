import { queryClient } from "../lib/query-client";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export interface CreateCollectionParams {
  userId: string;
  name: string;
  description?: string;
  ranked: boolean;
  items: Media[]; // Array of selected media in order
}

export class CollectionService {
  /**
   * Creates a collection with its items
   * Returns the created collection with all its items
   */
  static async createCollection({
    userId,
    name,
    description,
    ranked,
    items,
  }: CreateCollectionParams) {
    // Step 1: Create the collection
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name,
        description: description || null,
        ranked,
      })
      .select()
      .single();

    if (collectionError) {
      throw new Error(
        `Failed to create collection: ${collectionError.message}`,
      );
    }

    // Step 2: Create collection items if there are any
    if (items.length > 0) {
      const collectionItems = items.map((media, index) => ({
        collection_id: collection.id,
        media_id: media.id,
        position: index + 1, // positions are 1-indexed
      }));

      const { error: itemsError } = await supabase
        .from("collection_items")
        .insert(collectionItems);

      if (itemsError) {
        // Rollback: delete the collection if items fail
        await supabase.from("collections").delete().eq("id", collection.id);
        throw new Error(`Failed to add items: ${itemsError.message}`);
      }
    }

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["collections", userId] });

    return collection;
  }

  /**
   * Fetches all collections for a user with their items
   */
  static async getUserCollections(userId: string) {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        collection_items (
          *,
          media (*)
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Fetches a single collection with its items
   */
  static async getCollection(collectionId: string) {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        collection_items (
          *,
          media (*)
        )
      `,
      )
      .eq("id", collectionId)
      .order("collection_items(position)", { ascending: true })
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Updates a collection's basic info (name, description, ranked status)
   */
  static async updateCollection(
    collectionId: string,
    updates: {
      name?: string;
      description?: string;
      ranked?: boolean;
    },
  ) {
    const { data, error } = await supabase
      .from("collections")
      .update(updates)
      .eq("id", collectionId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });

    return data;
  }

  /**
   * Deletes a collection and all its items (cascades via FK constraint)
   */
  static async deleteCollection(collectionId: string, userId: string) {
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId);

    if (error) throw error;

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["collections", userId] });
  }

  /**
   * Adds media to a collection at the next available position
   */
  static async addMediaToCollection(collectionId: string, mediaId: string) {
    // First, get the current max position for this collection
    const { data: maxPositionData, error: positionError } = await supabase
      .from("collection_items")
      .select("position")
      .eq("collection_id", collectionId)
      .order("position", { ascending: false })
      .limit(1);

    if (positionError) {
      throw new Error(`Failed to get max position: ${positionError.message}`);
    }

    const nextPosition = (maxPositionData?.[0]?.position || 0) + 1;

    // Insert the new collection item
    const { error: insertError } = await supabase
      .from("collection_items")
      .insert({
        collection_id: collectionId,
        media_id: mediaId,
        position: nextPosition,
      });

    if (insertError) {
      throw new Error(
        `Failed to add media to collection: ${insertError.message}`,
      );
    }

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
    // Also invalidate user collections to update the save-media screen
    queryClient.invalidateQueries({ queryKey: ["collections"] });

    return { success: true };
  }
}
