import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from "https://esm.sh/@imagemagick/magick-wasm@0.0.30";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize ImageMagick WebAssembly
const wasmUrl =
  "https://imagemagick-wasm.s3.us-west-2.amazonaws.com/magick.wasm";
const wasmBytes = await fetch(wasmUrl).then((res) => res.arrayBuffer());
await initializeImageMagick(wasmBytes);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate file size (max 5MB before compression)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 5MB." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Process image: resize to 200x200 (profile image size) and compress
    const processedImage = await new Promise<Uint8Array>((resolve, reject) => {
      try {
        ImageMagick.read(uint8Array, (img) => {
          // Resize to 200x200, maintaining aspect ratio with crop from center
          img.resize(new MagickGeometry("200x200^"));
          img.crop(new MagickGeometry("200x200+0+0"));

          // Compress with quality 80 (good balance between size and quality)
          img.quality(80);

          // Convert to JPEG format for better compression
          img.write(MagickFormat.Jpeg, (data) => {
            resolve(data);
          });
        });
      } catch (error) {
        reject(error);
      }
    });

    // Get current profile to check for existing avatar
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    // Extract old file path from avatar_url if it exists
    let oldFilePath: string | null = null;
    if (currentProfile?.avatar_url) {
      try {
        // Extract path from URL (format: https://project.supabase.co/storage/v1/object/public/public-images/path/to/file.jpg)
        const urlParts = currentProfile.avatar_url.split("/public-images/");
        if (urlParts.length > 1) {
          oldFilePath = `profiles/${user.id}/${urlParts[1]}`;
        }
      } catch (e) {
        console.warn("Could not parse old avatar URL:", e);
      }
    }

    // Generate unique filename using user ID and timestamp
    const timestamp = Date.now();
    const fileName = `profiles/${user.id}/${timestamp}.jpg`;

    // Upload processed image to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("public-images")
      .upload(fileName, processedImage, {
        contentType: "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Failed to upload image",
          details: uploadError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabaseAdmin.storage
      .from("public-images")
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      // If profile update fails, try to delete the uploaded file to avoid orphaned files
      await supabaseAdmin.storage.from("public-images").remove([fileName]);

      return new Response(
        JSON.stringify({
          error: "Failed to update profile",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Delete old profile image if it exists and is different from the new one
    if (oldFilePath && oldFilePath !== fileName) {
      try {
        await supabaseAdmin.storage.from("public-images").remove([oldFilePath]);
      } catch (deleteError) {
        // Log but don't fail - old file cleanup is not critical
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        path: fileName,
        size: processedImage.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
