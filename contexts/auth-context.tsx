import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { supabase } from "../lib/utils";
import { queryClient } from "../lib/query-client";

const authStorageKey = "authState";

type User = {
  id?: string;
  name?: string;
  preferred_media?: ("Games" | "Movies" | "Books")[];
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
    mediaPreferences?: ("Games" | "Movies" | "Books")[],
  ) => Promise<void>;
  fetchUserProfile: (id: string) => Promise<any>;
  uploadProfileImage: (file: File | Blob) => Promise<string>;
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
  uploadProfileImage: async () => "",
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

  // Upload profile image using the edge function
  const uploadProfileImage = async (file: File | Blob): Promise<string> => {
    if (!user.id) {
      throw new Error("User must be logged in to upload profile image");
    }

    try {
      // Get current session for authentication
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      // Create FormData for the file upload
      const formData = new FormData();
      formData.append("file", file);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke(
        "upload-profile-image",
        {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        throw error;
      }

      if (!data?.success || !data?.url) {
        throw new Error(data?.error || "Failed to upload image");
      }

      // Invalidate and refetch the user profile to get the updated avatar_url
      await queryClient.invalidateQueries({
        queryKey: ["userProfile", user.id],
      });

      return data.url;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
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
    preferredMedia?: ("Games" | "Movies" | "Books")[],
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
        uploadProfileImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
