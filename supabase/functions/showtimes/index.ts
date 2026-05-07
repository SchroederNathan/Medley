// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  buildShowtimesResponse,
  collectYearsFromTms,
  fetchTmsMovies,
  loadMediaByYearKeys,
} from "./cache-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

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
    if (!supabaseUrl || !serviceRoleKey)
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

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

    const tmsApiKey = Deno.env.get("TMS_API_KEY");
    if (!tmsApiKey) throw new Error("TMS_API_KEY not found");

    const { searchParams } = new URL(req.url);
    const latStr = (searchParams.get("lat") || "").trim();
    const lngStr = (searchParams.get("lng") || "").trim();
    if (!latStr || !lngStr) {
      return new Response(
        JSON.stringify({ error: "lat and lng query parameters are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(JSON.stringify({ error: "Invalid lat/lng" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const todayUtc = new Date().toISOString().slice(0, 10);
    const date = (searchParams.get("date") || todayUtc).trim();
    if (!isYmd(date)) {
      return new Response(JSON.stringify({ error: "Invalid date" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const windowStartRaw = (searchParams.get("windowStart") || date).trim();
    const windowStart = isYmd(windowStartRaw) ? windowStartRaw : date;
    const radiusParam = searchParams.get("radius");
    const defaultRadiusKm = 15;
    const radius = radiusParam
      ? Math.max(1, Number(radiusParam) || defaultRadiusKm)
      : defaultRadiusKm;
    const unitsRaw = (searchParams.get("units") || "km").toLowerCase();
    const units: "km" | "mi" = unitsRaw === "mi" ? "mi" : "km";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const tmsMovies = await fetchTmsMovies({
      lat,
      lng,
      // Keep `windowStart` in the request contract for client compatibility,
      // but fetch only the requested date and rely on client-side caching.
      startDate: date,
      numDays: 1,
      radius,
      units,
      apiKey: tmsApiKey,
    });

    const years = collectYearsFromTms(tmsMovies);
    const mediaByKey = await loadMediaByYearKeys(supabase, years);

    const body = buildShowtimesResponse({
      date,
      lat,
      lng,
      radius,
      units,
      tmsMovies,
      mediaByKey,
    });

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("showtimes error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
