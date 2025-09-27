import React, { useState, useEffect } from "react";
import { usePreferredMedia } from "./use-preferred-media";
import { useHomeAnimation } from "../contexts/home-animation-context";

export const useSharedSearch = () => {
  const [query, setQuery] = useState("");
  const { screenView } = useHomeAnimation();
  const mediaQuery = usePreferredMedia(query);

  // Clear search when returning to favorites view
  useEffect(() => {
    if (screenView.value === "favorites") {
      setQuery("");
    }
  }, [screenView.value]);

  const handleSearchChange = (text: string) => {
    setQuery(text);
  };

  const handleSearchClear = () => {
    setQuery("");
  };

  // Return flat search results for horizontal media cards
  const searchResults = React.useMemo(() => {
    return mediaQuery.data || [];
  }, [mediaQuery.data]);

  return {
    query,
    searchResults,
    isLoading: mediaQuery.isLoading,
    isError: mediaQuery.isError,
    handleSearchChange,
    handleSearchClear,
  };
};
