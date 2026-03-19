# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Medley is a React Native media tracking app (movies, TV shows, games, books) built with Expo 54, TypeScript, and Supabase. Users can build libraries, write reviews, create ranked collections, and get recommendations.

## Development Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in browser
npm run lint           # ESLint with auto-fix
npx expo prebuild      # Generate native projects
```

No test runner is currently configured.

## Architecture

### Routing (Expo Router - file-system based)

Routes live in `app/`. The key structure:
- `app/_layout.tsx` — Root layout wrapping all providers and splash screen
- `app/(protected)/_layout.tsx` — Auth guard; redirects to `/onboarding` if not logged in
- `app/(protected)/(tabs)/_layout.tsx` — Tab navigator (Home, Social, Match, Library, Profile)
- Modal routes: `media-detail/`, `save-media/`, `collection/form`, `collection/[id]`

### State Management (three tiers)

1. **React Context** (`contexts/`) — Auth, theme, toast, overlay, animation state
2. **TanStack Query** — Server state with AsyncStorage persistence. 5min stale time, 24hr GC. Query keys centralized in `lib/query-keys.ts`.
3. **Reanimated shared values** — Animation state on the UI thread

### Data Flow

```
components/ui/ → hooks/ → services/ → Supabase client (lib/utils.ts)
                  ↓
            mutations/ (hooks/mutations/) → invalidate query keys on success
```

- **Services** (`services/`) — All Supabase queries go through service files (profileService, userMediaService, collectionService, mediaService, recommendationService)
- **Hooks** (`hooks/`) — Wrap TanStack Query `useQuery`/`useMutation` calls. Query hooks check `isLoggedIn && !!userId` before enabling.
- **Mutation hooks** (`hooks/mutations/`) — Handle optimistic updates and cache invalidation via `queryKeys`

### Supabase Backend

**Database tables** (all have RLS enabled):
- `media` — Catalog of media items (type constrained to book/movie/tv_show/game). Uses `external_ids` JSONB for TMDB/IGDB IDs and `metadata` JSONB for extra fields.
- `user_media` — User's library entries with status (want/in_progress/completed), rating (1-5), and review text
- `profiles` — User profiles linked to `auth.users`, includes `media_preferences` JSONB and `expo_push_token`
- `collections` / `collection_items` — User-created lists, optionally ranked (position > 0)
- `popular_movies` — Cached TMDB popular movies with rank
- `notifications` — Push notification records
- `unified_genres` — Cross-media genre taxonomy with weights

**Edge Functions**: movie-task, games-task, backfill-movie-recs, backfill-game-recs, upload-profile-image, push, generate-notification, popular-movies

**Storage**: `profile-images` bucket for avatars

The Supabase client is initialized in `lib/utils.ts` with AsyncStorage-backed auth persistence.

### Styling

- `StyleSheet.create` for static styles, dynamic colors from `ThemeContext`
- Theme tokens defined in `constants/colors.ts` (light + dark)
- Three custom font families loaded in `lib/fonts.ts`: Plus Jakarta Sans, Bespoke Serif, Tanker
- Heavy use of `LinearGradient`, `BlurView`, and Reanimated animations

## Code Conventions

- **Formatting**: Prettier — double quotes, semicolons, 2-space indent, trailing commas (es5), 80 char width
- **React Compiler** is enabled (experimental) — avoid patterns that break compiler assumptions
- **Reanimated worklets**: Babel plugin `react-native-worklets` is configured; animation callbacks run on UI thread
- **Haptic feedback**: Used on interactive elements via `expo-haptics`
- **Error tracking**: Sentry is integrated via `@sentry/react-native`

## Environment Variables

Required in `.env.local`:
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_KEY` — Supabase anon/publishable key
- `TMDB_API_KEY` — TMDB API key (used in edge functions)
- `SENTRY_AUTH_TOKEN` — Sentry auth token
