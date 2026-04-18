// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { syncShowtimesFromTms } from "./cache-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = (req.headers.get("authorization") ?? "").trim();
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!token || token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const tmsApiKey = Deno.env.get("TMS_API_KEY");
    if (!supabaseUrl || !serviceRoleKey)
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    if (!tmsApiKey) throw new Error("TMS_API_KEY not found");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const todayUtc = new Date().toISOString().slice(0, 10);
    const radius = 15;
    const units: "km" | "mi" = "km";

    const { data: buckets, error: bErr } = await supabase
      .from("showtime_location_buckets")
      .select("lat_bucket, lng_bucket")
      .gte(
        "last_seen_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (bErr) throw bErr;

    let bucketsProcessed = 0;
    let rowsWritten = 0;

    for (const b of buckets ?? []) {
      const lat = Number(b.lat_bucket);
      const lng = Number(b.lng_bucket);
      const latBucket = lat;
      const lngBucket = lng;

      const { rowCount } = await syncShowtimesFromTms(supabase, {
        lat,
        lng,
        latBucket,
        lngBucket,
        startDate: todayUtc,
        numDays: 7,
        radius,
        units,
        tmsApiKey,
      });
      bucketsProcessed += 1;
      rowsWritten += rowCount;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        startDate: todayUtc,
        numDays: 7,
        bucketsProcessed,
        rowsWritten,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("showtimes-cron error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
