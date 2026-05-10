import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  CollectionService,
  CollectionWithItems,
} from "../services/collectionService";
import { FollowsService } from "../services/followsService";
import { MediaService } from "../services/mediaService";
import { Profile, ProfileService } from "../services/profileService";
import {
  MediaTypeDb,
  RecommendationFilters,
  RecommendationService,
} from "../services/recommendationService";
import {
  UserMediaService,
  UserMediaItem,
  UserReview,
} from "../services/userMediaService";
import { Media, TvEpisode } from "../types/media";

export type RecommendationQueryInput =
  | { kind: "all"; filters?: RecommendationFilters }
  | { kind: "favorites"; filters?: RecommendationFilters }
  | { kind: "type"; mediaType: MediaTypeDb; filters?: RecommendationFilters }
  | {
      kind: "similar";
      sourceMediaId: string;
      targetType?: MediaTypeDb;
      filters?: RecommendationFilters;
    };

export function userProfileQueryOptions(userId: string) {
  return queryOptions<Profile | null>({
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: () => ProfileService.getProfile(userId),
    queryKey: queryKeys.userProfile.detail(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30,
  });
}

export function userMediaQueryOptions(userId: string) {
  return queryOptions<Media[]>({
    queryFn: () => UserMediaService.getUserMediaWithDetails(userId),
    queryKey: queryKeys.userMedia.all(userId),
    staleTime: 1000 * 60 * 10,
  });
}

export function userMediaItemQueryOptions(userId: string, mediaId: string) {
  return queryOptions<UserMediaItem | null>({
    queryFn: () => UserMediaService.getUserMediaItem(userId, mediaId),
    queryKey: queryKeys.userMediaItem.detail(userId, mediaId),
    staleTime: 1000 * 60 * 5,
  });
}

export function userReviewsQueryOptions(userId: string) {
  return queryOptions<UserReview[]>({
    queryFn: () => UserMediaService.getUserReviews(userId),
    queryKey: queryKeys.userReviews.all(userId),
    staleTime: 1000 * 60 * 10,
  });
}

export function userCollectionsQueryOptions(userId: string) {
  return queryOptions<CollectionWithItems[]>({
    queryFn: () => CollectionService.getUserCollections(userId),
    queryKey: queryKeys.collections.all(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function followCountsQueryOptions(userId: string) {
  return queryOptions<{ followers: number; following: number }>({
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        FollowsService.getFollowerCount(userId),
        FollowsService.getFollowingCount(userId),
      ]);
      return { followers, following };
    },
    queryKey: queryKeys.follows.counts(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function collectionDetailQueryOptions(collectionId: string) {
  return queryOptions<CollectionWithItems | null>({
    queryFn: () => CollectionService.getCollection(collectionId),
    queryKey: queryKeys.collections.detail(collectionId),
    staleTime: 1000 * 60 * 5,
  });
}

export function mediaDetailQueryOptions(mediaId: string) {
  return queryOptions<Media>({
    gcTime: 1000 * 60 * 30,
    queryFn: () => MediaService.getMediaDetail(mediaId),
    queryKey: queryKeys.media.detail(mediaId),
    staleTime: 1000 * 60 * 5,
  });
}

export function popularMoviesQueryOptions(limit: number = 20) {
  return queryOptions<Media[]>({
    queryFn: () => MediaService.getPopularMovies(limit),
    queryKey: queryKeys.media.popularMovies(limit),
    staleTime: 1000 * 60 * 60 * 12,
  });
}

export function seasonEpisodesQueryOptions(
  mediaId: string,
  seasonNumber: number
) {
  return queryOptions<TvEpisode[]>({
    gcTime: 1000 * 60 * 60,
    queryFn: () => MediaService.getSeasonEpisodes(mediaId, seasonNumber),
    queryKey: queryKeys.media.seasonEpisodes(mediaId, seasonNumber),
    staleTime: 1000 * 60 * 30,
  });
}

export function preferredMediaQueryOptions(options: {
  preferredMedia?: readonly string[];
  searchQuery?: string;
  userId: string;
}) {
  const searchQuery = options.searchQuery?.trim();

  return queryOptions<Media[]>({
    gcTime: 1000 * 60 * 60,
    queryFn: () =>
      MediaService.getPreferredMedia({
        preferredMedia: options.preferredMedia,
        searchQuery,
        userId: options.userId,
      }),
    queryKey: queryKeys.media.preferred(
      options.userId,
      options.preferredMedia ?? [],
      searchQuery
    ),
    staleTime: 1000 * 60 * 5,
  });
}

export function recommendationsQueryOptions(options: {
  request: RecommendationQueryInput;
  userId: string;
}) {
  const { request, userId } = options;

  switch (request.kind) {
    case "all":
      return queryOptions<Media[]>({
        queryFn: () => RecommendationService.getAll(userId, request.filters),
        queryKey: queryKeys.recommendations.all(userId, request.filters),
        staleTime: 1000 * 60 * 15,
      });
    case "favorites":
      return queryOptions<Media[]>({
        queryFn: () =>
          RecommendationService.getFromFavorites(userId, request.filters),
        queryKey: queryKeys.recommendations.favorites(userId, request.filters),
        refetchOnMount: "always",
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 15,
      });
    case "type":
      return queryOptions<Media[]>({
        queryFn: () =>
          RecommendationService.getByType(
            userId,
            request.mediaType,
            request.filters
          ),
        queryKey: queryKeys.recommendations.byType(
          userId,
          request.mediaType,
          request.filters
        ),
        staleTime: 1000 * 60 * 15,
      });
    case "similar":
      return queryOptions<Media[]>({
        queryFn: () =>
          RecommendationService.getSimilarToMedia(
            userId,
            request.sourceMediaId,
            request.targetType,
            request.filters
          ),
        queryKey: queryKeys.recommendations.similar(
          userId,
          request.sourceMediaId,
          request.targetType,
          request.filters
        ),
        staleTime: 1000 * 60 * 15,
      });
  }
}
