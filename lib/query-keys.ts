/**
 * Centralized query key factory for TanStack Query
 * Using this pattern ensures consistent query keys across the app
 * and makes invalidation easier to manage
 */

export const queryKeys = {
  // User media queries
  userMedia: {
    all: (userId: string) => ["userMedia", userId] as const,
    withSearch: (userId: string, search: string) =>
      ["userMedia", userId, { search }] as const,
  },

  // User reviews
  userReviews: {
    all: (userId: string) => ["userReviews", userId] as const,
    byMedia: (userId: string, mediaId: string) =>
      ["userReviews", userId, mediaId] as const,
  },

  // User profile
  userProfile: {
    detail: (userId: string) => ["userProfile", userId] as const,
  },

  // Collections
  collections: {
    all: (userId: string) => ["collections", userId] as const,
    detail: (collectionId: string) => ["collection", collectionId] as const,
  },

  // Recommendations
  recommendations: {
    all: (userId: string) => ["recommendations", userId, "all"] as const,
    byType: (userId: string, mediaType: string) =>
      ["recommendations", userId, "type", mediaType] as const,
    similar: (userId: string, sourceMediaId: string, targetType?: string) =>
      ["recommendations", userId, "similar", sourceMediaId, targetType] as const,
  },

  // Media items
  media: {
    detail: (mediaId: string) => ["mediaItem", mediaId] as const,
    preferred: (userId: string, search?: string) =>
      ["preferredMedia", userId, search ?? ""] as const,
  },

  // User media item (single item status/rating)
  userMediaItem: {
    detail: (userId: string, mediaId: string) =>
      ["userMediaItem", userId, mediaId] as const,
  },
} as const;

// Helper type for extracting query key types
export type QueryKeys = typeof queryKeys;

