// scripts/fixedGenreExtractor.ts
// For your actual format: "Science Fiction,Thriller" (comma-separated strings)

import { GenreMapper } from "../lib/genremapper";
import { supabase } from "../lib/utils";

export class FixedGenreExtractor {
  // Genre name to ID mappings for your exact data
  private static readonly MOVIE_NAME_TO_ID = {
    action: 28,
    adventure: 12,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 14,
    history: 36,
    horror: 27,
    music: 10402,
    mystery: 9648,
    romance: 10749,
    "science fiction": 878,
    thriller: 53,
    war: 10752,
    western: 37,
  };

  private static readonly TV_NAME_TO_ID = {
    "action & adventure": 10759,
    action: 10759, // Map single "Action" to Action & Adventure for TV
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    kids: 10762,
    mystery: 9648,
    news: 10763,
    reality: 10764,
    "sci-fi & fantasy": 10765,
    "science fiction": 10765,
    fantasy: 10765,
    soap: 10766,
    talk: 10767,
    "war & politics": 10768,
    western: 37,
  };

  private static readonly GAME_NAME_TO_ID = {
    "point-and-click": 2,
    fighting: 4,
    shooter: 5,
    music: 7,
    platform: 8,
    puzzle: 9,
    racing: 10,
    "real time strategy (rts)": 11,
    "role-playing (rpg)": 12,
    rpg: 12,
    simulator: 13,
    sport: 14,
    strategy: 15,
    "turn-based strategy (tbs)": 16,
    tactical: 24,
    "hack and slash/beat 'em up": 25,
    "quiz/trivia": 26,
    pinball: 30,
    adventure: 31,
    indie: 32,
    arcade: 33,
    "visual novel": 34,
    "card & board game": 35,
    moba: 36,
  };

