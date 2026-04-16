import { supabase } from "../lib/utils";
import { throwIfError, toAppError } from "../lib/app-error";
import { Media } from "../types/media";

export type UserMediaStatus =
  | "want"
  | "watching"
  | "reading"
  | "playing"
  | "completed";

export interface UserMediaItem {
  id: string;
  user_id: string;
  media_id: string;
  status: UserMediaStatus;
  user_rating?: number;
  review?: string;
  added_at: string;
}

export interface UserReview {
  id: string;
  review: string;
  rating: number;
  createdAt: string;
  media: Media;
}

export class UserMediaService {
  /**
   * Adds or updates a media item in user's list
   */
  static async addToUserList(
    userId: string,
    mediaId: string,
    status: UserMediaStatus = "want",
    rating?: number
  ): Promise<UserMediaItem> {
    const { data, error } = await supabase
      .from("user_media")
      .upsert(
        {
          user_id: userId,
          media_id: mediaId,
          status,
          user_rating: rating,
          added_at: new Date().toISOString(),
        },
        { onConflict: "user_id,media_id" }
      )
      .select()
      .single();

    throwIfError(error, "Failed to save media");

    const savedRecord = Array.isArray(data) ? data[0] : data;
    if (!savedRecord) {
      const record = await this.getUserMediaItem(userId, mediaId);
      if (!record) {
        throw toAppError(new Error("Media item was not returned after save"));
      }
      return record;
    }

    return savedRecord as UserMediaItem;
  }

  /**
   * Gets basic user media entries (without full media details)
   */
  static async getUserMedia(userId: string): Promise<UserMediaItem[]> {
    const { data, error } = await supabase
      .from("user_media")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    throwIfError(error, "Failed to load user media");
    return data ?? [];
  }

  /**
   * Gets user media with full media details (title, poster, etc.)
   * This replaces the inline Supabase calls in useUserMedia hook
   */
  static async getUserMediaWithDetails(userId: string): Promise<Media[]> {
    // 1) Fetch the user's list from user_media
    const { data: userMediaRows, error: userMediaError } = await supabase
      .from("user_media")
      .select("media_id, added_at, user_rating")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    throwIfError(userMediaError, "Failed to load user media");
    const mediaIds = (userMediaRows || []).map((r: any) => r.media_id);
    if (mediaIds.length === 0) return [];

    // 2) Fetch media details in a single query
    const { data: mediaRows, error: mediaError } = await supabase
      .from("media")
      .select("*")
      .in("id", mediaIds);
    throwIfError(mediaError, "Failed to load media details");

    // 3) Preserve user_media order (added_at desc) and attach user_rating
    const orderMap = new Map<string, number>();
    const ratingMap = new Map<string, number | null>();
    (userMediaRows || []).forEach((row: any, idx: number) => {
      orderMap.set(row.media_id, idx);
      ratingMap.set(row.media_id, row.user_rating ?? null);
    });
    const sorted = (mediaRows as Media[])
      .slice()
      .sort((a, b) => {
        const ai = orderMap.get(a.id) ?? 0;
        const bi = orderMap.get(b.id) ?? 0;
        return ai - bi;
      })
      .map((m) => ({ ...m, user_rating: ratingMap.get(m.id) ?? null }));

    return sorted;
  }

  /**
   * Gets user media with genre information (from view)
   */
  static async getUserMediaWithGenres(
    userId: string,
    mediaType?: "movie" | "tv" | "game",
    status?: UserMediaStatus
  ) {
    let query = supabase
      .from("user_media_with_genres")
      .select("*")
      .eq("user_id", userId);

    if (mediaType) query = query.eq("media_type", mediaType);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.order("added_at", { ascending: false });
    throwIfError(error, "Failed to load media genres");
    return data ?? [];
  }

