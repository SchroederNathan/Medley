/**
 * Centralized query key factory for TanStack Query
 * Using this pattern ensures consistent query keys across the app
 * and makes invalidation easier to manage
 */
import type { RecommendationFilters } from "../services/recommendationService";

const normalizeStringArray = (values?: readonly string[]) => {
  if (!values?.length) {
    return undefined;
  }

  return [...new Set(values)].sort();
};

export function normalizePreferredMediaTypes(values?: readonly string[]) {
  return normalizeStringArray(values) ?? [];
}

export function normalizeRecommendationFilters(
  filters?: RecommendationFilters
) {
  if (!filters) {
    return undefined;
  }

  const normalized = {
    ...filters,
    excludeGenres: normalizeStringArray(filters.excludeGenres),
    excludeMediaIds: normalizeStringArray(filters.excludeMediaIds),
    includeGenresAll: normalizeStringArray(filters.includeGenresAll),
    includeGenresAny: normalizeStringArray(filters.includeGenresAny),
  };

  const entries = Object.entries(normalized).filter(([, value]) => {
    if (value == null) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export const queryKeys = {
  // User media queries
  userMedia: {
    root: (userId: string) => ["userMedia", userId] as const,
    all: (userId: string) => ["userMedia", userId] as const,
    withSearch: (userId: string, search: string) =>
      ["userMedia", userId, { search }] as const,
  },

  // User reviews
  userReviews: {
    root: (userId: string) => ["userReviews", userId] as const,
    all: (userId: string) => ["userReviews", userId] as const,
  },

  // User profile
  userProfile: {
    root: (userId: string) => ["userProfile", userId] as const,
    detail: (userId: string) => ["userProfile", userId] as const,
  },

  // Collections
  collections: {
    root: (userId: string) => ["collections", userId] as const,
    all: (userId: string) => ["collections", userId] as const,
    detail: (collectionId: string) => ["collection", collectionId] as const,
  },

  // Recommendations
  recommendations: {
    root: (userId: string) => ["recommendations", userId] as const,
    all: (userId: string, filters?: RecommendationFilters) =>
      [
        "recommendations",
        userId,
        "all",
        normalizeRecommendationFilters(filters),
      ] as const,
    favorites: (userId: string, filters?: RecommendationFilters) =>
      [
        "recommendations",
        userId,
        "favorites",
        normalizeRecommendationFilters(filters),
      ] as const,
    byType: (
      userId: string,
      mediaType: string,
      filters?: RecommendationFilters
    ) =>
      [
        "recommendations",
        userId,
        "type",
        mediaType,
        normalizeRecommendationFilters(filters),
      ] as const,
    similar: (
      userId: string,
      sourceMediaId: string,
      targetType?: string,
      filters?: RecommendationFilters
    ) =>
      [
        "recommendations",
        userId,
        "similar",
        sourceMediaId,
        targetType,
        normalizeRecommendationFilters(filters),
      ] as const,
  },

  // Media items
  media: {
    preferredRoot: (userId: string) => ["preferredMedia", userId] as const,
    detail: (mediaId: string) => ["mediaItem", mediaId] as const,
    preferred: (
      userId: string,
      preferredMedia: readonly string[],
      search?: string
    ) =>
      [
        "preferredMedia",
        userId,
        {
          preferredMedia: normalizePreferredMediaTypes(preferredMedia),
          search: search ?? "",
        },
      ] as const,
    popularMovies: (limit: number = 20) =>
      ["popularMovies", { limit }] as const,
    seasonEpisodes: (mediaId: string, seasonNumber: number) =>
      ["seasonEpisodes", mediaId, seasonNumber] as const,
  },

  // User media item (single item status/rating)
  userMediaItem: {
    detail: (userId: string, mediaId: string) =>
      ["userMediaItem", userId, mediaId] as const,
  },

  mediaGenres: {
    list: (userId: string, mediaType?: string, status?: string) =>
      ["userMediaGenres", userId, mediaType, status] as const,
  },

  genreRecommendations: {
    list: (userId: string, mediaType: string) =>
      ["genreRecommendations", userId, mediaType] as const,
  },

  // Local movie showtimes (bucketed coords keep nearby users on one cache entry)
  showtimes: {
    list: (latBucket: number, lngBucket: number, date: string) =>
      ["showtimes", latBucket, lngBucket, date] as const,
  },
} as const;

// Helper type for extracting query key types
export type QueryKeys = typeof queryKeys;
