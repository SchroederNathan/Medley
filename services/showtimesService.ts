import { createHttpError, toAppError } from "../lib/app-error";
import { supabase } from "../lib/utils";

export type ShowtimeEntry = {
  theaterId: string;
  theaterName: string;
  dateTime: string;
  bargain: boolean;
  distance: number | null;
};

export type ShowtimesMovie = {
  tmsId: string;
  title: string;
  releaseYear: number | null;
  runTimeMinutes: number | null;
  rating: string | null;
  posterUrl: string | null;
  shortDescription: string | null;
  showtimes: ShowtimeEntry[];
};

export type ShowtimesResponse = {
  date: string;
  movies: ShowtimesMovie[];
};

export type GetShowtimesParams = {
  lat: number;
  lng: number;
  date: string;
  radius?: number;
  units?: "km" | "mi";
};

export class ShowtimesService {
  static async getShowtimes(
    params: GetShowtimesParams
  ): Promise<ShowtimesResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

    const url = new URL(`${supabaseUrl}/functions/v1/showtimes`);
    url.searchParams.set("lat", String(params.lat));
    url.searchParams.set("lng", String(params.lng));
    url.searchParams.set("date", params.date);
    if (params.radius != null)
      url.searchParams.set("radius", String(params.radius));
    if (params.units) url.searchParams.set("units", params.units);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: supabaseKey,
        },
      });
    } catch (error) {
      throw toAppError(error, "showtimes request failed");
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw createHttpError("showtimes", response, body);
    }

    try {
      return (await response.json()) as ShowtimesResponse;
    } catch (error) {
      throw toAppError(error, "showtimes returned invalid JSON");
    }
  }
}