  /**
   * Extract genre IDs from comma-separated string format
   */
  static extractGenreIds(
    genresString: string,
    mediaType: "movie" | "tv_show" | "game"
  ): number[] {
    try {
      if (!genresString || typeof genresString !== "string") {
        console.log("   ⚠️  No genres or invalid format");
        return [];
      }

      // Split by comma and clean up
      const genreNames = genresString
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      console.log(`   Split genres: [${genreNames.join(", ")}]`);

      if (genreNames.length === 0) {
        console.log("   ⚠️  No genres after splitting");
        return [];
      }

      // Get the appropriate genre mapping
      const nameToIdMap = this.getGenreNameToIdMap(mediaType);
      const genreIds: number[] = [];

      genreNames.forEach((name) => {
        const normalizedName = name.toLowerCase().trim();
        const genreId = nameToIdMap[normalizedName];

        if (genreId) {
          genreIds.push(genreId);
          console.log(`   ✅ "${name}" -> ${genreId}`);
        } else {
          console.log(
            `   ❌ "${name}" -> NOT FOUND (normalized: "${normalizedName}")`
          );
        }
      });

      return genreIds;
    } catch (error) {
      console.error(`   ❌ Processing Error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get genre name to ID mapping based on media type
   */
  private static getGenreNameToIdMap(
    mediaType: string
  ): Record<string, number> {
    console.log(`   Using ${mediaType} genre mapping`);
    return mediaType === "movie"
      ? this.MOVIE_NAME_TO_ID
      : mediaType === "tv_show"
        ? this.TV_NAME_TO_ID
        : this.GAME_NAME_TO_ID;
  }

  /**
   * Test the extraction on your actual data
   */
  static async testExtraction(limit: number = 5) {
    console.log("🧪 Testing FIXED genre extraction...\n");

    const { data: mediaItems, error } = await supabase
      .from("media")
      .select("id, title, media_type, genres")
      .not("genres", "is", null)
      .limit(limit);

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    if (!mediaItems || mediaItems.length === 0) {
      console.log("❌ No items found!");
      return;
    }

    for (const item of mediaItems) {
      console.log(`\n📝 Testing: ${item.title} (${item.media_type})`);
      console.log(`   Raw genres: "${item.genres}"`);

      try {
        const genreIds = this.extractGenreIds(item.genres, item.media_type);
        console.log(`   Final IDs: [${genreIds.join(", ")}]`);

        if (genreIds.length > 0) {
          const mediaType =
            item.media_type === "tv_show" ? "tv" : item.media_type;
          const unifiedGenres = GenreMapper.mapToUnified(genreIds, mediaType);
          console.log(`   Unified: [${unifiedGenres.join(", ")}]`);
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Process and update a single media item
   */
  static async updateSingleItem(mediaId: string) {
    console.log(`🔄 Updating single item: ${mediaId}`);

    const { data: item, error } = await supabase
      .from("media")
      .select("id, title, media_type, genres")
      .eq("id", mediaId)
      .single();

    if (error || !item) {
      console.error("❌ Item not found:", error);
      return;
    }

    console.log(`📝 Processing: ${item.title}`);
    console.log(`   Genres: "${item.genres}"`);

    try {
      const genreIds = this.extractGenreIds(item.genres, item.media_type);

      if (genreIds.length > 0) {
        const mediaType =
          item.media_type === "tv_show" ? "tv" : item.media_type;
        const unifiedGenres = GenreMapper.mapToUnified(genreIds, mediaType);

        console.log(`   Updating with IDs: [${genreIds.join(", ")}]`);
        console.log(`   Unified genres: [${unifiedGenres.join(", ")}]`);

        const { error: updateError } = await supabase
          .from("media")
          .update({
            external_genre_ids: genreIds,
            unified_genres: unifiedGenres,
          })
          .eq("id", mediaId);

        if (updateError) {
          console.error("❌ Update failed:", updateError);
        } else {
          console.log("✅ Successfully updated!");
        }
      } else {
        console.log("⚠️  No valid genres found - skipping update");
      }
    } catch (error) {
      console.error(`❌ Error processing: ${error.message}`);
    }
  }

  /**
   * Run the full backfill with the correct format
   */
  static async backfillAllGenres() {
    console.log("🚀 Starting FIXED genre backfill...\n");

    let totalProcessed = 0;
    let totalUpdated = 0;
    let offset = 0;
    const batchSize = 25; // Smaller batches for better debugging

    while (true) {
      console.log(`📦 Processing batch starting at ${offset}...`);

      const { data: mediaItems, error } = await supabase
        .from("media")
        .select("id, title, media_type, genres")
        .is("unified_genres", null)
        .not("genres", "is", null)
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error("❌ Error fetching batch:", error);
        break;
      }

      if (!mediaItems || mediaItems.length === 0) {
        console.log("✅ No more items to process");
        break;
      }

      console.log(`   Found ${mediaItems.length} items in this batch`);

      for (const item of mediaItems) {
        totalProcessed++;

        try {
          const genreIds = this.extractGenreIds(item.genres, item.media_type);

          if (genreIds.length > 0) {
            const mediaType =
              item.media_type === "tv_show" ? "tv" : item.media_type;
            const unifiedGenres = GenreMapper.mapToUnified(genreIds, mediaType);

            const { error: updateError } = await supabase
              .from("media")
              .update({
                external_genre_ids: genreIds,
                unified_genres: unifiedGenres,
              })
              .eq("id", item.id);

            if (updateError) {
              console.error(`❌ Failed to update ${item.title}:`, updateError);
            } else {
              totalUpdated++;
              console.log(
                `✅ Updated: ${item.title} -> [${unifiedGenres.join(", ")}]`
              );
            }
          } else {
            console.log(`⚠️  Skipped ${item.title} - no valid genres`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error);
        }

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      offset += batchSize;
    }

    console.log(`\n🎉 Backfill complete!`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`📊 Successfully updated: ${totalUpdated}`);
  }
}

// Usage:
// 1. Test first: await FixedGenreExtractor.testExtraction(5);
// 2. Test single update: await FixedGenreExtractor.updateSingleItem('a6c912ce-2c9f-436a-8d09-21355d712535');
// 3. Run full backfill: await FixedGenreExtractor.backfillAllGenres();
