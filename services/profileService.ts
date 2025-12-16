import { supabase } from "../lib/utils";

export interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
  media_preferences?: {
    preferred_media?: ("Games" | "Movies" | "Books")[];
    onboarding_completed?: boolean;
    completed_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export class ProfileService {
  /**
   * Fetches a user profile by ID
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // If no profile found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Updates a user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "id">>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Creates a new user profile
   */
  static async createProfile(profile: Profile): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Creates or updates a profile (upsert)
   */
  static async upsertProfile(profile: Profile): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Uploads a profile avatar image and updates the profile
   * Returns the public URL of the uploaded image
   */
  static async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    // Verify authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("Authentication required");
    }

    // Use a fixed filename to replace the existing image
    const fileName = `profiles/${userId}/avatar.jpg`;

    // Delete existing avatar if it exists to ensure clean replacement
    const { error: deleteError } = await supabase.storage
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
      }
    }

    // Read image file
    let fileData: ArrayBuffer;
    let detectedContentType: string | null = null;

    try {
      const response = await fetch(imageUri);
      fileData = await response.arrayBuffer();
      detectedContentType = response.headers.get("content-type");
    } catch (error) {
      console.error("Error reading image file:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to read image file");
    }

    // Determine content type
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

    // Upload new file
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
            upsertResult.error
          );
          throw upsertResult.error;
        }
      } else {
        console.error("Error uploading image:", uploadResult.error);
        throw uploadResult.error;
      }
    }

    // Get public URL with cache-busting parameter
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-images").getPublicUrl(fileName);

    const cacheBustUrl = `${publicUrl}?t=${Date.now()}`;

    // Update profile with new avatar URL
    const updateResult = await supabase
      .from("profiles")
      .update({
        avatar_url: cacheBustUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateResult.error) {
      // Rollback: delete uploaded image on profile update failure
      await supabase.storage.from("profile-images").remove([fileName]);
      console.error("Error updating profile:", updateResult.error);
      throw updateResult.error;
    }

    return cacheBustUrl;
  }

  /**
   * Completes onboarding for a user
   */
  static async completeOnboarding(
    userId: string,
    name: string,
    preferredMedia: ("Games" | "Movies" | "Books")[]
  ): Promise<Profile> {
    const existingProfile = await this.getProfile(userId);

    const profileData = {
      name,
      media_preferences: {
        preferred_media: preferredMedia,
        onboarding_completed: true,
        completed_at: new Date().toISOString(),
      },
    };

    if (!existingProfile) {
      return this.createProfile({
        id: userId,
        ...profileData,
      });
    } else {
      return this.updateProfile(userId, profileData);
    }
  }
}
