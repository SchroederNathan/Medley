import { supabase } from "../lib/utils";

type UserMediaStatus = "want" | "watching" | "reading" | "playing" | "completed";

export class UserMediaService {
  static async addToUserList(
    userId: string,
    mediaId: string,
    status: UserMediaStatus = "want",
    rating?: number
  ) {
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
      );

    if (error) throw error;
    return data;
  }

  static async getUserMedia(userId: string) {
    const { data, error } = await supabase
      .from("user_media")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

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
    if (error) throw error;
    return data ?? [];
  }

  static async getUserGenrePreferences(userId: string) {
    const { data, error } = await supabase
      .from("user_media_with_genres")
      .select("unified_genres")
      .eq("user_id", userId);
    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      (row.unified_genres || []).forEach((g: string) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return counts;
  }

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


