// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TMS_SHOWINGS_URL = "https://data.tmsapi.com/v1.1/movies/showings";
const TMS_THEATRES_URL = "https://data.tmsapi.com/v1.1/theatres";
const TMS_IMAGE_BASE = "https://tmsimg.fancybits.co/";

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  units: "km" | "mi"
): number {
  const R = units === "mi" ? 3958.8 : 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseISODuration(raw: unknown): number | null {
  if (!raw) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/i.exec(String(raw).trim());
  if (!match) return null;
  const minutes =
    (match[1] ? parseInt(match[1], 10) : 0) * 60 +
    (match[2] ? parseInt(match[2], 10) : 0);
  return minutes > 0 ? minutes : null;
}

function tmsImageUrl(relative: unknown): string | null {
  if (!relative) return null;
  const s = String(relative);
  if (/^https?:\/\//i.test(s)) return s;
  return `${TMS_IMAGE_BASE}${s.replace(/^\/+/, "")}`;
}

function firstMpaaRating(ratings: any): string | null {
  if (!Array.isArray(ratings)) return null;
  const mpaa = ratings.find(
    (r) =>
      typeof r?.body === "string" &&
      r.body.toLowerCase().includes("motion picture")
  );
  return mpaa?.code ?? ratings[0]?.code ?? null;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  let lat: number | undefined;
  let lng: number | undefined;
  let date: string | undefined;
  let radius: number | undefined;
  let units: "km" | "mi" | undefined;

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader)
      return jsonResponse({ error: "Missing authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !anonKey)
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await anonClient.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const tmsApiKey = Deno.env.get("TMS_API_KEY");
    if (!tmsApiKey) throw new Error("TMS_API_KEY not set");

    const { searchParams } = new URL(req.url);
    const latStr = (searchParams.get("lat") || "").trim();
    const lngStr = (searchParams.get("lng") || "").trim();
    if (!latStr || !lngStr)
      return jsonResponse(
        { error: "lat and lng query parameters are required" },
        400
      );
    lat = Number(latStr);
    lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return jsonResponse({ error: "Invalid lat/lng" }, 400);

    const todayUtc = new Date().toISOString().slice(0, 10);
    date = (searchParams.get("date") || todayUtc).trim();
    if (!isYmd(date)) return jsonResponse({ error: "Invalid date" }, 400);

    const radiusParam = searchParams.get("radius");
    radius = radiusParam ? Math.max(1, Number(radiusParam) || 25) : 25;
    units =
      (searchParams.get("units") || "km").toLowerCase() === "mi" ? "mi" : "km";

    const showingsUrl = new URL(TMS_SHOWINGS_URL);
    showingsUrl.searchParams.set("startDate", date);
    showingsUrl.searchParams.set("lat", String(lat));
    showingsUrl.searchParams.set("lng", String(lng));
    showingsUrl.searchParams.set("radius", String(radius));
    showingsUrl.searchParams.set("units", units);
    showingsUrl.searchParams.set("api_key", tmsApiKey);

    const theatresUrl = new URL(TMS_THEATRES_URL);
    theatresUrl.searchParams.set("lat", String(lat));
    theatresUrl.searchParams.set("lng", String(lng));
    theatresUrl.searchParams.set("radius", String(radius));
    theatresUrl.searchParams.set("units", units);
    theatresUrl.searchParams.set("api_key", tmsApiKey);

    const redactUrl = (u: URL) => {
      const copy = new URL(u.toString());
      copy.searchParams.set("api_key", "REDACTED");
      return copy.toString();
    };

    let showingsResp: Response;
    let theatresResp: Response;
    try {
      [showingsResp, theatresResp] = await Promise.all([
        fetch(showingsUrl.toString()),
        fetch(theatresUrl.toString()),
      ]);
    } catch (error) {
      console.error("showtimes tms-connection error:", {
        date,
        error: { message: (error as Error)?.message, name: (error as Error)?.name },
        lat,
        lng,
        radius,
        showingsUrl: redactUrl(showingsUrl),
        theatresUrl: redactUrl(theatresUrl),
        units,
      });
      return jsonResponse(
        {
          error: (error as Error)?.message ?? "TMS connection failed",
          source: "tms-connection",
        },
        502
      );
    }

    if (!showingsResp.ok) {
      const body = await showingsResp.text().catch(() => "");
      console.error("showtimes tms /showings non-OK:", {
        body,
        date,
        redactedUrl: redactUrl(showingsUrl),
        status: showingsResp.status,
      });
      return jsonResponse(
        {
          error: `TMS API error: ${showingsResp.status}`,
          source: "tms",
          upstreamStatus: showingsResp.status,
        },
        502
      );
    }

    const showingsText = await showingsResp.text();
    let showingsRaw: unknown = [];
    if (showingsText.trim()) {
      try {
        showingsRaw = JSON.parse(showingsText);
      } catch {
        console.error("showtimes tms /showings invalid JSON", {
          body: showingsText.slice(0, 1000),
          redactedUrl: redactUrl(showingsUrl),
        });
        return jsonResponse(
          {
            error: "TMS returned non-JSON body",
            source: "tms",
            upstreamStatus: showingsResp.status,
          },
          502
        );
      }
    }
    const tmsMovies = Array.isArray(showingsRaw) ? showingsRaw : [];

    // Build theaterId -> distance map. /theatres failures are non-fatal — we
    // just drop distance info and fall back to TMS's default ordering.
    const theaterDistances = new Map<string, number>();
    if (theatresResp.ok) {
      try {
        const theatresText = await theatresResp.text();
        const theatresRaw = theatresText.trim() ? JSON.parse(theatresText) : [];
        if (Array.isArray(theatresRaw)) {
          for (const t of theatresRaw) {
            const id = String(t?.theatreId ?? t?.id ?? "");
            const tLat = Number(t?.location?.geoCode?.latitude);
            const tLng = Number(t?.location?.geoCode?.longitude);
            if (id && Number.isFinite(tLat) && Number.isFinite(tLng)) {
              theaterDistances.set(id, haversine(lat, lng, tLat, tLng, units));
            }
          }
        }
      } catch (error) {
        console.warn("showtimes tms /theatres parse failed:", error);
      }
    } else {
      console.warn("showtimes tms /theatres non-OK:", {
        redactedUrl: redactUrl(theatresUrl),
        status: theatresResp.status,
      });
    }

    const movies = [];
    for (const movie of tmsMovies) {
      const tmsId = String(movie?.tmsId ?? "");
      if (!tmsId) continue;

      const showtimes = Array.isArray(movie?.showtimes)
        ? movie.showtimes
            .map((s: any) => {
              const theaterId = String(s?.theatre?.id ?? "");
              const distance = theaterDistances.get(theaterId);
              return {
                bargain: Boolean(s?.barg),
                dateTime: String(s?.dateTime ?? ""),
                distance: typeof distance === "number" ? distance : null,
                theaterId,
                theaterName: String(s?.theatre?.name ?? ""),
              };
            })
            .filter(
              (s) =>
                s.theaterId &&
                s.dateTime &&
                s.dateTime.slice(0, 10) === date
            )
            .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
        : [];
      if (showtimes.length === 0) continue;

      const releaseYear = Number.isFinite(Number(movie?.releaseYear))
        ? Number(movie.releaseYear)
        : null;

      movies.push({
        posterUrl: tmsImageUrl(movie?.preferredImage?.uri),
        rating: firstMpaaRating(movie?.ratings),
        releaseYear,
        runTimeMinutes: parseISODuration(movie?.runTime),
        shortDescription:
          movie?.shortDescription ?? movie?.longDescription ?? null,
        showtimes,
        title: String(movie?.title ?? ""),
        tmsId,
      });
    }

    return jsonResponse({ date, movies }, 200);
  } catch (error) {
    console.error("showtimes error:", {
      date,
      error: {
        message: (error as Error)?.message ?? String(error),
        name: (error as Error)?.name,
      },
      lat,
      lng,
      radius,
      units,
    });
    return jsonResponse(
      {
        error: (error as Error)?.message ?? String(error),
        source: "server",
      },
      500
    );
  }
});
