import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { userProfileQueryOptions } from "../lib/query-options";
import { DEFAULT_PROFILE_LAYOUT } from "../lib/profile-blocks/registry";
import type { ProfileLayout } from "../lib/profile-blocks/types";
import { Profile } from "../services/profileService";

/**
 * Returns a user's profile layout, derived from the already-cached profile
 * (no extra fetch — shares the userProfile query key). Falls back to the
 * default seeded layout when the user hasn't customized their profile.
 * Defaults to the current user; pass a `userId` for another user's profile.
 */
export function useProfileLayout(userId?: string): ProfileLayout {
  const { user, isLoggedIn } = useContext(AuthContext);
  const targetId = userId ?? user?.id ?? "";

  const { data: profile } = useQuery<Profile | null>({
    ...userProfileQueryOptions(targetId),
    enabled: !!targetId && (!!userId || isLoggedIn),
  });

  return profile?.profile_layout ?? DEFAULT_PROFILE_LAYOUT;
}
