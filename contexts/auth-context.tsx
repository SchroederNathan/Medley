import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { queryClient } from "../lib/query-client";
import { clearPersistedQueryCache } from "../lib/storage";
import { ProfileService } from "../services/profileService";

type User = {
  id?: string;
  name?: string;
  preferred_media?: ("Games" | "Movies" | "Books")[];
  avatar_url?: string;
};

type AuthState = {
  isLoggedIn: boolean;
  isReady: boolean;
  user?: User;
  logOut: () => void;
  setUserName: (name: string) => void;
  setUserPreferredMedia: (media: ("Games" | "Movies" | "Books")[]) => void;
  completeOnboarding: (
    mediaPreferences?: ("Games" | "Movies" | "Books")[]
  ) => Promise<void>;
  updateUserFromProfile: (profile: {
    id?: string;
    name?: string;
    avatar_url?: string;
    media_preferences?: { preferred_media?: ("Games" | "Movies" | "Books")[] };
  }) => void;
};

export const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  isReady: false,
  user: undefined,
  logOut: () => {},
  setUserName: () => {},
  setUserPreferredMedia: () => {},
  completeOnboarding: async () => {},
  updateUserFromProfile: () => {},
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [profileResolved, setProfileResolved] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState<User>({});
  const router = useRouter();

  const clerkUserId = clerkUser?.id;
  const clerkFirstName = clerkUser?.firstName;

  /**
   * Updates the user state from profile data
   * Use this after fetching profile via useUserProfile hook
   */
  const updateUserFromProfile = (profile: {
    id?: string;
    name?: string;
    avatar_url?: string;
    media_preferences?: { preferred_media?: ("Games" | "Movies" | "Books")[] };
  }) => {
    if (profile) {
      setUser((prevUser) => ({
        ...prevUser,
        id: prevUser.id || profile.id,
        name: profile.name || prevUser.name,
        avatar_url: profile.avatar_url || prevUser.avatar_url,
        preferred_media:
          profile.media_preferences?.preferred_media ||
          prevUser.preferred_media,
      }));
    }
  };

  const setUserName = (name: string) => {
    setUser({ ...user, name });
  };

  const setUserPreferredMedia = (media: ("Games" | "Movies" | "Books")[]) => {
    setUser({ ...user, preferred_media: media });
  };

  const completeOnboarding = async (
    preferredMedia?: ("Games" | "Movies" | "Books")[]
  ) => {
    if (!clerkUserId || !user.name || !preferredMedia) {
      throw new Error("Missing required user information");
    }

    // Use ProfileService for onboarding completion
    await ProfileService.completeOnboarding(
      clerkUserId,
      user.name,
      preferredMedia
    );

    setUser((prev) => ({ ...prev, id: clerkUserId }));
    setIsOnboarded(true);
    router.replace("/(tabs)");
  };

  const logOut = async () => {
    setUser({});
    setIsOnboarded(false);

    try {
      await signOut();
    } catch (e) {
      console.warn("Failed to sign out of Clerk", e);
    }
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      clearPersistedQueryCache();
    } catch (e) {
      console.warn("Failed clearing persisted query cache", e);
    }
    router.replace("/onboarding");
  };

  // Clerk restores the session from its token cache; once it settles, load
  // the profile to decide whether onboarding is complete.
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUserId) {
      setUser({});
      setIsOnboarded(false);
      setProfileResolved(true);
      return;
    }

    let cancelled = false;
    setProfileResolved(false);

    const loadProfile = async () => {
      let profile = null;
      try {
        profile = await ProfileService.getProfile(clerkUserId);
      } catch (error) {
        console.warn("Failed to fetch user profile on init:", error);
      }

      if (cancelled) return;

      setUser({
        id: clerkUserId,
        name: profile?.name ?? clerkFirstName ?? undefined,
        avatar_url: profile?.avatar_url,
        preferred_media: profile?.media_preferences?.preferred_media,
      });
      setIsOnboarded(profile?.media_preferences?.onboarding_completed === true);
      setProfileResolved(true);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUserId, clerkFirstName]);

  const isReady = isLoaded && profileResolved;
  const isLoggedIn = Boolean(isSignedIn) && isOnboarded;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isReady,
        logOut,
        user,
        setUserName,
        setUserPreferredMedia,
        completeOnboarding,
        updateUserFromProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
