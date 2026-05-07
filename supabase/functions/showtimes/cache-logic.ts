// Shared TMS normalization + response shaping for the showtimes edge function.

export const TMS_BASE_URL = "http://data.tmsapi.com/v1.1/movies/showings";
export const TMS_IMAGE_BASE = "https://tmsimg.fancybits.co/";

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

export function buildShowtimesResponse(
  params: {
    date: string;
    lat: number;
    lng: number;
    radius: number;
    units: "km" | "mi";
    tmsMovies: any[];
    mediaByKey: Map<string, string>;
  }
) {
  type NormalizedShowtime = {
    bargain: boolean;
    dateTime: string;
    theaterId: string;
    theaterName: string;
  };

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

  for (const movie of params.tmsMovies) {
    const tmsId = String(movie?.tmsId ?? "");
    if (!tmsId) continue;

    const title = String(movie?.title ?? "");
    const releaseYear = Number.isFinite(Number(movie?.releaseYear))
      ? Number(movie.releaseYear)
      : null;
    const mediaKey = `${normalizeTitle(title)}|${releaseYear ?? ""}`;

    const validShowtimes: NormalizedShowtime[] = Array.isArray(movie?.showtimes)
      ? movie.showtimes
          .map((showtime: any) => ({
            bargain: Boolean(showtime?.barg),
            dateTime: String(showtime?.dateTime ?? ""),
            theaterId: String(showtime?.theatre?.id ?? ""),
            theaterName: String(showtime?.theatre?.name ?? ""),
          }))
          .filter(
            (showtime: NormalizedShowtime) =>
              showtime.theaterId &&
              showtime.dateTime &&
              showtime.dateTime.slice(0, 10) === params.date
          )
      : [];

    if (validShowtimes.length === 0) continue;

    let normalizedMovie = moviesMap.get(tmsId);
    if (!normalizedMovie) {
      normalizedMovie = {
        tmsId,
        rootId: String(movie?.rootId ?? ""),
        title,
        releaseYear,
        runTimeMinutes: parseISODuration(movie?.runTime),
        rating: firstMpaaRating(movie?.ratings),
        genres: Array.isArray(movie?.genres) ? movie.genres.map(String) : [],
        directors: Array.isArray(movie?.directors)
          ? movie.directors.map(String)
          : [],
        topCast: Array.isArray(movie?.topCast)
          ? movie.topCast.map(String)
          : [],
        posterUrl: tmsImageUrl(movie?.preferredImage?.uri),
        shortDescription:
          movie?.shortDescription ?? movie?.longDescription ?? null,
        media_id: params.mediaByKey.get(mediaKey) ?? null,
        showtimes: [],
      };
      moviesMap.set(tmsId, normalizedMovie);
    }

    for (const showtime of validShowtimes) {
      if (!theatersMap.has(showtime.theaterId)) {
        theatersMap.set(showtime.theaterId, showtime.theaterName);
      }

      normalizedMovie.showtimes.push({
        theaterId: showtime.theaterId,
        theaterName: showtime.theaterName,
        dateTime: showtime.dateTime,
        bargain: showtime.bargain,
      });
    }
  }

  for (const movie of moviesMap.values()) {
    movie.showtimes.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
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
