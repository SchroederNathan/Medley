// utils/genreMapper.ts
// Works with your existing media table structure
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./utils";

type MediaType = "movie" | "tv" | "game";

const MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

const IGDB_GENRES: Record<number, string> = {
  2: "Point-and-click",
  4: "Fighting",
  5: "Shooter",
  7: "Music",
  8: "Platform",
  9: "Puzzle",
  10: "Racing",
  11: "Real Time Strategy (RTS)",
  12: "Role-playing (RPG)",
  13: "Simulator",
  14: "Sport",
  15: "Strategy",
  16: "Turn-based strategy (TBS)",
  24: "Tactical",
  25: "Hack and slash/Beat 'em up",
  26: "Quiz/Trivia",
  30: "Pinball",
  31: "Adventure",
  32: "Indie",
  33: "Arcade",
  34: "Visual Novel",
  35: "Card & Board Game",
  36: "MOBA",
};

// Genre mapping to unified system
const GENRE_MAPPINGS: Record<MediaType, Record<number, string[]>> = {
  movie: {
    28: ["action"],
    12: ["adventure"],
    16: ["animation"],
    35: ["comedy"],
    80: ["crime"],
    99: ["documentary"],
    18: ["drama"],
    10751: ["family"],
    14: ["fantasy"],
    36: ["drama"],
    27: ["horror"],
    10402: ["music"],
    9648: ["mystery"],
    10749: ["romance"],
    878: ["sci_fi"],
    53: ["thriller"],
    10752: ["war"],
    37: ["western"],
  },
  tv: {
    10759: ["action", "adventure"],
    16: ["animation"],
    35: ["comedy"],
    80: ["crime"],
    99: ["documentary"],
    18: ["drama"],
    10751: ["family"],
    10762: ["family"],
    9648: ["mystery"],
    10763: ["news"],
    10764: ["reality"],
    10765: ["sci_fi", "fantasy"],
    10766: ["soap"],
    10767: ["talk"],
    10768: ["war"],
    37: ["western"],
  },
  game: {
    2: ["adventure"],
    4: ["fighting"],
    5: ["shooter"],
    7: ["music"],
    8: ["platform"],
    9: ["puzzle"],
    10: ["racing"],
    11: ["strategy"],
    12: ["rpg"],
    13: ["simulator"],
    14: ["sport"],
    15: ["strategy"],
    16: ["strategy"],
    24: ["strategy"],
    25: ["action"],
    26: ["puzzle"],
    31: ["adventure"],
    32: ["indie"],
    33: ["action"],
    34: ["visual_novel"],
    35: ["strategy"],
    36: ["strategy"],
  },
};

export class GenreMapper {
  static mapToUnified(genreIds: number[], mediaType: MediaType): string[] {
    const mapping = GENRE_MAPPINGS[mediaType];
    const unifiedGenres = new Set<string>();

    genreIds.forEach((id) => {
      const genres = mapping[id];
      if (genres) {
        genres.forEach((genre) => unifiedGenres.add(genre));
      }
    });

    return Array.from(unifiedGenres);
  }

  static getGenreNames(genreIds: number[], mediaType: MediaType): string[] {
    const genreMap =
      mediaType === "movie"
        ? MOVIE_GENRES
        : mediaType === "tv"
          ? TV_GENRES
          : IGDB_GENRES;
    return genreIds.map((id) => genreMap[id]).filter(Boolean);
  }
}

// Service to work with your existing schema
export class MediaGenreService {
  /**
   * Update existing media item with genre mapping
   */
  static async updateMediaWithGenres(
    supabase: SupabaseClient,
    mediaId: string,
    genreIds: number[],
    mediaType: MediaType
  ) {
    const unifiedGenres = GenreMapper.mapToUnified(genreIds, mediaType);

    const { data, error } = await supabase
      .from("media")
      .update({
        external_genre_ids: genreIds,
        unified_genres: unifiedGenres,
      })
      .eq("id", mediaId)
      .select();

    if (error) {
      console.error("Error updating media genres:", error);
      return null;
    }

    return data;
  }

  /**
   * Create new media item with genres (works with your existing structure)
   */
  static async createMediaWithGenres(
    supabase: SupabaseClient,
    mediaData: {
      title: string;
      media_type: MediaType;
      description?: string;
      genres?: string; // Your existing genres field
      year?: number;
      rating_average?: number;
      rating_count?: number;
      poster_url?: string;
      backdrop_url?: string;
      duration_minutes?: number;
      external_ids?: any;
      metadata?: any;
      // New fields
      genreIds: number[];
    }
  ) {
    const unifiedGenres = GenreMapper.mapToUnified(
      mediaData.genreIds,
      mediaData.media_type
    );

    const { data, error } = await supabase
      .from("media")
      .insert({
        ...mediaData,
        external_genre_ids: mediaData.genreIds,
        unified_genres: unifiedGenres,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating media with genres:", error);
      return null;
    }

    return data;
  }

  /**
   * Get cross-media recommendations using the database function
   */
  static async getRecommendations(
    supabase: SupabaseClient,
    userId: string,
    targetMediaType: MediaType,
    limit: number = 20
  ) {
    const { data, error } = await supabase.rpc(
      "get_cross_media_recommendations",
      {
        target_user_id: userId,
        target_media_type: targetMediaType,
        recommendation_limit: limit,
      }
    );

    if (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Add media to user's list with status
   */
  static async addToUserList(
    supabase: SupabaseClient,
    userId: string,
    mediaId: string,
    status: "want" | "watching" | "reading" | "playing" | "completed" = "want",
    rating?: number
  ) {
    const { data, error } = await supabase
      .from("user_media")
      .insert({
        user_id: userId,
        media_id: mediaId,
        status: status,
        user_rating: rating,
        added_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("Error adding to user list:", error);
      return null;
    }

    return data;
  }

  /**
   * Get user's media with genre information
   */
  static async getUserMediaWithGenres(
    supabase: SupabaseClient,
    userId: string,
    mediaType?: MediaType,
    status?: string
  ) {
    let query = supabase
      .from("user_media_with_genres")
      .select("*")
      .eq("user_id", userId);

    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("added_at", { ascending: false });

    if (error) {
      console.error("Error getting user media:", error);
      return [];
    }

    return data || [];
  }
}

// React hooks for your components
export const useRecommendations = (
  userId: string,
  targetMediaType: MediaType
) => {
  return useQuery({
    queryKey: ["recommendations", userId, targetMediaType],
    queryFn: () =>
      MediaGenreService.getRecommendations(
        supabase,
        userId,
        targetMediaType,
        20
      ),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useUserMediaWithGenres = (
  userId: string,
  mediaType?: MediaType,
  status?: string
) => {
  return useQuery({
    queryKey: ["user-media-genres", userId, mediaType, status],
    queryFn: () =>
      MediaGenreService.getUserMediaWithGenres(
        supabase,
        userId,
        mediaType,
        status
      ),
    enabled: !!userId,
  });
};
