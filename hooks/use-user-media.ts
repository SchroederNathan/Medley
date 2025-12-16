import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { AuthContext } from "../contexts/auth-context";
import { queryKeys } from "../lib/query-keys";
import { UserMediaService } from "../services/userMediaService";
import { Media } from "../types/media";

/**
 * Hook for fetching user's media library with full media details
 * Optionally supports search filtering on the client side
 */
export function useUserMedia(searchQuery?: string) {
  const { user, isLoggedIn } = useContext(AuthContext);

  const query = useQuery<Media[]>({
    queryKey: queryKeys.userMedia.all(user?.id ?? ""),
    enabled: isLoggedIn && !!user?.id,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      return UserMediaService.getUserMediaWithDetails(user.id);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Client-side search filtering
  const filteredData = useMemo(() => {
    if (!query.data || !searchQuery?.trim()) {
      return query.data || [];
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    return query.data.filter(
      (item) =>
        item.title?.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery) ||
        item.media_type?.toLowerCase().includes(normalizedQuery)
    );
  }, [query.data, searchQuery]);

  return {
    ...query,
    data: searchQuery?.trim() ? filteredData : query.data,
    // Expose filtered data separately if needed
    searchResults: filteredData,
  };
}
