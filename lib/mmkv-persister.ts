import type {
  PersistedClient,
  Persister,
} from "@tanstack/query-persist-client-core";

type MMKVPersisterOptions = {
  key: string;
  storage: {
    delete: (key: string) => void;
    getString: (key: string) => string | null;
    setString: (key: string, value: string) => void;
  };
};

export function createMMKVPersister({
  key,
  storage,
}: MMKVPersisterOptions): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      storage.setString(key, JSON.stringify(client));
    },
    removeClient: async () => {
      storage.delete(key);
    },
    restoreClient: async () => {
      const cache = storage.getString(key);

      if (!cache) {
        return undefined;
      }

      try {
        return JSON.parse(cache) as PersistedClient;
      } catch {
        storage.delete(key);
        return undefined;
      }
    },
  };
}
