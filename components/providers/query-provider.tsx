import React from "react";
import { focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useAppState } from "../../hooks/use-app-state";
import { useOnlineManager } from "../../hooks/use-online-manager";
import { createMMKVPersister } from "../../lib/mmkv-persister";
import {
  queryClient,
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE,
} from "../../lib/query-client";
import { nativeStorage, storageKeys } from "../../lib/storage";

interface QueryProviderProps {
  children: React.ReactNode;
}

const persister = createMMKVPersister({
  key: storageKeys.queryCache,
  storage: nativeStorage,
});

export function QueryProvider({ children }: QueryProviderProps) {
  useOnlineManager();
  useAppState((status) => {
    focusManager.setFocused(status === "active");
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: QUERY_CACHE_BUSTER,
        maxAge: QUERY_CACHE_MAX_AGE,
        persister,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
