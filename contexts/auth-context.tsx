import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { queryClient } from "../lib/query-client";
import { supabase } from "../lib/utils";
import { ProfileService } from "../services/profileService";

const authStorageKey = "authState";

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
  logIn: (id: string) => void;
  logOut: () => void;
  setUserId: (id: string) => void;
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
  logIn: () => {},
  logOut: () => {},
  setUserId: () => {},
  setUserName: () => {},
  setUserPreferredMedia: () => {},
  completeOnboarding: async () => {},
  updateUserFromProfile: () => {},
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>({});
  const router = useRouter();

  const storeAuthState = async (newState: { isLoggedIn: boolean }) => {
    try {
      const jsonValue = JSON.stringify(newState);
      await AsyncStorage.setItem(authStorageKey, jsonValue);
    } catch (error) {
      console.error("Error storing auth state:", error);
    }
  };

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
          profile.media_preferences?.preferred_media || prevUser.preferred_media,
      }));
    }
  };

  const setUserId = (id: string) => {
    setUser({ ...user, id });
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
    if (!user.id || !user.name || !preferredMedia) {
      throw new Error("Missing required user information");
    }

    // Use ProfileService for onboarding completion
    await ProfileService.completeOnboarding(user.id, user.name, preferredMedia);

    await logIn(user.id);
    router.replace("/(tabs)");
  };

  const logIn = async (id: string) => {
    setIsLoggedIn(true);
    storeAuthState({ isLoggedIn: true });
    setUserId(id);

    // Fetch profile data using ProfileService
    try {
      const profile = await ProfileService.getProfile(id);
      if (profile) {
        updateUserFromProfile(profile);
      }
    } catch (error) {
      console.warn("Failed to fetch user profile on login:", error);
    }
  };

  const logOut = async () => {
    setIsLoggedIn(false);
    setUser({});
    storeAuthState({ isLoggedIn: false });

    await supabase.auth.signOut();
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await AsyncStorage.removeItem("RQ_CACHE");
    } catch (e) {
      console.warn("Failed clearing persisted query cache", e);
    }
    router.replace("/onboarding");
  };

  useEffect(() => {
    const initializeAuth = async () => {
      let sessionResult;
      try {
        sessionResult = await supabase.auth.getSession();
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsReady(true);
        return;
      }

      const session = sessionResult?.data?.session;
      const userId = session?.user?.id;

      if (userId) {
        setUser({ id: userId });
        setIsLoggedIn(true);
        storeAuthState({ isLoggedIn: true });

        // Fetch profile data using ProfileService
        try {
          const profile = await ProfileService.getProfile(userId);
          if (profile) {
            updateUserFromProfile(profile);
          }
        } catch (error) {
          console.warn("Failed to fetch user profile on init:", error);
        }
      } else {
        let authStorageValue: string | null = null;
        try {
          authStorageValue = await AsyncStorage.getItem(authStorageKey);
        } catch (error) {
          console.warn("Failed to read auth storage:", error);
        }

        if (authStorageValue !== null) {
          try {
            const auth = JSON.parse(authStorageValue);
            const isLoggedIn = Boolean(auth.isLoggedIn);
            setIsLoggedIn(isLoggedIn);
          } catch (error) {
            console.warn("Failed to parse auth storage:", error);
          }
        }
      }

      setIsReady(true);
    };
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isReady,
        logIn,
        logOut,
        user,
        setUserId,
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
