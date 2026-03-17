import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export type SearchTmdbResult = {
  data: Media[];
  total_results: number;
  page: number;
  total_pages: number;
};

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

  /**
   * Search movies via TMDB through the search-tmdb edge function.
   * Results are automatically cached in the media table for future local queries.
   */
  static async searchTmdb(
    query: string,
    page: number = 1
  ): Promise<SearchTmdbResult> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

    const url = new URL(`${supabaseUrl}/functions/v1/search-tmdb`);
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ""}`,
        apikey: supabaseKey,
      },
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`search-tmdb failed (${resp.status}): ${body}`);
    }

    return resp.json();
  }
}