  /**
   * Gets user's genre preferences based on their media library
   */
  static async getUserGenrePreferences(userId: string) {
    const { data, error } = await supabase
      .from("user_media_with_genres")
      .select("unified_genres")
      .eq("user_id", userId);
    throwIfError(error, "Failed to load genre preferences");

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      (row.unified_genres || []).forEach((g: string) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return counts;
  }

  /**
   * Gets a single user media item (status, rating, review for a specific media)
   */
  static async getUserMediaItem(
    userId: string,
    mediaId: string
  ): Promise<UserMediaItem | null> {
    const { data, error } = await supabase
      .from("user_media")
      .select("*")
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .single();
    if (error) {
      // If no record found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw toAppError(error, "Failed to load user media item");
    }
    return data;
  }

  /**
   * Gets all reviews by a user with full media details
   * This replaces the inline Supabase calls in useUserReviews hook
   */
  static async getUserReviews(userId: string): Promise<UserReview[]> {
    // Fetch user_media entries that have reviews
    const { data: userMediaRows, error: userMediaError } = await supabase
      .from("user_media")
      .select("id, review, user_rating, media_id, added_at")
      .eq("user_id", userId)
      .not("review", "is", null)
      .order("added_at", { ascending: false });

    throwIfError(userMediaError, "Failed to load user reviews");
    if (!userMediaRows || userMediaRows.length === 0) return [];

    const mediaIds = userMediaRows.map((r: any) => r.media_id);

    // Fetch media details
    const { data: mediaRows, error: mediaError } = await supabase
      .from("media")
      .select("*")
      .in("id", mediaIds);

    throwIfError(mediaError, "Failed to load reviewed media details");

    // Create a map of media by ID
    const mediaMap = new Map<string, Media>();
    (mediaRows || []).forEach((m: Media) => {
      mediaMap.set(m.id, m);
    });

    // Combine user_media with media details
    const reviews: UserReview[] = userMediaRows
      .map((um: any) => {
        const media = mediaMap.get(um.media_id);
        if (!media) return null;

        return {
          id: um.id,
          review: um.review,
          rating: um.user_rating || 0,
          createdAt: um.added_at,
          media,
        };
      })
      .filter((r): r is UserReview => r !== null);

    return reviews;
  }

  /**
   * Submits or updates a review for a media item
   */
  static async submitReview(
    userId: string,
    mediaId: string,
    rating: number,
    review: string
  ): Promise<UserMediaItem> {
    const { data, error } = await supabase
      .from("user_media")
      .upsert(
        {
          user_id: userId,
          media_id: mediaId,
          user_rating: rating,
          review: review.trim() || null,
        },
        { onConflict: "user_id,media_id" }
      )
      .select()
      .single();

    throwIfError(error, "Failed to submit review");

    const savedRecord = Array.isArray(data) ? data[0] : data;
    if (!savedRecord) {
      const record = await this.getUserMediaItem(userId, mediaId);
      if (!record) {
        throw toAppError(new Error("Review was not returned after save"));
      }
      return record;
    }

    return savedRecord as UserMediaItem;
  }

  /**
   * Removes a media item from user's library
   */
  static async removeFromUserList(userId: string, mediaId: string) {
    const { error } = await supabase
      .from("user_media")
      .delete()
      .eq("user_id", userId)
      .eq("media_id", mediaId);

    throwIfError(error, "Failed to remove media from library");
  }

  /**
   * Updates the status of a media item in user's library
   */
  static async updateStatus(
    userId: string,
    mediaId: string,
    status: UserMediaStatus
  ) {
    const { data, error } = await supabase
      .from("user_media")
      .update({ status })
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .select()
      .single();

    throwIfError(error, "Failed to update media status");
    return data;
  }

  /**
   * Adds sample data for testing
   */
  static async addSampleDataForTesting(userId: string) {
    const samples = [
      {
        mediaId: "a6c912ce-2c9f-436a-8d09-21355d712535",
        status: "completed" as UserMediaStatus,
        rating: 5,
      },
      {
        mediaId: "64c46507-c445-40e4-8dce-0602f2263377",
        status: "completed" as UserMediaStatus,
        rating: 4,
      },
    ];

    for (const item of samples) {
      await this.addToUserList(userId, item.mediaId, item.status, item.rating);
    }
  }
}
