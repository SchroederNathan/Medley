import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export class MediaService {
  /**
   * Returns top N popular movies from `popular_movies` (ordered by rank),
   * joining to the referenced `media` row.
   */
  static async getPopularMovies(limit: number = 20): Promise<Media[]> {
    const cappedLimit = Math.max(1, Math.min(limit, 50));

    const { data, error } = await supabase
      .from("popular_movies")
      .select("rank, media:media_id(*)")
      .order("rank", { ascending: true })
      .limit(cappedLimit);

    if (error || !data) return [];

    // PostgREST returns `{ rank, media: {...} }`
    // Always enforce rank ordering client-side too (defensive).
    return (data as any[])
      .slice()
      .sort((a, b) => (Number(a?.rank) || 0) - (Number(b?.rank) || 0))
      .map((row) => row.media as Media | null)
      .filter(Boolean) as Media[];
  }
}
