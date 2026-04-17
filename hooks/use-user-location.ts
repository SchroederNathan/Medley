import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

import { nativeStorage } from "../lib/storage";

const CACHE_KEY = "@user_location";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export type LocationStatus =
  | "pending"
  | "granted"
  | "denied"
  | "undetermined"
  | "unavailable";

export type UserCoords = {
  lat: number;
  lng: number;
};

type CachedLocation = UserCoords & { capturedAt: number };

function readCache(): CachedLocation | null {
  const raw = nativeStorage.getString(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedLocation;
    if (
      typeof parsed?.lat !== "number" ||
      typeof parsed?.lng !== "number" ||
      typeof parsed?.capturedAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    nativeStorage.delete(CACHE_KEY);
    return null;
  }
}

function writeCache(value: CachedLocation) {
  nativeStorage.setString(CACHE_KEY, JSON.stringify(value));
}

export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoords | null>(() => {
    const cached = readCache();
    if (!cached) return null;
    if (Date.now() - cached.capturedAt > CACHE_TTL_MS) return null;
    return { lat: cached.lat, lng: cached.lng };
  });
  const [status, setStatus] = useState<LocationStatus>("pending");

  const fetchLocation = useCallback(async (forceRefresh = false) => {
    try {
      const services = await Location.hasServicesEnabledAsync();
      if (!services) {
        setStatus("unavailable");
        return null;
      }

      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === "undetermined" || perm.canAskAgain) {
        if (perm.status !== "granted") {
          perm = await Location.requestForegroundPermissionsAsync();
        }
      }

      if (perm.status !== "granted") {
        setStatus(perm.status === "denied" ? "denied" : "undetermined");
        return null;
      }

      setStatus("granted");

      if (!forceRefresh) {
        const cached = readCache();
        if (cached && Date.now() - cached.capturedAt <= CACHE_TTL_MS) {
          const next = { lat: cached.lat, lng: cached.lng };
          setCoords(next);
          return next;
        }
      }

      const last = await Location.getLastKnownPositionAsync({
        maxAge: CACHE_TTL_MS,
      });
      const position =
        last ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));

      const next: UserCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      writeCache({ ...next, capturedAt: Date.now() });
      setCoords(next);
      return next;
    } catch (error) {
      console.warn("useUserLocation fetch failed", error);
      setStatus("unavailable");
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;

      if (perm.status === "granted") {
        setStatus("granted");
        const cached = readCache();
        if (cached && Date.now() - cached.capturedAt <= CACHE_TTL_MS) {
          setCoords({ lat: cached.lat, lng: cached.lng });
          return;
        }
        await fetchLocation();
      } else if (perm.status === "denied" && !perm.canAskAgain) {
        setStatus("denied");
      } else {
        setStatus("undetermined");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchLocation]);

  const requestLocation = useCallback(() => fetchLocation(true), [
    fetchLocation,
  ]);

  return { coords, status, requestLocation };
}
