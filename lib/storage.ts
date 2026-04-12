import { createMMKV } from "react-native-mmkv";

export const storageKeys = {
  authState: "authState",
  queryCache: "RQ_CACHE_V2",
  themeMode: "@app_theme",
} as const;

const storage = createMMKV({
  id: "medley-app-storage",
});

export const nativeStorage = {
  clearAll() {
    storage.clearAll();
  },
  contains(key: string) {
    return storage.contains(key);
  },
  delete(key: string) {
    storage.remove(key);
  },
  getString(key: string) {
    return storage.getString(key) ?? null;
  },
  setString(key: string, value: string) {
    storage.set(key, value);
  },
};

export const supabaseStorageAdapter = {
  getItem: async (key: string) => nativeStorage.getString(key),
  removeItem: async (key: string) => {
    nativeStorage.delete(key);
  },
  setItem: async (key: string, value: string) => {
    nativeStorage.setString(key, value);
  },
};

export function clearPersistedQueryCache() {
  nativeStorage.delete(storageKeys.queryCache);
}

export function getStoredThemeMode() {
  return nativeStorage.getString(storageKeys.themeMode);
}

export function setStoredThemeMode(mode: string) {
  nativeStorage.setString(storageKeys.themeMode, mode);
}

export function getStoredAuthState() {
  const value = nativeStorage.getString(storageKeys.authState);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as { isLoggedIn: boolean };
  } catch {
    nativeStorage.delete(storageKeys.authState);
    return null;
  }
}

export function setStoredAuthState(state: { isLoggedIn: boolean }) {
  nativeStorage.setString(storageKeys.authState, JSON.stringify(state));
}

export function clearStoredAuthState() {
  nativeStorage.delete(storageKeys.authState);
}
