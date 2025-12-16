import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export interface CreateCollectionParams {
  userId: string;
  name: string;
  description?: string;
  ranked: boolean;
  items: Media[]; // Array of selected media in order
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  ranked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithItems extends Collection {
  collection_items: {
    id: string;
    collection_id: string;
    media_id: string;
    position: number;
    created_at: string;
    media: Media;
  }[];
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
  }: CreateCollectionParams): Promise<Collection> {
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
        `Failed to create collection: ${collectionError.message}`
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

    return collection;
  }

  /**
   * Fetches all collections for a user with their items
   */
  static async getUserCollections(
    userId: string
  ): Promise<CollectionWithItems[]> {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        collection_items (
          *,
          media (*)
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CollectionWithItems[]) ?? [];
  }

  /**
   * Fetches a single collection with its items
   */
  static async getCollection(
    collectionId: string
  ): Promise<CollectionWithItems | null> {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        collection_items (
          *,
          media (*)
        )
      `
      )
      .eq("id", collectionId)
      .single();

    if (error) {
      // If no collection found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as CollectionWithItems;
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
    }
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from("collections")
      .update(updates)
      .eq("id", collectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Deletes a collection and all its items (cascades via FK constraint)
   */
  static async deleteCollection(collectionId: string): Promise<void> {
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId);

    if (error) throw error;
  }

  /**
   * Adds media to a collection at the next available position
   */
  static async addMediaToCollection(
    collectionId: string,
    mediaId: string
  ): Promise<{ success: true }> {
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
        `Failed to add media to collection: ${insertError.message}`
      );
    }

    return { success: true };
  }

  /**
   * Removes media from a collection
   */
  static async removeMediaFromCollection(
    collectionId: string,
    mediaId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("media_id", mediaId);

    if (error) throw error;
  }

  /**
   * Updates a collection with its items (name, description, ranked status, and items)
   * This replaces all existing items with the new items in the specified order
   */
  static async updateCollectionWithItems(
    collectionId: string,
    updates: {
      name: string;
      description?: string;
      ranked: boolean;
      items: Media[]; // Array of media in order
    }
  ): Promise<{ success: true }> {
    // Step 1: Update the collection metadata
    const { error: collectionError } = await supabase
      .from("collections")
      .update({
        name: updates.name,
        description: updates.description || null,
        ranked: updates.ranked,
      })
      .eq("id", collectionId);

    if (collectionError) {
      throw new Error(
        `Failed to update collection: ${collectionError.message}`
      );
    }

    // Step 2: Delete all existing collection items
    const { error: deleteError } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId);

    if (deleteError) {
      throw new Error(
        `Failed to delete existing items: ${deleteError.message}`
      );
    }

    // Step 3: Insert new collection items if there are any
    if (updates.items.length > 0) {
      const collectionItems = updates.items.map((media, index) => ({
        collection_id: collectionId,
        media_id: media.id,
        position: index + 1, // positions are 1-indexed
      }));

      const { error: itemsError } = await supabase
        .from("collection_items")
        .insert(collectionItems);

      if (itemsError) {
        throw new Error(`Failed to add items: ${itemsError.message}`);
      }
    }

    return { success: true };
  }
}
