import { QueryClient } from "@tanstack/react-query";
import { shouldRetryQuery } from "./app-error";

export const QUERY_CACHE_BUSTER = "mmkv-v1";
export const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      networkMode: "online",
    },
    queries: {
      gcTime: QUERY_CACHE_MAX_AGE,
      networkMode: "online",
      retry: shouldRetryQuery,
      staleTime: 1000 * 60 * 5,
    },
  },
});
