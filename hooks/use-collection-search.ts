import React, { useCallback, useMemo, useState } from "react";
import { Media } from "../types/media";
import { usePreferredMedia } from "./use-preferred-media";
import { useRecommendations } from "./use-recommendations";

export const useCollectionSearch = (initialMedia?: Media[]) => {
  const [query, setQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Media[]>(
    initialMedia || [],
  );
  const prevInitialMediaRef = React.useRef<Media[] | undefined>(initialMedia);

  // Sync selectedMedia when initialMedia changes (for edit mode)
  // Only update if initialMedia changes from undefined/empty to having items
  React.useEffect(() => {
    const prevInitialMedia = prevInitialMediaRef.current;
    const hasNewInitialMedia =
      initialMedia !== undefined &&
      initialMedia.length > 0 &&
      (prevInitialMedia === undefined ||
        prevInitialMedia.length === 0 ||
        JSON.stringify(prevInitialMedia) !== JSON.stringify(initialMedia));

    if (hasNewInitialMedia && selectedMedia.length === 0) {
      setSelectedMedia(initialMedia);
    }
    prevInitialMediaRef.current = initialMedia;
  }, [initialMedia, selectedMedia.length]);

  const mediaQuery = usePreferredMedia(query);
  const recommendationsQuery = useRecommendations({ kind: "all" });

  const handleSearchChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleSearchClear = useCallback(() => {
    setQuery("");
  }, []);

  const addMediaToCollection = useCallback(
    (media: Media) => {
      // Check if media is already in the collection
      const isAlreadyAdded = selectedMedia.some((item) => item.id === media.id);
      if (!isAlreadyAdded) {
        setSelectedMedia((prev) => [...prev, media]);
      }
    },
    [selectedMedia]
  );

  const removeMediaFromCollection = useCallback((mediaId: string) => {
    setSelectedMedia((prev) => prev.filter((item) => item.id !== mediaId));
  }, []);

  const reorderMedia = useCallback((newOrder: Media[]) => {
    setSelectedMedia(newOrder);
  }, []);

  // Return flat search results for horizontal media cards
  const searchResults = React.useMemo(() => {
    // If there's a search query, return search results
    if (query.trim()) {
      return mediaQuery.data || [];
    }

    // If no search query, return recommendations
    return recommendationsQuery.data || [];
  }, [mediaQuery.data, recommendationsQuery.data, query]);

  return useMemo(
    () => ({
      query,
      searchResults,
      selectedMedia,
      isLoading: query.trim()
        ? mediaQuery.isLoading
        : recommendationsQuery.isLoading,
      isError: query.trim() ? mediaQuery.isError : recommendationsQuery.isError,
      handleSearchChange,
      handleSearchClear,
      addMediaToCollection,
      removeMediaFromCollection,
      reorderMedia,
    }),
    [
      query,
      searchResults,
      selectedMedia,
      mediaQuery.isLoading,
      mediaQuery.isError,
      recommendationsQuery.isLoading,
      recommendationsQuery.isError,
      handleSearchChange,
      handleSearchClear,
      addMediaToCollection,
      removeMediaFromCollection,
      reorderMedia,
    ]
  );
};
