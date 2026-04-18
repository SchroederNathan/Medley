// Shared TMS normalization + DB row building for showtimes edge functions.

export const TMS_BASE_URL = "http://data.tmsapi.com/v1.1/movies/showings";
export const TMS_IMAGE_BASE = "https://tmsimg.fancybits.co/";
export const SHOWTIMES_FRESH_MS = 6 * 60 * 60 * 1000;

export function roundBucket(n: number): number {
  return Math.round(n * 100) / 100;
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (mo ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function normalizeTitle(raw: string): string {
  if (!raw) return "";
  let t = raw.toLowerCase().trim();
  t = t.replace(/^(the|a|an)\s+/i, "");
  t = t.replace(/[’'`:.,!?\-–—()\[\]"]/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

export function parseISODuration(
  raw: string | undefined | null
): number | null {
  if (!raw) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/i.exec(String(raw).trim());
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

export function tmsImageUrl(
  relative: string | undefined | null
): string | null {
  if (!relative) return null;
  if (/^https?:\/\//i.test(relative)) return relative;
  const trimmed = String(relative).replace(/^\/+/, "");
  return `${TMS_IMAGE_BASE}${trimmed}`;
}

export function firstMpaaRating(ratings: any[] | undefined): string | null {
  if (!Array.isArray(ratings)) return null;
  const mpaa = ratings.find(
    (r) =>
      typeof r?.body === "string" &&
      r.body.toLowerCase().includes("motion picture")
  );
  return mpaa?.code ?? ratings[0]?.code ?? null;
}

export type MovieShowtimeRow = {
  media_id: string | null;
  tms_id: string;
  root_id: string;
  title: string;
  release_year: number | null;
  poster_url: string | null;
  rating: string | null;
  run_time_minutes: number | null;
  genres: string[];
  directors: string[];
  top_cast: string[];
  short_description: string | null;
  theater_id: string;
  theater_name: string;
  lat_bucket: number;
  lng_bucket: number;
  show_date: string;
  date_time: string;
  bargain: boolean;
  fetched_at: string;
};

export async function fetchTmsMovies(params: {
  lat: number;
  lng: number;
  startDate: string;
  numDays?: number;
  radius: number;
  units: "km" | "mi";
  apiKey: string;
}): Promise<any[]> {
  const tmsUrl = new URL(TMS_BASE_URL);
  tmsUrl.searchParams.set("startDate", params.startDate);
  if (params.numDays && params.numDays > 1) {
    tmsUrl.searchParams.set("numDays", String(params.numDays));
  }
  tmsUrl.searchParams.set("lat", String(params.lat));
  tmsUrl.searchParams.set("lng", String(params.lng));
  tmsUrl.searchParams.set("radius", String(params.radius));
  tmsUrl.searchParams.set("units", params.units);
  tmsUrl.searchParams.set("api_key", params.apiKey);

  const tmsResp = await fetch(tmsUrl.toString());
  if (!tmsResp.ok) {
    const body = await tmsResp.text().catch(() => "");
    throw new Error(`TMS API error: ${tmsResp.status} ${body}`);
  }
  const tmsData = await tmsResp.json();
  return Array.isArray(tmsData) ? tmsData : [];
}

export function buildMovieShowtimeRows(params: {
  tmsMovies: any[];
  mediaByKey: Map<string, string>;
  latBucket: number;
  lngBucket: number;
  validDates: Set<string>;
  fetchedAt: string;
}): MovieShowtimeRow[] {
  const rows: MovieShowtimeRow[] = [];
  const { tmsMovies, mediaByKey, latBucket, lngBucket, validDates, fetchedAt } =
    params;

  for (const m of tmsMovies) {
    const tmsId = String(m?.tmsId ?? "");
    const rootId = String(m?.rootId ?? "");
    const title = String(m?.title ?? "");
    const releaseYear = Number.isFinite(Number(m?.releaseYear))
      ? Number(m.releaseYear)
      : null;
    const key = `${normalizeTitle(title)}|${releaseYear ?? ""}`;
    const mediaId = mediaByKey.get(key) ?? null;

    const genres = Array.isArray(m?.genres) ? m.genres.map(String) : [];
    const directors = Array.isArray(m?.directors)
      ? m.directors.map(String)
      : [];
    const topCast = Array.isArray(m?.topCast) ? m.topCast.map(String) : [];
    const showtimes = Array.isArray(m?.showtimes) ? m.showtimes : [];

    for (const s of showtimes) {
      const theaterId = String(s?.theatre?.id ?? "");
      const theaterName = String(s?.theatre?.name ?? "");
      const dateTime = String(s?.dateTime ?? "");
      if (!theaterId || !dateTime) continue;

      const showDate = dateTime.slice(0, 10);
      if (!validDates.has(showDate)) continue;

      rows.push({
        media_id: mediaId,
        tms_id: tmsId,
        root_id: rootId,
        title,
        release_year: releaseYear,
        poster_url: tmsImageUrl(m?.preferredImage?.uri),
        rating: firstMpaaRating(m?.ratings),
        run_time_minutes: parseISODuration(m?.runTime),
        genres,
        directors,
        top_cast: topCast,
        short_description: m?.shortDescription ?? m?.longDescription ?? null,
        theater_id: theaterId,
        theater_name: theaterName,
        lat_bucket: latBucket,
        lng_bucket: lngBucket,
        show_date: showDate,
        date_time: dateTime,
        bargain: Boolean(s?.barg),
        fetched_at: fetchedAt,
      });
    }
  }
  return rows;
}

export async function loadMediaByYearKeys(
  supabase: any,
  years: Set<number>
): Promise<Map<string, string>> {
  const mediaByKey = new Map<string, string>();
  if (years.size === 0) return mediaByKey;

  const { data: mediaRows, error: mediaErr } = await supabase
    .from("media")
    .select("id, title, year")
    .eq("media_type", "movie")
    .in("year", Array.from(years));

  if (mediaErr) {
    console.error("media lookup error:", mediaErr);
    return mediaByKey;
  }
  for (const row of mediaRows ?? []) {
    const k = `${normalizeTitle(row.title ?? "")}|${row.year ?? ""}`;
    if (!mediaByKey.has(k)) mediaByKey.set(k, row.id);
  }
  return mediaByKey;
}

export function collectYearsFromTms(tmsMovies: any[]): Set<number> {
  const years = new Set<number>();
  for (const m of tmsMovies) {
    const y = Number(m?.releaseYear);
    if (Number.isFinite(y) && y > 0) years.add(y);
  }
  return years;
}

/** Pull TMS and replace DB rows for one bucket across a date range. */
export async function syncShowtimesFromTms(
  supabase: any,
  opts: {
    lat: number;
    lng: number;
    latBucket: number;
    lngBucket: number;
    startDate: string;
    numDays?: number;
    radius: number;
    units: "km" | "mi";
    tmsApiKey: string;
  }
): Promise<{ rowCount: number; dates: string[] }> {
  const numDays = Math.max(1, opts.numDays ?? 1);
  const dates = Array.from({ length: numDays }, (_, i) =>
    addDaysYmd(opts.startDate, i)
  );
  const validDates = new Set(dates);

  const tmsMovies = await fetchTmsMovies({
    lat: opts.lat,
    lng: opts.lng,
    startDate: opts.startDate,
    numDays,
    radius: opts.radius,
    units: opts.units,
    apiKey: opts.tmsApiKey,
  });

  const years = collectYearsFromTms(tmsMovies);
  const mediaByKey = await loadMediaByYearKeys(supabase, years);
  const fetchedAt = new Date().toISOString();
  const rows = buildMovieShowtimeRows({
    tmsMovies,
    mediaByKey,
    latBucket: opts.latBucket,
    lngBucket: opts.lngBucket,
    validDates,
    fetchedAt,
  });

  const { data: existingRows, error: existingErr } = await supabase
    .from("movie_showtimes")
    .select("show_date")
    .eq("lat_bucket", opts.latBucket)
    .eq("lng_bucket", opts.lngBucket)
    .in("show_date", dates);
  if (existingErr) throw existingErr;

  const existingDatesWithRows = new Set(
    (existingRows ?? []).map((row: any) => String(row.show_date).slice(0, 10))
  );
  const returnedDates = new Set(rows.map((row) => row.show_date));
  const datesToReplace = dates.filter((date) => returnedDates.has(date));
  const datesToMarkFetched = dates.filter(
    (date) => returnedDates.has(date) || !existingDatesWithRows.has(date)
  );
  const preservedDates = dates.filter(
    (date) => !returnedDates.has(date) && existingDatesWithRows.has(date)
  );

  if (preservedDates.length > 0) {
    console.warn("Preserving existing showtimes for incomplete TMS payload", {
      latBucket: opts.latBucket,
      lngBucket: opts.lngBucket,
      preservedDates,
      returnedDates: Array.from(returnedDates),
      startDate: opts.startDate,
    });
  }

  if (datesToReplace.length > 0) {
    const { error: delErr } = await supabase
      .from("movie_showtimes")
      .delete()
      .eq("lat_bucket", opts.latBucket)
      .eq("lng_bucket", opts.lngBucket)
      .in("show_date", datesToReplace);
    if (delErr) throw delErr;
  }

  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from("movie_showtimes")
      .insert(rows);
    if (insErr) throw insErr;
  }

  if (datesToMarkFetched.length > 0) {
    const fetchRows = datesToMarkFetched.map((showDate) => ({
      lat_bucket: opts.latBucket,
      lng_bucket: opts.lngBucket,
      show_date: showDate,
      fetched_at: fetchedAt,
    }));
    const { error: fetchErr } = await supabase
      .from("showtime_fetches")
      .upsert(fetchRows, { onConflict: "lat_bucket,lng_bucket,show_date" });
    if (fetchErr) throw fetchErr;
  }

  return { rowCount: rows.length, dates: datesToMarkFetched };
}

export function groupRowsToShowtimesResponse(
  rows: any[],
  params: {
    date: string;
    lat: number;
    lng: number;
    radius: number;
    units: "km" | "mi";
  }
) {
  const theatersMap = new Map<string, string>();
  const moviesMap = new Map<
    string,
    {
      tmsId: string;
      rootId: string;
      title: string;
      releaseYear: number | null;
      runTimeMinutes: number | null;
      rating: string | null;
      genres: string[];
      directors: string[];
      topCast: string[];
      posterUrl: string | null;
      shortDescription: string | null;
      media_id: string | null;
      showtimes: {
        theaterId: string;
        theaterName: string;
        dateTime: string;
        bargain: boolean;
      }[];
    }
  >();

  for (const r of rows) {
    const tid = String(r.theater_id ?? "");
    const tname = String(r.theater_name ?? "");
    if (tid && !theatersMap.has(tid)) theatersMap.set(tid, tname);

    const tmsId = String(r.tms_id ?? "");
    if (!tmsId) continue;

    let movie = moviesMap.get(tmsId);
    if (!movie) {
      movie = {
        tmsId,
        rootId: String(r.root_id ?? ""),
        title: String(r.title ?? ""),
        releaseYear: r.release_year == null ? null : Number(r.release_year),
        runTimeMinutes:
          r.run_time_minutes == null ? null : Number(r.run_time_minutes),
        rating: r.rating ?? null,
        genres: Array.isArray(r.genres) ? r.genres : [],
        directors: Array.isArray(r.directors) ? r.directors : [],
        topCast: Array.isArray(r.top_cast) ? r.top_cast : [],
        posterUrl: r.poster_url ?? null,
        shortDescription: r.short_description ?? null,
        media_id: r.media_id ?? null,
        showtimes: [],
      };
      moviesMap.set(tmsId, movie);
    }
    movie.showtimes.push({
      theaterId: tid,
      theaterName: tname,
      dateTime: String(r.date_time ?? ""),
      bargain: Boolean(r.bargain),
    });
  }

  const theaters = Array.from(theatersMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));
  const movies = Array.from(moviesMap.values());

  return {
    date: params.date,
    location: {
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      units: params.units,
    },
    theaters,
    movies,
  };
}
