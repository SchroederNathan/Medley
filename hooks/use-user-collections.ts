import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { CollectionService } from "../services/collectionService";

export const useUserCollections = () => {
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return CollectionService.getUserCollections(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
