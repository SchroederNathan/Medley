import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export interface UserReview {
  id: string;
  review: string;
  rating: number;
  createdAt: string;
  media: Media;
}

export function useUserReviews() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<UserReview[]>({
    queryKey: ["userReviews", user?.id],
    enabled: isLoggedIn && !!user?.id,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // Fetch user_media entries that have reviews
      const { data: userMediaRows, error: userMediaError } = await supabase
        .from("user_media")
        .select("id, review, user_rating, media_id, added_at")
        .eq("user_id", user.id)
        .not("review", "is", null)
        .order("added_at", { ascending: false });

      if (userMediaError) throw userMediaError;
      if (!userMediaRows || userMediaRows.length === 0) return [];

      const mediaIds = userMediaRows.map((r: any) => r.media_id);

      // Fetch media details
      const { data: mediaRows, error: mediaError } = await supabase
        .from("media")
        .select("*")
        .in("id", mediaIds);

      if (mediaError) throw mediaError;

      // Create a map of media by ID
      const mediaMap = new Map<string, Media>();
      (mediaRows || []).forEach((m: Media) => {
        mediaMap.set(m.id, m);
      });

      // Combine user_media with media details
      const reviews: UserReview[] = userMediaRows
        .map((um: any) => {
          const media = mediaMap.get(um.media_id);
          if (!media) return null;

          return {
            id: um.id,
            review: um.review,
            rating: um.user_rating || 0,
            createdAt: um.added_at,
            media,
          };
        })
        .filter((r): r is UserReview => r !== null);

      return reviews;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

