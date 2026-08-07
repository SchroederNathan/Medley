import { createMMKV } from "react-native-mmkv";

export const storageKeys = {
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

export function clearPersistedQueryCache() {
  nativeStorage.delete(storageKeys.queryCache);
}

export function getStoredThemeMode() {
  return nativeStorage.getString(storageKeys.themeMode);
}

export function setStoredThemeMode(mode: string) {
  nativeStorage.setString(storageKeys.themeMode, mode);
}
