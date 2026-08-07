import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

// Clerk owns the session. The bridge component in app/_layout.tsx registers
// a getter that returns the current Clerk session token (or null when signed
// out). Do not cache tokens here — Clerk's getToken() caches and refreshes.
let getClerkToken: () => Promise<string | null> = async () => null;

export const setClerkTokenGetter = (fn: () => Promise<string | null>) => {
  getClerkToken = fn;
};

/** Current Clerk session token, used as the Bearer token for edge functions. */
export const getSupabaseAccessToken = () => getClerkToken();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: () => getClerkToken(),
});
