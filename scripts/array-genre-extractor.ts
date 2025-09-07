// scripts/arrayGenreExtractor.ts
// For Supabase that auto-converts to arrays: ["Science Fiction","Thriller"]

import { GenreMapper } from "../lib/genremapper";
import { supabase } from "../lib/utils";

export class ArrayGenreExtractor {
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
    action: 10759,
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
   * Extract genre IDs from Supabase array format: ["Science Fiction","Thriller"]
   */
  static extractGenreIds(
    genres: any,
    mediaType: "movie" | "tv_show" | "game"
  ): number[] {
    try {
      console.log(`   Input type: ${typeof genres}`);
      console.log(`   Input value: ${JSON.stringify(genres)}`);

      let genreNames: string[] = [];

      // Handle different input formats
      if (Array.isArray(genres)) {
        // Already an array: ["Science Fiction","Thriller"]
        genreNames = genres.filter(
          (name) => typeof name === "string" && name.trim().length > 0
        );
        console.log(`   ✅ Array format detected`);
      } else if (typeof genres === "string") {
        // String format: "Science Fiction,Thriller"
        genreNames = genres
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
        console.log(`   ✅ String format detected`);
      } else {
        console.log(`   ❌ Unsupported format: ${typeof genres}`);
        return [];
      }

      console.log(`   Genre names: [${genreNames.join(", ")}]`);

      if (genreNames.length === 0) {
        console.log("   ⚠️  No valid genre names found");
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
   * Test extraction on your actual data
   */
  static async testExtraction(limit: number = 5) {
    console.log("🧪 Testing ARRAY genre extraction...\n");

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
      console.log(`   Raw genres: ${JSON.stringify(item.genres)}`);

      try {
        const genreIds = this.extractGenreIds(item.genres, item.media_type);
        console.log(`   Final IDs: [${genreIds.join(", ")}]`);

        if (genreIds.length > 0) {
          const mediaType =
            item.media_type === "tv_show" ? "tv" : item.media_type;
          const unifiedGenres = GenreMapper.mapToUnified(genreIds, mediaType);
          console.log(`   Unified: [${unifiedGenres.join(", ")}]`);
        } else {
          console.log("   ⚠️  No valid genres mapped");
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Update a single item (for testing)
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

    console.log(`\n📝 Processing: ${item.title}`);
    console.log(`   Genres: ${JSON.stringify(item.genres)}`);

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

          // Verify the update
          const { data: updated } = await supabase
            .from("media")
            .select("external_genre_ids, unified_genres")
            .eq("id", mediaId)
            .single();

          console.log("✅ Verification:");
          console.log(
            `   External IDs: ${JSON.stringify(updated?.external_genre_ids)}`
          );
          console.log(`   Unified: ${JSON.stringify(updated?.unified_genres)}`);
        }
      } else {
        console.log("⚠️  No valid genres found - skipping update");
      }
    } catch (error) {
      console.error(`❌ Error processing: ${error.message}`);
    }
  }

  /**
   * Run the full backfill
   */
  static async backfillAllGenres() {
    console.log("🚀 Starting ARRAY genre backfill...\n");

    let totalProcessed = 0;
    let totalUpdated = 0;
    let offset = 0;
    const batchSize = 20;

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
                `✅ ${totalUpdated}/${totalProcessed}: ${item.title} -> [${unifiedGenres.join(", ")}]`
              );
            }
          } else {
            console.log(`⚠️  Skipped ${item.title} - no valid genres`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error);
        }

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      offset += batchSize;

      // Progress update
      console.log(
        `   Batch complete: ${totalUpdated}/${totalProcessed} updated\n`
      );
    }

    console.log(`\n🎉 Backfill complete!`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`📊 Successfully updated: ${totalUpdated}`);
    console.log(
      `📊 Success rate: ${Math.round((totalUpdated / totalProcessed) * 100)}%`
    );
  }
}

// Usage:
// 1. Test: await ArrayGenreExtractor.testExtraction(5);
// 2. Single update: await ArrayGenreExtractor.updateSingleItem('a6c912ce-2c9f-436a-8d09-21355d712535');
// 3. Full backfill: await ArrayGenreExtractor.backfillAllGenres();
