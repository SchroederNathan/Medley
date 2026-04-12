import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { AuthContext } from "../contexts/auth-context";
import { userMediaQueryOptions } from "../lib/query-options";
import { Media } from "../types/media";

/**
 * Hook for fetching user's media library with full media details
 * Optionally supports search filtering on the client side
 */
export function useUserMedia(searchQuery?: string) {
  const { user, isLoggedIn } = useContext(AuthContext);

  const query = useQuery<Media[]>({
    ...userMediaQueryOptions(user?.id ?? ""),
    enabled: isLoggedIn && !!user?.id,
  });
  const {
    data,
    error,
    fetchStatus,
    isError,
    isLoading,
    isPending,
    isRefetching,
    refetch,
    status,
  } = query;

  // Client-side search filtering
  const filteredData = useMemo(() => {
    if (!data || !searchQuery?.trim()) {
      return data || [];
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    return data.filter(
      (item) =>
        item.title?.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery) ||
        item.media_type?.toLowerCase().includes(normalizedQuery)
    );
  }, [data, searchQuery]);

  return {
    data: searchQuery?.trim() ? filteredData : data,
    error,
    fetchStatus,
    isError,
    isLoading,
    isPending,
    isRefetching,
    refetch,
    searchResults: filteredData,
    status,
  };
}
