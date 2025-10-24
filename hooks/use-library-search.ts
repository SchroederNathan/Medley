import { useMemo } from "react";
import { useUserMedia } from "./use-user-media";

export const useLibrarySearch = (searchQuery: string) => {
  const userMediaQuery = useUserMedia();

  const searchResults = useMemo(() => {
    if (!userMediaQuery.data || !searchQuery.trim()) {
      return userMediaQuery.data || [];
    }

    const query = searchQuery.toLowerCase().trim();
    return userMediaQuery.data.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.media_type?.toLowerCase().includes(query)
    );
  }, [userMediaQuery.data, searchQuery]);

  return {
    query: searchQuery,
    searchResults,
    isLoading: userMediaQuery.isLoading,
    isError: userMediaQuery.isError,
    handleSearchChange: (text: string) => text,
    handleSearchClear: () => "",
  };
};
