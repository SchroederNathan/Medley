import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export function useUserMedia() {
  const { user, isLoggedIn } = useContext(AuthContext);

  return useQuery<Media[]>({
    queryKey: ["userLibrary", user?.id],
    enabled: isLoggedIn && !!user?.id,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // 1) Fetch the user's list from user_media
      const { data: userMediaRows, error: userMediaError } = await supabase
        .from("user_media")
        .select("media_id, added_at")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (userMediaError) throw userMediaError;
      const mediaIds = (userMediaRows || []).map((r: any) => r.media_id);
      if (mediaIds.length === 0) return [];

      // 2) Fetch media details in a single query
      const { data: mediaRows, error: mediaError } = await supabase
        .from("media")
        .select("*")
        .in("id", mediaIds);
      if (mediaError) throw mediaError;

      // 3) Preserve user_media order (added_at desc)
      const orderMap = new Map<string, number>();
      mediaIds.forEach((id, idx) => orderMap.set(id, idx));
      const sorted = (mediaRows as Media[]).slice().sort((a, b) => {
        const ai = orderMap.get(a.id) ?? 0;
        const bi = orderMap.get(b.id) ?? 0;
        return ai - bi;
      });

      return sorted;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
