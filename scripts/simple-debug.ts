// Simple debug to see what's wrong
/* eslint-disable */

import { supabase } from "../lib/utils";

export class SimpleDebug {
  static testGenreString() {
    console.log("🔍 Testing genre string processing...\n");

    // Test with your exact data
    const testCases = [
      "Science Fiction,Thriller",
      "Action,Drama",
      "Action,Comedy,Crime",
    ];

    testCases.forEach((genresString, index) => {
      console.log(`\n📝 Test ${index + 1}:`);
      console.log(`   Input: "${genresString}"`);
      console.log(`   Type: ${typeof genresString}`);
      console.log(`   Length: ${genresString?.length}`);
      console.log(`   Truthy: ${!!genresString}`);

      if (!genresString || typeof genresString !== "string") {
        console.log("   ❌ FAILED: No genres or invalid format");
        return;
      }

      console.log("   ✅ PASSED: Valid string");

      // Test splitting
      const genreNames = genresString
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      console.log(`   Split result: [${genreNames.join(", ")}]`);

      // Test mapping
      const MOVIE_GENRES = {
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

      const ids: number[] = [];
      genreNames.forEach((name) => {
        const normalized = name.toLowerCase().trim();
        const id = MOVIE_GENRES[normalized];
        console.log(
          `   "${name}" -> normalized: "${normalized}" -> ID: ${id || "NOT FOUND"}`
        );
        if (id) ids.push(id);
      });

      console.log(`   Final IDs: [${ids.join(", ")}]`);
    });
  }

  static async testDatabaseCall() {
    console.log("📊 Testing database call...\n");

    try {
      const { data: mediaItems, error } = await supabase
        .from("media")
        .select("id, title, genres")
        .limit(1);

      if (error) {
        console.error("❌ Database error:", error);
        return;
      }

      if (!mediaItems || mediaItems.length === 0) {
        console.log("❌ No items returned");
        return;
      }

      const item = mediaItems[0];
      console.log("✅ Database call successful");
      console.log(`   Item: ${item.title}`);
      console.log(`   Genres: "${item.genres}"`);
      console.log(`   Genres type: ${typeof item.genres}`);
      console.log(`   Genres length: ${item.genres?.length}`);

      // Test the actual processing
      this.processGenres(item.genres);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  static processGenres(genresString: any) {
    console.log("\n🔄 Processing genres...");
    console.log(`   Input: ${JSON.stringify(genresString)}`);
    console.log(`   Type: ${typeof genresString}`);

    if (!genresString) {
      console.log("   ❌ Falsy value");
      return [];
    }

    if (typeof genresString !== "string") {
      console.log("   ❌ Not a string");
      return [];
    }

    console.log("   ✅ Valid string, proceeding...");

    const genres = genresString.split(",").map((g) => g.trim());
    console.log(`   Split: [${genres.join(", ")}]`);

    return genres;
  }
}

// Run these tests:
// 1. SimpleDebug.testGenreString();
// 2. await SimpleDebug.testDatabaseCall();
