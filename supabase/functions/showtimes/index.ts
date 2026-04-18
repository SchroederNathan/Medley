// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  addDaysYmd,
  groupRowsToShowtimesResponse,
  roundBucket,
  SHOWTIMES_FRESH_MS,
  syncShowtimesFromTms,
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

    const latBucket = roundBucket(lat);
    const lngBucket = roundBucket(lng);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabase.from("showtime_location_buckets").upsert(
      {
        lat_bucket: latBucket,
        lng_bucket: lngBucket,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "lat_bucket,lng_bucket" }
    );

    const { data: fetchRow } = await supabase
      .from("showtime_fetches")
      .select("fetched_at")
      .eq("lat_bucket", latBucket)
      .eq("lng_bucket", lngBucket)
      .eq("show_date", date)
      .maybeSingle();

    let needsTms = true;
    if (fetchRow?.fetched_at) {
      const age = Date.now() - new Date(fetchRow.fetched_at).getTime();
      needsTms = age >= SHOWTIMES_FRESH_MS;
    }

    if (needsTms) {
      const weekDates = Array.from({ length: 7 }, (_, i) =>
        addDaysYmd(windowStart, i)
      );
      const inWeekWindow = weekDates.includes(date);

      await syncShowtimesFromTms(supabase, {
        lat,
        lng,
        latBucket,
        lngBucket,
        startDate: inWeekWindow ? windowStart : date,
        numDays: inWeekWindow ? 7 : 1,
        radius,
        units,
        tmsApiKey,
      });
    }

    const { data: rows, error: readErr } = await supabase
      .from("movie_showtimes")
      .select("*")
      .eq("lat_bucket", latBucket)
      .eq("lng_bucket", lngBucket)
      .eq("show_date", date);

    if (readErr) throw readErr;

    const body = groupRowsToShowtimesResponse(rows ?? [], {
      date,
      lat,
      lng,
      radius,
      units,
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
