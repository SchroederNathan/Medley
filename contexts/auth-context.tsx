import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { supabase } from "../lib/utils";
import { queryClient } from "../lib/query-client";

const authStorageKey = "authState";
const userStorageKey = "userProfile";

SplashScreen.preventAutoHideAsync();

type User = {
  id?: string;
  name?: string;
  preferred_media?: Array<"Games" | "Movies" | "Books">;
};

type AuthState = {
  isLoggedIn: boolean;
  isReady: boolean;
  user?: User;
  logIn: (id: string) => void;
  logOut: () => void;
  setUserId: (id: string) => void;
  setUserName: (name: string) => void;
  setUserPreferredMedia: (media: Array<"Games" | "Movies" | "Books">) => void;
  completeOnboarding: (
    mediaPreferences?: Array<"Games" | "Movies" | "Books">
  ) => Promise<void>;
  fetchUserProfile: (id: string) => Promise<any>;
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
  fetchUserProfile: async () => {},
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

  //get user profile from database
  const fetchUserProfile = async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  const setUserId = (id: string) => {
    setUser({ ...user, id });
  };

  const setUserName = (name: string) => {
    setUser({ ...user, name });
  };

  const setUserPreferredMedia = (
    media: Array<"Games" | "Movies" | "Books">
  ) => {
    setUser({ ...user, preferred_media: media });
  };

  const completeOnboarding = async (
    preferredMedia?: Array<"Games" | "Movies" | "Books">
  ) => {
    if (!user.id || !user.name || !preferredMedia) {
      throw new Error("Missing required user information");
    }

    try {
      // First, ensure the profile exists (in case trigger failed)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          name: user.name,
          media_preferences: {
            preferred_media: preferredMedia,
            onboarding_completed: true,
            completed_at: new Date().toISOString(),
          },
        });

        if (insertError) throw insertError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            name: user.name,
            media_preferences: {
              preferred_media: preferredMedia,
              onboarding_completed: true,
              completed_at: new Date().toISOString(),
            },
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

      logIn(user.id);

      router.replace("/(tabs)"); // Navigate to main app
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const logIn = (id: string) => {
    setIsLoggedIn(true);
    storeAuthState({ isLoggedIn: true });
    setUserId(id);
  };

  const logOut = async () => {
    setIsLoggedIn(false);
    setUser({});
    storeAuthState({ isLoggedIn: false });

    // Sign out from Supabase too
    await supabase.auth.signOut();
    // Clear React Query cache and persisted storage
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        // Prefer Supabase session as the source of truth
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          setUser({ id: session.user.id });
          setIsLoggedIn(true);
          storeAuthState({ isLoggedIn: true });
        } else {
          // Fallback to last stored auth flag
          const value = await AsyncStorage.getItem(authStorageKey);
          if (value !== null) {
            const auth = JSON.parse(value);
            setIsLoggedIn(!!auth.isLoggedIn);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
      setIsReady(true);
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

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
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
