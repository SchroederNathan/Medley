import { supabase } from "../lib/utils";
import { createHttpError, throwIfError, toAppError } from "../lib/app-error";
import { Media, TvEpisode } from "../types/media";

export type SearchMediaResult = {
  data: Media[];
  total_results: number;
  page: number;
  total_pages: number;
};

/** @deprecated Use SearchMediaResult */
export type SearchTmdbResult = SearchMediaResult;

export class MediaService {
  private static async invokeEdgeFunction<T>(
    functionName: string,
    params: Record<string, string>
  ): Promise<T> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

    const url = new URL(`${supabaseUrl}/functions/v1/${functionName}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: supabaseKey,
        },
      });
    } catch (error) {
      throw toAppError(error, `${functionName} request failed`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw createHttpError(functionName, response, body);
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw toAppError(error, `${functionName} returned invalid JSON`);
    }
  }

  static async getMediaDetail(mediaId: string): Promise<Media> {
    return this.invokeEdgeFunction<Media>("media-detail", { id: mediaId });
  }

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

    throwIfError(error, "Failed to load popular movies");

    if (!data) return [];

    // PostgREST returns `{ rank, media: {...} }`
    // Always enforce rank ordering client-side too (defensive).
    return (data as any[])
      .slice()
      .sort((a, b) => (Number(a?.rank) || 0) - (Number(b?.rank) || 0))
      .map((row) => row.media as Media | null)
      .filter(Boolean) as Media[];
  }

  /**
   * Search media via the search-media edge function.
   * Supports "movie" (TMDB) and "game" (IGDB).
   * Results are automatically cached in the media table for future local queries.
   */
  static async searchExternal(
    query: string,
    type: "movie" | "game" = "movie",
    page: number = 1
  ): Promise<SearchMediaResult> {
    return this.invokeEdgeFunction<SearchMediaResult>("search-media", {
      page: String(page),
      query,
      type,
    });
  }

  static async getSeasonEpisodes(
    mediaId: string,
    seasonNumber: number
  ): Promise<TvEpisode[]> {
    return this.invokeEdgeFunction<TvEpisode[]>("tv-season-detail", {
      media_id: mediaId,
      season_number: String(seasonNumber),
    });
  }

  static async getPreferredMedia(options: {
    preferredMedia?: readonly string[];
    searchQuery?: string;
    userId: string;
  }): Promise<Media[]> {
    const PROFILE_TO_DB_MAP: Record<
      string,
      ("game" | "movie" | "tv_show" | "book")[]
    > = {
      Books: ["book"],
      Games: ["game"],
      Movies: ["movie", "tv_show"],
      TVShows: ["tv_show"],
    };
    const LOCAL_RESULT_THRESHOLD = 5;

    const dbTypes = (options.preferredMedia ?? [])
      .flatMap((value) => PROFILE_TO_DB_MAP[value] ?? [])
      .filter(Boolean);
    const mediaTypesToQuery =
      dbTypes.length > 0
        ? dbTypes
        : (["game", "movie", "tv_show", "book"] as const);

    let query = supabase
      .from("media")
      .select("*")
      .in("media_type", [...mediaTypesToQuery]);

    const trimmedQuery = options.searchQuery?.trim() ?? "";
    if (trimmedQuery.length > 0) {
      query = query.ilike("title", `%${trimmedQuery}%`);
    }

    const { data, error } = await query.limit(50);
    throwIfError(error, "Failed to load preferred media");

    const localResults = (data as Media[] | null) ?? [];

    if (
      trimmedQuery.length >= 2 &&
      localResults.length < LOCAL_RESULT_THRESHOLD
    ) {
      const wantsGames = mediaTypesToQuery.includes("game");
      const wantsMovies =
        mediaTypesToQuery.includes("movie") ||
        mediaTypesToQuery.includes("tv_show");
      const searches: Promise<Media[]>[] = [];

      if (wantsMovies) {
        searches.push(
          this.searchExternal(trimmedQuery, "movie")
            .then((result) => result.data)
            .catch((error) => {
              console.warn("Movie search fallback failed", error);
              return [];
            })
        );
      }

      if (wantsGames) {
        searches.push(
          this.searchExternal(trimmedQuery, "game")
            .then((result) => result.data)
            .catch((error) => {
              console.warn("Game search fallback failed", error);
              return [];
            })
        );
      }

      if (searches.length > 0) {
        const results = await Promise.all(searches);
        const externalItems = results.flat();

        if (externalItems.length > 0) {
          const existingIds = new Set(localResults.map((item) => item.id));
          const newItems = externalItems.filter(
            (item) => !existingIds.has(item.id)
          );

          return [...localResults, ...newItems].slice(0, 50);
        }
      }
    }

    return localResults;
  }

  /** @deprecated Use searchExternal */
  static async searchTmdb(
    query: string,
    page: number = 1
  ): Promise<SearchMediaResult> {
    return this.searchExternal(query, "movie", page);
  }
}
