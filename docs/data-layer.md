# Data Layer Guide

Medley uses TanStack Query for all app data fetching and mutations, with
Supabase and edge functions behind service modules and MMKV for native
persistence.

## Architecture

- `services/` owns Supabase queries, storage calls, and edge-function fetches.
- `lib/query-keys.ts` owns shared query keys and normalized key inputs.
- `lib/query-options.ts` owns shared query definitions via TanStack
  `queryOptions`.
- `hooks/` composes auth state and shared query definitions into app-facing
  hooks.
- `hooks/mutations/` owns mutation hooks, cache invalidation, and targeted cache
  updates.
- `lib/storage.ts` owns native persistence with `react-native-mmkv`.

## Adding a New Query

1. Add or update the service method in `services/`.
2. Add a shared key in `lib/query-keys.ts`.
3. Add a shared query definition in `lib/query-options.ts`.
4. Consume it from a hook with `useQuery({ ...queryOptions, enabled })`.
5. Make sure every variable used by `queryFn` is represented in the query key.

## Adding a New Mutation

1. Add the underlying service method in `services/`.
2. Create a hook in `hooks/mutations/`.
3. Guard auth in the mutation function when user scope is required.
4. Prefer `setQueryData` when the mutation response already contains the new
   record shape.
5. Use `invalidateQueries` for dependent collections or aggregates.

## Error Handling

- Service methods should throw `AppError` instances via helpers in
  `lib/app-error.ts`.
- Edge-function fetches must check `response.ok` and parse failure bodies.
- Query retries are driven by `AppError.retryable`, so 4xx and validation
  failures should not retry.

## Native Persistence

- MMKV is the single native persistence backend.
- TanStack cache persistence lives under `storageKeys.queryCache`.
- Supabase auth persistence uses the MMKV-backed storage adapter in
  `lib/storage.ts`.
- Logout clears both the in-memory query cache and the persisted query cache.

## Offline and Focus Behavior

- `hooks/use-online-manager.ts` wires NetInfo to TanStack's `onlineManager`.
- `hooks/use-app-state.ts` wires app foreground state to TanStack's
  `focusManager`.
- Queries pause while offline and resume when connectivity returns.
