import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { queryClient } from "../lib/query-client";
import { supabase } from "../lib/utils";

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
    mediaPreferences?: ("Games" | "Movies" | "Books")[]
  ) => Promise<void>;
  fetchUserProfile: (id: string) => Promise<any>;
  uploadProfileImage: (imageUri: string) => Promise<string>;
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

  const uploadProfileImage = async (imageUri: string): Promise<string> => {
    if (!user.id) {
      throw new Error("User must be logged in to upload profile image");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("Authentication required");
    }

    const profileResult = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profileResult.error) {
      console.error("Error fetching profile:", profileResult.error);
      throw profileResult.error;
    }

    // Use a fixed filename to replace the existing image
    const fileName = `profiles/${user.id}/avatar.jpg`;

    // Delete existing avatar if it exists to ensure clean replacement
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("profile-images")
      .remove([fileName]);

    // Log delete result for debugging
    if (deleteError) {
      const isNotFound =
        deleteError.message?.includes("not found") ||
        deleteError.message?.includes("does not exist") ||
        deleteError.message?.includes("No such file");
      if (!isNotFound) {
        console.warn("Could not delete existing avatar:", deleteError);
      } else {
        console.log("No existing avatar to delete (first upload)");
      }
    } else if (deleteData && deleteData.length > 0) {
      console.log("Successfully deleted existing avatar");
    }

    let fileData: ArrayBuffer | null = null;
    let fileReadError: Error | null = null;
    let detectedContentType: string | null = null;

    try {
      const response = await fetch(imageUri);
      fileData = await response.arrayBuffer();
      detectedContentType = response.headers.get("content-type");
    } catch (error) {
      fileReadError = error as Error;
    }

    if (fileReadError || !fileData) {
      console.error("Error reading image file:", fileReadError);
      throw fileReadError || new Error("Failed to read image file");
    }

    let contentType = "image/jpeg";
    if (
      detectedContentType &&
      detectedContentType !== "application/octet-stream"
    ) {
      contentType = detectedContentType;
    } else {
      const lowerUri = imageUri.toLowerCase();
      if (lowerUri.endsWith(".png")) {
        contentType = "image/png";
      } else if (lowerUri.endsWith(".webp")) {
        contentType = "image/webp";
      }
    }

    // Upload new file - upsert disabled since we deleted first
    const uploadResult = await supabase.storage
      .from("profile-images")
      .upload(fileName, fileData, {
        contentType,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadResult.error) {
      // If file still exists despite delete, try with upsert
      if (
        uploadResult.error.message?.includes("already exists") ||
        uploadResult.error.message?.includes("duplicate")
      ) {
        console.warn(
          "File exists after delete, using upsert:",
          uploadResult.error.message
        );
        const upsertResult = await supabase.storage
          .from("profile-images")
          .upload(fileName, fileData, {
            contentType,
            upsert: true,
            cacheControl: "3600",
          });

        if (upsertResult.error) {
          console.error(
            "Error uploading image (with upsert):",
            upsertResult.error,
          );
          const uploadError = upsertResult.error;
          throw uploadError;
        }
      } else {
        console.error("Error uploading image:", uploadResult.error);
        const uploadError = uploadResult.error;
        throw uploadError;
      }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-images").getPublicUrl(fileName);

    // Add cache-busting query parameter to force image refresh
    const cacheBustUrl = `${publicUrl}?t=${Date.now()}`;

    const updateResult = await supabase
      .from("profiles")
      .update({
        avatar_url: cacheBustUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateResult.error) {
      await supabase.storage.from("profile-images").remove([fileName]);
      console.error("Error updating profile:", updateResult.error);
      const updateError = updateResult.error;
      throw updateError;
    }

    // Force refetch the profile immediately to update UI
    await queryClient.invalidateQueries({
      queryKey: ["userProfile", user.id],
    });

    // Refetch the profile data immediately to ensure UI updates
    await queryClient.refetchQueries({
      queryKey: ["userProfile", user.id],
    });

    return cacheBustUrl;
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

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      throw fetchError;
    }

    let dbError: Error | null = null;

    if (!existingProfile) {
      const insertResult = await supabase.from("profiles").insert({
        id: user.id,
        name: user.name,
        media_preferences: {
          preferred_media: preferredMedia,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
        },
      });

      if (insertResult.error) {
        dbError = insertResult.error;
      }
    } else {
      const updateResult = await supabase
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

      if (updateResult.error) {
        dbError = updateResult.error;
      }
    }

    if (dbError) {
      console.error("Error completing onboarding:", dbError);
      throw dbError;
    }

    logIn(user.id);
    router.replace("/(tabs)");
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
        fetchUserProfile,
        uploadProfileImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
