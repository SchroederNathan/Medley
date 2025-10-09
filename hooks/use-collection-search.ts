import React, { useState, useEffect, useContext } from "react";
import { usePreferredMedia } from "./use-preferred-media";
import { useRecommendations } from "./use-recommendations";
import { AuthContext } from "../contexts/auth-context";
import { Media } from "../types/media";

export const useCollectionSearch = () => {
  const [query, setQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const { isLoggedIn, user } = useContext(AuthContext);
  
  const mediaQuery = usePreferredMedia(query);
  const recommendationsQuery = useRecommendations({ kind: "all" });

  const handleSearchChange = (text: string) => {
    setQuery(text);
  };

  const handleSearchClear = () => {
    setQuery("");
  };

  const addMediaToCollection = (media: Media) => {
    // Check if media is already in the collection
    const isAlreadyAdded = selectedMedia.some(item => item.id === media.id);
    if (!isAlreadyAdded) {
      setSelectedMedia(prev => [...prev, media]);
    }
  };

  const removeMediaFromCollection = (mediaId: string) => {
    setSelectedMedia(prev => prev.filter(item => item.id !== mediaId));
  };

  const reorderMedia = (newOrder: Media[]) => {
    setSelectedMedia(newOrder);
  };

  // Return flat search results for horizontal media cards
  const searchResults = React.useMemo(() => {
    // If there's a search query, return search results
    if (query.trim()) {
      return mediaQuery.data || [];
    }
    
    // If no search query, return recommendations
    return recommendationsQuery.data || [];
  }, [mediaQuery.data, recommendationsQuery.data, query]);

  return {
    query,
    searchResults,
    selectedMedia,
    isLoading: query.trim() ? mediaQuery.isLoading : recommendationsQuery.isLoading,
    isError: query.trim() ? mediaQuery.isError : recommendationsQuery.isError,
    handleSearchChange,
    handleSearchClear,
    addMediaToCollection,
    removeMediaFromCollection,
    reorderMedia,
  };
};
