// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_MEDIA_TYPES = ["movie", "tv_show", "game"];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SEED_LIMIT = 5;
const MIN_SEEDS = 1;

function clampLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(parsed, MAX_LIMIT));
}

function normalizePopularity(media: any) {
  const popularity = Number(media?.metadata?.popularity ?? 0);
  return Number.isFinite(popularity) ? popularity : 0;
}

function normalizeRating(media: any) {
  const rating = Number(media?.rating_average ?? 0);
  return Number.isFinite(rating) ? rating : 0;
}

function getTieBreakerScore(media: any) {
  return normalizePopularity(media) * 0.01 + normalizeRating(media);
}

async function getMetadataRecommendations(supabase: any, source: any) {
  const isMovieOrTv =
    source.media_type === "movie" || source.media_type === "tv_show";
  const providerBlock = isMovieOrTv
    ? source.metadata?.tmdb_recommendations
    : source.metadata?.igdb_recommendations;

  if (!providerBlock) {
    return [];
  }

  const recommendedIds = Array.isArray(providerBlock.recommended_media_ids)
    ? providerBlock.recommended_media_ids.filter(Boolean)
    : [];

  if (recommendedIds.length > 0) {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .in("id", recommendedIds)
      .in("media_type", SUPPORTED_MEDIA_TYPES)
      .limit(MAX_LIMIT);

    if (error || !data) {
      return [];
    }

    const order = new Map(recommendedIds.map((id: string, index: number) => [id, index]));

    return data
      .slice()
      .sort((a: any, b: any) => {
        return (order.get(a.id) ?? MAX_LIMIT) - (order.get(b.id) ?? MAX_LIMIT);
      });
  }

  const items = Array.isArray(providerBlock.items)
    ? providerBlock.items.filter(Boolean)
    : [];
  if (items.length === 0) {
    return [];
  }

  const externalKey = isMovieOrTv ? "tmdb_id" : "igdb_id";
  const externalIds = items
    .map((item: any) => item?.[externalKey])
    .filter((value: unknown) => value != null);

  if (externalIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .in(`external_ids->${externalKey}`, externalIds)
    .in("media_type", SUPPORTED_MEDIA_TYPES)
    .limit(MAX_LIMIT);

  if (error || !data) {
    return [];
  }

  const order = new Map(
    items
      .map((item: any, index: number) => [item?.[externalKey], index] as const)
      .filter(([id]) => id != null)
  );

  return data
    .slice()
    .sort((a: any, b: any) => {
      const aExternalId = a.external_ids?.[externalKey];
      const bExternalId = b.external_ids?.[externalKey];
      return (
        (order.get(aExternalId) ?? MAX_LIMIT) -
        (order.get(bExternalId) ?? MAX_LIMIT)
      );
    });
}

function addCandidate(
  candidateMap: Map<string, { media: any; score: number }>,
  media: any,
  score: number
) {
  const existing = candidateMap.get(media.id);
  if (!existing || score > existing.score) {
    candidateMap.set(media.id, { media, score });
  }
}

async function getSeedRows(supabase: any, userId: string) {
  const strictFavorites = await supabase
    .from("user_media")
    .select("media_id, user_rating, added_at, status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("user_rating", 4)
    .order("user_rating", { ascending: false })
    .order("added_at", { ascending: false })
    .limit(SEED_LIMIT);

  if (strictFavorites.error) {
    throw strictFavorites.error;
  }

  if ((strictFavorites.data?.length ?? 0) >= MIN_SEEDS) {
    return {
      mode: "strict_favorites",
      rows: strictFavorites.data ?? [],
    };
  }

  const completedFallback = await supabase
    .from("user_media")
    .select("media_id, user_rating, added_at, status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("user_rating", { ascending: false, nullsFirst: false })
    .order("added_at", { ascending: false })
    .limit(SEED_LIMIT);

  if (completedFallback.error) {
    throw completedFallback.error;
  }

  if ((completedFallback.data?.length ?? 0) >= MIN_SEEDS) {
    return {
      mode: "completed_fallback",
      rows: completedFallback.data ?? [],
    };
  }

  const activeFallback = await supabase
    .from("user_media")
    .select("media_id, user_rating, added_at, status")
    .eq("user_id", userId)
    .in("status", ["completed", "watching", "reading", "playing", "want"])
    .order("user_rating", { ascending: false, nullsFirst: false })
    .order("added_at", { ascending: false })
    .limit(SEED_LIMIT);

  if (activeFallback.error) {
    throw activeFallback.error;
  }

  return {
    mode: "active_fallback",
    rows: activeFallback.data ?? [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error(
        "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY"
      );
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authErr,
    } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(req.url);
    const limit = clampLimit(searchParams.get("limit"));

    const seedSelection = await getSeedRows(supabase, user.id);
    const favoriteRows = seedSelection.rows;

    const favoriteIds = favoriteRows.map((row: any) => row.media_id);
    let favoriteMediaRows: any[] = [];
    if (favoriteIds.length > 0) {
      const { data, error: favoriteMediaError } = await supabase
        .from("media")
        .select("*")
        .in("id", favoriteIds)
        .in("media_type", SUPPORTED_MEDIA_TYPES);

      if (favoriteMediaError) {
        throw favoriteMediaError;
      }

      favoriteMediaRows = data ?? [];
    }

    const favoriteMediaMap = new Map(
      favoriteMediaRows.map((media: any) => [media.id, media])
    );

    const seeds = favoriteRows
      .map((row: any) => ({
        added_at: row.added_at,
        media: favoriteMediaMap.get(row.media_id),
        media_id: row.media_id,
        status: row.status,
        user_rating: Number(row.user_rating) || 0,
      }))
      .filter((row: any) => row.media);

    if (!favoriteRows || favoriteRows.length < MIN_SEEDS) {
      console.log("favorite-recommendations: no qualifying favorites", {
        favoriteCount: favoriteRows?.length ?? 0,
        mode: seedSelection.mode,
        userId: user.id,
      });
    }

    if (seeds.length < MIN_SEEDS) {
      console.log("favorite-recommendations: favorites missing supported seeds", {
        favoriteCount: favoriteRows.length,
        mode: seedSelection.mode,
        seedCount: seeds.length,
        userId: user.id,
      });
    }

    const { data: ownedRows, error: ownedError } = await supabase
      .from("user_media")
      .select("media_id")
      .eq("user_id", user.id);

    if (ownedError) {
      throw ownedError;
    }

    const ownedIds = new Set((ownedRows ?? []).map((row: any) => row.media_id));
    const candidateMap = new Map<string, { media: any; score: number }>();

    for (const [seedIndex, seed] of seeds.entries()) {
      const seedStrength =
        Math.max(seed.user_rating, 1) * 1000 + (SEED_LIMIT - seedIndex) * 100;
      const recommendations = await getMetadataRecommendations(supabase, seed.media);

      recommendations.forEach((media: any, recommendationIndex: number) => {
        if (ownedIds.has(media.id)) {
          return;
        }

        const score =
          seedStrength * 1000 -
          recommendationIndex * 10 +
          getTieBreakerScore(media);
        addCandidate(candidateMap, media, score);
      });
    }

    let favoriteGenreRows: any[] = [];
    if (favoriteIds.length > 0) {
      const { data, error: favoriteGenreError } = await supabase
        .from("user_media_with_genres")
        .select("media_id, unified_genres")
        .eq("user_id", user.id)
        .in("media_id", favoriteIds);

      if (favoriteGenreError) {
        throw favoriteGenreError;
      }

      favoriteGenreRows = data ?? [];
    }

    if (candidateMap.size < limit) {
      const favoriteGenres = Array.from(new Set([
        ...seeds.flatMap((seed: any) =>
          Array.isArray(seed.media?.unified_genres)
            ? seed.media.unified_genres
            : []
        ),
        ...(favoriteGenreRows ?? []).flatMap((row: any) =>
          Array.isArray(row.unified_genres) ? row.unified_genres : []
        ),
      ]));

      if (favoriteGenres.length > 0) {
        const { data: fallbackRows, error: fallbackError } = await supabase
          .from("media")
          .select("*")
          .in("media_type", SUPPORTED_MEDIA_TYPES)
          .overlaps("unified_genres", favoriteGenres)
          .limit(200);

        if (fallbackError) {
          throw fallbackError;
        }

        (fallbackRows ?? []).forEach((media: any) => {
          if (ownedIds.has(media.id) || candidateMap.has(media.id)) {
            return;
          }

          const overlapCount = (media.unified_genres ?? []).filter((genre: string) =>
            favoriteGenres.includes(genre)
          ).length;
          const score = overlapCount * 100 + getTieBreakerScore(media);
          addCandidate(candidateMap, media, score);
        });
      }
    }

    if (candidateMap.size < limit) {
      const { data: broaderGenreRows, error: broaderGenreError } = await supabase
        .from("user_media_with_genres")
        .select("unified_genres")
        .eq("user_id", user.id)
        .in("status", ["completed", "watching", "reading", "playing", "want"]);

      if (broaderGenreError) {
        throw broaderGenreError;
      }

      const broaderGenres = Array.from(
        new Set(
          (broaderGenreRows ?? []).flatMap((row: any) =>
            Array.isArray(row.unified_genres) ? row.unified_genres : []
          )
        )
      );

      if (broaderGenres.length > 0) {
        const { data: broaderRows, error: broaderRowsError } = await supabase
          .from("media")
          .select("*")
          .in("media_type", SUPPORTED_MEDIA_TYPES)
          .overlaps("unified_genres", broaderGenres)
          .limit(200);

        if (broaderRowsError) {
          throw broaderRowsError;
        }

        (broaderRows ?? []).forEach((media: any) => {
          if (ownedIds.has(media.id) || candidateMap.has(media.id)) {
            return;
          }

          const overlapCount = (media.unified_genres ?? []).filter((genre: string) =>
            broaderGenres.includes(genre)
          ).length;
          const score = overlapCount * 50 + getTieBreakerScore(media);
          addCandidate(candidateMap, media, score);
        });
      }
    }

    if (candidateMap.size < limit) {
      const { data: popularRows, error: popularRowsError } = await supabase
        .from("media")
        .select("*")
        .in("media_type", SUPPORTED_MEDIA_TYPES)
        .order("rating_average", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(100);

      if (popularRowsError) {
        throw popularRowsError;
      }

      (popularRows ?? []).forEach((media: any, index: number) => {
        if (ownedIds.has(media.id) || candidateMap.has(media.id)) {
          return;
        }

        const score = (100 - index) * 10 + getTieBreakerScore(media);
        addCandidate(candidateMap, media, score);
      });
    }

    console.log("favorite-recommendations: ranked results", {
      candidateCount: candidateMap.size,
      favoriteCount: favoriteRows.length,
      mode: seedSelection.mode,
      seedCount: seeds.length,
      userId: user.id,
    });

    const ranked = Array.from(candidateMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return String(a.media.title ?? "").localeCompare(String(b.media.title ?? ""));
      })
      .slice(0, limit)
      .map((entry) => entry.media);

    return new Response(JSON.stringify(ranked), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("favorite-recommendations error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
