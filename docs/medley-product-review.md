# Medley — A Staff-Level Product & Engineering Review

## 1. Executive Summary

Medley is a React Native (Expo 56) cross-media tracker — movies, TV, games, and books in one library, with reviews, ranked collections, recommendations, and planned social and swipe-discovery features. It is built by someone with real craft: the morphing home carousel, the parallax/pull-to-zoom media-detail backdrop, the shared-element avatar zoom, the pill-to-card review composer, and the staggered onboarding animations are genuinely premium, better than most shipping trackers.

**Medley's biggest strength is its multi-media thesis backed by real visual polish.** No single-vertical competitor (Letterboxd, Goodreads, Backloggd, Serializd) can show you "your whole year in media" or build a list mixing a game, a book, and a show. That breadth, plus the craft, is the moat — *if* the product delivers on it.

It does not yet. The throughline across all eleven audits is the same: **Medley is a beautifully decorated shell wrapped around features that are stubbed, half-wired, or movie-only.** The five things that matter most:

1. **Two of five tabs don't work.** Social is a centered "Social" label over a blur. Match — the elevated, Rive-buttoned center tab — is a marketing splash whose "Start swiping" button is `onPress={() => {}}`. That's 40% of the primary navigation occupied by placeholders.
2. **The core tracking action is unreachable — as a complete dead chain.** `StatusButton` (Want/In-progress/Completed) is fully built and imported nowhere; it is the *only* consumer of `useAddToLibrary`, which is the only caller of `addToUserList`. The entire write path for library status is orphaned end-to-end. You literally cannot mark something "want to watch" anywhere in the shipping UI. For a *tracking* app, this is the whole job, missing.
3. **The data model is a storage model, not a diary model — and it leaks into everything.** One `user_media` row per (user, media), integer 1–5 ratings (despite a 0.5-precision picker that silently rounds), no dates, no re-watch/re-read, no DNF. Every retention feature competitors win on (feeds, Wrapped, rewatch stats) requires a diary primitive Medley doesn't have.
4. **Signup can silently dead-end before the app even opens.** `signup.tsx` checks only `data.user` after `supabase.auth.signUp` and never inspects `data.session`. On any project with email confirmation enabled, the user is walked through the entire onboarding flow, then the RLS-protected `profiles` write in `completeOnboarding` runs unauthenticated and fails. This is the single highest-correctness defect in the app.
5. **Dead controls and a native crash erode trust on contact.** Filter buttons that `console.log`, a profile Retry that calls `window.location.reload()` (a no-op/throw on native), no-op Edit Profile and Favorite actions, two stubbed Share buttons. These are cheap to fix and disproportionately damaging.

The good news: the hard parts (animation, the favorite-recommendations edge function, the data-layer skeleton, the follows schema) are done and done well. Most of what's missing is *assembly*, not architecture.

One meta-note worth fixing immediately: **`CLAUDE.md` has drifted from the code** and can't be trusted as ground truth. It says Expo 54 (`package.json` is `^56.0.0-preview.7`) and lists eight edge functions (`movie-task`, `games-task`, `backfill-movie-recs`, `backfill-game-recs`, `upload-profile-image`, `push`, `generate-notification`, `popular-movies`) that do not exist; the actual set is `favorite-recommendations`, `media-detail`, `search-media`, `search-tmdb`, `showtimes`, `sync-tmdb-popular-movies`, `tv-season-detail`. Update the doc before the next contributor relies on it.

---

## 2. Product Vision & Positioning

**The thesis — "everything tracker" — is validated and defensible.** Competitors Sequel, Hypelist, OnTrack, and BacklogBox all prove the category exists, and the pitch is consistent: *maintaining four or five apps isn't manageable; see your whole media life in one place.* Medley's breadth enables three things no specialist can copy: mixed-media ranked lists, a unified cross-vertical "Up Next" release hub, and a cross-media Year-in-Review.

**Who it's for:** the person who reads, watches, and plays and is tired of juggling Letterboxd + Goodreads + Backloggd. The polish suggests a taste-conscious, design-literate audience (the Letterboxd/StoryGraph demographic), not completionists.

**The core retention loop is the gap.** Every durable tracker runs on *log-the-thing-you-just-finished → rate it → get a reward (stat bump, feed event)*. Letterboxd logged 701M films in 2024 on exactly this. Medley has no fast log loop: tracking status is unreachable, the only rating path forces a fullscreen keyboard modal, and a new user lands in an empty home that recommends generic popular *movies*. Time-to-first-value is poor — onboarding collects preferences that **never seed the first-run feed** (the recommender keys off library/favorites, which are empty for a new user), so the most motivated moment produces no payoff.

**What's missing to deliver on the promise**, distilled from the research:

- **A diary layer.** The single structural difference between a storage app and Letterboxd/StoryGraph. Dated, repeatable log entries (with optional rating/review/rewatch flag/tags) are the foundation that feeds, Wrapped, and rewatch history all depend on. This is the highest-leverage product change in the entire review.
- **Media-type-aware status & metadata.** Games need a richer set than three states (Backlog/Abandoned alongside Playing/Completed); TV benefits from season-level granularity; books need progress %, DNF, author/series, and a data source that *doesn't exist yet*. A movie-shaped schema force-fit onto four media is the recurring failure mode of generic trackers — but the fix here should stay deliberately minimal (see the roadmap caveat in §5) so it doesn't balloon into the heavy data layer the project deliberately avoids.
- **The cross-media payoffs that justify the breadth:** a unified release calendar (episode air dates + game launches + book pub dates) wired to the push infra Medley already has; a "Medley Wrapped" that totals hours across all four; mixed-media shareable lists as the acquisition unit.

**Strategic warning from the research:** don't lead with AI recommendations (the Likewise→Pix cautionary tale: 6M users, AI pivot, no cultural moat). Recommendations are a feature; the *habit* (logging) and *identity* (shareable taste) are the moat. And don't try to out-community Letterboxd day one — win on organization + cross-vertical breadth, start social friends-first.

---

## 3. Information Architecture & Navigation

The current five-tab structure is the most visible IA problem in the app:

```
   Home        Social       [MATCH]      Library      Profile
  (movies)    (empty stub)  (no-op CTA)  (poster wall) (re-hosts Library)
     |            |             |            |            |
  works        DEAD          DEAD         works      2/3 tabs dup Library
```

Three distinct pathologies:

**(a) Two of five tabs are non-functional.** Social and Match together are 40% of the nav, and neither does anything. The Rive center button visually promises Match is the marquee feature; tapping it lands on a splash with a dead button. This is the worst possible signal-to-substance ratio in the nav.

**(b) Library ↔ Profile redundancy.** The Profile tab's "Library" page renders the *identical* `useUserMedia` grid as the standalone Library tab, and Profile's "Collections" page re-renders the same `useUserCollections` list. Two of three profile tabs duplicate a sibling top-level tab. Users have no mental model for why their library lives in two places, and the two surfaces will drift (Library has search + ranked split; Profile doesn't).

**(c) No "what's next" surface.** For a tracker, the highest-intent rail is "continue watching/playing/reading." It exists nowhere. Home leads with a movie billboard instead.

**Proposed IA.** Resolve the duplication by giving each tab a single clear job, and don't ship a tab until it works:

```
   Home          Discover         Library         Social         Profile
 (Up Next +     (Match swipe     (the ONE        (feed +        (identity:
  rails, all     deck + mood      home for        incoming +     favorites,
  media types)   search)          browsing/       discover)      stats, reviews;
                                   collections)                   NO library dup)
```

- **Home** becomes the Simkl-style "Up Next" dashboard: continue-in-progress (all types), upcoming releases, friend activity, then per-type recommendation rails, with popular as the bottom catch-all.
- **Discover** is where the Match swipe deck lives once built (rename it; "Match" implies a social mechanic that doesn't exist).
- **Library** is the sole owner of browsing, search, status shelves, and collections.
- **Profile** becomes pure identity: Top Favorites, taste/stats summary, reviews — and *stops re-hosting the library entirely*. Keep at most a curated "featured collections" strip that deep-links into Library.
- **Social** ships only when there's a feed + follow + discovery behind it.

Until Social and Match are real, the honest move is a **three-tab** shell (Home / Library / Profile) with Discover and Social introduced as they land. Five tabs where two are dead is worse than three that work.

---

## 4. Screen-by-Screen UX

**Home** — *Current: a polished movie billboard masquerading as a 4-type tracker's home.* Top problems: three by-type recommendation queries (`game`/`movie`/`tv_show`) are fetched on every mount and **never rendered** — each is a multi-fetch recommendation query (external-source blocks + an owned-items query + a dedup fetch) whose results are discarded — and they gate the content-ready splash, directly delaying perceived load (`app/(protected)/(tabs)/(home)/index.tsx:34-68`, confirmed). Only two rails render, both movie-centric, and they can show the *same* content when favorites falls back to popularity. Filter button is a `console.log` no-op (`:86-89`). No empty/error state — an empty `popular_movies` table yields a blank screen. *Recommended:* delete the discarded queries and re-gate ready on only what renders; rebuild as an intent-first rail stack (Continue → friend activity → favorites → per-type → popular); add skeleton/empty/error states reusing the existing MediaCard skeleton.

**Library** — *Current: three swipeable tabs (All/Collections/Ranked), All is a flat 4-column poster wall.* Top problems: the All-tab empty state checks `allCollections.length === 0` but renders `mediaItems` (`app/(protected)/(tabs)/(library)/index.tsx:147`, **confirmed** — a user with media but no collections sees "No media yet"). No status/type/sort segmentation despite the app modeling several statuses and 4 types — and the query doesn't even `select('status')` (`services/userMediaService.ts:88`). `scrollEnabled={false}` on a masonry FlashList nested in a ScrollView defeats virtualization entirely (`:180`). Filter button is a no-op (`:79-82`). *Recommended:* fix the one-line empty-state bug; wire the filter into a status/type/sort sheet backed by a status-aware query; restructure All into status shelves (Currently / Want / Completed); fix the nested-scroll so FlashList can recycle.

**Profile** — *Current: an excellent avatar interaction wrapped around dead controls.* Top problems: Retry calls `window.location.reload()` (`:215`, **confirmed** — throws/no-ops on native); Edit Profile is `onPress={() => {}}` (`:329`); Follower/Following counts are `Pressable` with no handler and no destination (`:306`/`:317`); two of three tabs duplicate Library; `media_preferences` taste data is collected but never surfaced; the sticky-tab behavior relies on a fragile `measureLayout` + `measureInWindow` + `setTimeout` + computed `minHeight` hack. *Recommended:* fix the three dead controls first; redefine the profile around identity + reviews + a taste/stats header (derivable client-side from already-fetched data); replace the master-ScrollView hack with a single virtualized list with a sticky header.

**Media Detail** (`app/(protected)/media-detail/index.tsx`) — *Current: the app's richest, most polished screen — and the weakest where it matters for a tracker.* Top problems: the primary track action is undiscoverable (`StatusButton` is dead code; rating is two taps deep in a bottom pill); books get *no* type-specific treatment (the rating logo resolves to `null` at `:364`, no author/publisher/page count) and games barely any; `WhereToWatchCarousel` is unwired and ships 10 fake Netflix placeholder logos; friends' ratings are absent despite follows existing; Share is a no-op in two places (`:243-245`, `:469-472`); the error state prints raw `error.message` (`:290`) and "Try Again" calls `router.back()` (`:292`) instead of refetching. *Recommended:* promote a persistent status + tap-to-rate action bar above the fold; make the layout type-aware via a per-type section config; build a real where-to-watch and a "rated by people you follow" module.

**Save / Review** — *Current: three incoherent surfaces.* Top problems: library status can't be set anywhere (StatusButton orphaned); 0.5-star precision is silently `Math.round`ed before saving (`review-input.tsx:301`, **confirmed**) — a lossy round-trip; `submitReview` writes rating/review but never sets status, leaving rows in an undefined status; submit failures are swallowed (`// Optionally show an error toast here`); the status vocabulary (`watching/reading/playing`) diverges from the schema documented in CLAUDE.md (`in_progress`) (`services/userMediaService.ts:5-10`, **confirmed**) — note that the `user_media` table and its CHECK constraint are *not present in any migration*, so whether this divergence actually fails at the DB is unverifiable from the repo and depends on the live schema; leftover `backgroundColor: "red"` debug detent (`:546`, **confirmed**). *Recommended:* ship a unified status+rating control; pick one rating granularity end-to-end; add a one-tap "just rate" path and allow text-only saves; surface submit errors; reconcile the status vocabulary against the actual deployed constraint.

**Collections** — *Current: attractive, cross-media, mostly built — but socially inert with a data-loss bug.* Top problems: no way to view *anyone else's* collections (the listing hook and the only profile route are both self-scoped) — the entire payoff of public ranked lists is unrealized; every Share path is a TODO or shares only a title string; edit does a non-transactional delete-all-then-reinsert (`collectionService.ts:262`), risking a permanently empty collection on a failed save; "Add Collection" vs "Add Ranking" both open the same form with Ranked toggle *off*, so "Add Ranking" creates an unranked list; a `renderCounter` remount hack causes image flicker on every drag; a shipped "force rank indicator for testing" comment (`collection/[id].tsx:507`). *Recommended:* real sharing + other-user viewing; make edits transactional/incremental; resolve the Collection-vs-Ranked model with honest entry points.

**Match** — *Current: a marketing splash; the feature does not exist.* "Start swiping" is `onPress={() => {}}` (`:228`, **confirmed**); the SegmentedPicker drives dead state; there is no card deck, no like/dislike persistence (no table, service, or function), and no social match mechanic despite the name. Foundations exist (RecommendationService can supply candidates, RadialMenu could power an action wheel). *Recommended:* build a single-player swipe deck with three-direction gestures *and* explicit accessible buttons; add a `media_feedback` table so dislikes exclude items and refine ranking; wire the picker; design first-run/loading/error/end-of-deck states; later, a friends "movie-night" match mode on top of follows.

**Social** — *Current: a stub.* The follows schema is well-designed and `FollowsService.follow/unfollow/isFollowing` are fully written but called nowhere — so the follow graph can never grow and the profile counts are structurally always zero. *Recommended:* ship an MVP activity feed (one batched `user_media WHERE user_id IN (following)` query, not an N+1 loop), a public `/user/[id]` route that finally exercises the follow mutation, user discovery so the feed is never empty, and wired follower/following lists. **Blocking prerequisite:** confirm cross-user SELECT RLS on `user_media` or every feed query silently returns empty.

**Onboarding** — *Current: visually premium, flawed on fundamentals.* Top problems: email verification is unhandled — `signup.tsx:215-230` checks only `data.user` (never `data.session`) after `signUp`, sets `userId`, and navigates to `/name`; with confirmation enabled there is a user but no session, so the later RLS-protected `profiles` write in `ProfileService.completeOnboarding` (`auth-context.tsx:101`) runs unauthenticated and fails — silently dead-ending the most motivated user after the entire flow; a double-navigation race on completion (`completeOnboarding` does `router.replace("/(tabs)")`, then the caller does `router.push` — `auth-context.tsx:104` + `media-preferences.tsx:61-62`); the entire app is hard-gated with no guest/browse mode; Books preference seeds no recommendations; no loading/disabled state on completion (double-tap fires duplicate navigations). *Recommended:* fix email verification (handle the no-session case, or disable confirmation) **first**, then the nav/loading bugs (correctness); add guest mode and preference-seeded recommendations (activation); add forgot-password and accessibility.

---

## 5. Feature Roadmap

Prioritized into Now (P0, correctness + reachability) / Next (P1, the retention engine) / Later (P2, differentiation). Effort is rough: S < 1 day, M 1–3 days, L ~1 week, XL multi-week.

A scoping caveat for the data-model items (#9, #10, #15, #18): the project's convention is a thin data layer (external APIs proxied + TanStack on the client, no cache tables). The diary primitive (#9) is well-justified and worth the weight. But per-type status taxonomies, season-level TV, and game time-to-beat must stay **minimal and additive** — a single nullable `started_at`/`finished_at` + a small status enum + a thin TMDB/IGDB proxy, *not* a heavy per-vertical schema. Keep them deferred and scoped tight.

| # | Feature | Why | Effort | Priority |
|---|---------|-----|--------|----------|
| 1 | Fix email verification (handle no-session, or disable confirmation) | Signup silently dead-ends every new user before they reach the app; highest-correctness item | M | **P0** |
| 2 | Wire `StatusButton` into Media Detail as an always-visible status + tap-to-rate bar | The core tracking write path (`StatusButton`→`useAddToLibrary`→`addToUserList`) is orphaned end-to-end; components are built | M | **P0** |
| 3 | Fix the three dead controls + native crash (profile Retry→refetch, Edit Profile route, count Pressables) | Broken-on-contact controls; one is a native crash | M | **P0** |
| 4 | Fix Library empty-state bug + add per-query loading/error | Users with media see "No media yet"; one-line correctness fix | S | **P0** |
| 5 | Delete Home's 3 discarded by-type queries; re-gate content-ready | Pure waste on every mount; delays splash | S | **P0** |
| 6 | Bring the core schema under version control (migrations for `media`, `user_media`, `profiles`, `collections`, `collection_items`, etc.) | The entire core schema lives outside `supabase/migrations/`; the project is not reproducible and drift is undetectable | M | **P0/P1** |
| 7 | Build the Match swipe deck + `media_feedback` (like/dislike) persistence | The marquee tab; dislikes are the cheapest high-value taste signal | XL | **P1** |
| 8 | Social MVP: activity feed + public `/user/[id]` + follow button + discovery | Unlocks the social half the backend already supports; exercises dead FollowsService | XL | **P1** |
| 9 | Books data source: `book` branch in `search-media` (Open Library + Google Books fallback) | Books is a first-class type with *no* data source; selecting it yields an empty app | L | **P1** |
| 10 | Minimal diary layer on `user_media`: dated entries + rewatch + start/finish dates; stop overwriting `added_at` | The structural foundation for feeds, Wrapped, rewatch stats — kept additive | XL | **P1** |
| 11 | Minimal media-type-aware statuses (games: Backlog/Abandoned; books: DNF + progress %) | 3-state enum is too coarse; abandons/pauses are high-signal — small enum, not per-type tables | M | **P1** |
| 12 | Half-star ratings end-to-end (migrate `user_rating`); separate "like"/heart | Genre standard; current picker collects 0.5 then rounds (lossy bug) | M | **P1** |
| 13 | Preference-seeded first-run recommendations + onboarding taste-picker | New users get no payoff; preferences are collected but never used | M | **P1** |
| 14 | Friends' ratings module on Media Detail | Social proof at the decision point; strong differentiator | L | **P1** |
| 15 | Real where-to-watch (wire `WhereToWatchCarousel` to real providers; delete fake logos) | Baseline expectation on movie/TV pages | M | **P1** |
| 16 | Season-level TV tracking via thin TMDB proxy | TV is one catalog item today; can't log "finished S2" — keep proxy thin | L | **P2** |
| 17 | Cross-media release calendar + push (episode/game/book/movie dates) | A genuine differentiator no specialist can match; push infra exists | L | **P2** |
| 18 | "Medley Wrapped" cross-media year-in-review (gated at ~10 logs) | Viral re-engagement; uniquely cross-media; depends on diary | L | **P2** |
| 19 | Time-to-beat for games via thin IGDB proxy + filter backlog by time cost | The one film-less game metadata that drives a daily open | M | **P2** |
| 20 | Reviews/collections as likeable + commentable social objects + cross-media shareable lists | Lists are the acquisition unit; reactions drive engagement | M | **P2** |
| 21 | Top Favorites pin on profile (Letterboxd "Four Favorites") | Highest-ROI identity feature; trivial; seeds discovery | M | **P2** |

---

## 6. Engineering & Refactor Backlog

The data-layer *skeleton* is strong — centralized query keys with input normalization, shared `queryOptions`, a thoughtful `AppError`/retry model, clean MMKV persistence, and the discipline to revert the showtimes cache-table+cron experiment via paired migrations. The debt is concentrated in a few well-defined places.

| Item | Detail / Location | Severity | Effort |
|------|-------------------|----------|--------|
| Email-verification dead-end | `signup.tsx:215-230` checks `data.user` not `data.session`; RLS profile write later fails with no session (**confirmed**) | Critical | M |
| Core schema absent from migrations | Migrations cover only `popular_movies`, the reverted showtimes cache/cron, and `follows`. No migration for `media`, `user_media`, `profiles`, `collections`, `collection_items`, `notifications`, or `unified_genres` — the entire app schema is unversioned (**confirmed**) | High | M |
| `window.location.reload()` on native | Profile Retry — web-only, throws/no-ops (`(profile)/index.tsx:215`, **confirmed**). Replace with the query's `refetch()` | High | S |
| Library empty-state gating bug | Checks `allCollections.length` but renders `mediaItems` (`(library)/index.tsx:147`, **confirmed**) | High | S |
| Three fetched-but-unrendered Home queries | Multi-fetch recommendation queries discarded every mount; also gate content-ready (`(home)/index.tsx:34-68`, **confirmed**) | High | S |
| No-op handlers shipped live | Match CTA `onPress={() => {}}` (`:228`, confirmed); Home/Library filter `console.log`; Edit Profile `() => {}` (`:329`); Favorite radial action; count Pressables (`:306`/`:317`); Share ×4; Clone | High | S–M each |
| Lossy rating round-trip | `Math.round(rating)` destroys 0.5 precision (`review-input.tsx:301`, **confirmed**) | High | M |
| Non-transactional collection edit | Delete-all-then-reinsert risks permanent emptying (`collectionService.ts:262`) | High | M |
| 80 `any` occurrences (project bans `any`) | Hotspots: `recommendationService.ts` (~12), `userMediaService.ts` (5), `mediaService.ts:80`, `genremapper.ts:215-216`, radial primitives, `searchResults?: any[]`. Use generated Supabase row types or `unknown`+narrowing | High | L |
| `recommendationService` violates thin-proxy convention | Multi-fetch per-owned-item aggregation + client-side `Math.random()` jitter ranking (`:76`) + DB-genre-view fallback. `getFromFavorites` already shows the target shape. Collapse ranking into one edge function — note this touches `getByType`, `getAll`, `getSimilarToMedia`, *and* the genremapper RPC path, so the L estimate is on the optimistic side | High | L+ |
| Orphaned schema dependencies | `user_media_with_genres` view, `unified_genres` column, `get_cross_media_recommendations` RPC referenced in code but have **no migration** — a subset of the broader "core schema unversioned" finding above | High | M |
| Duplicate recommendation stack | `lib/genremapper.ts` ships a second untyped data path (hook calling Supabase directly, RPC with no migration) overlapping `recommendationService`. Delete or fold in | Medium | M |
| Duplicated spotlight SVG | Identical ~40-line block + shared SVG filter id `filter0_f_2_34` copy-pasted into **6 files** (4 tab screens + `onboarding.tsx` + auth layout). Risks id collisions. Extract `<SpotlightBackdrop>` | High | S |
| Three-way rank-badge duplication | Gold/silver/bronze JSX in both `collection/[id].tsx` and `collection-item.tsx`, already drifted (32px vs 40px). Extract `<RankBadge>` | Low | S |
| Glass-surface treatment reimplemented 3× | Button/Input/Search each re-compose BlurView+border+radius (incl. an rgba regex). This is *why* light-mode tuning was missed everywhere. Extract `GlassSurface` | Medium | L |
| Scroll/measure fragility | Profile's `measureLayout`+`measureInWindow`+`setTimeout`+computed `minHeight` sticky-tab hack (`:147-199`); Library's `scrollEnabled={false}` defeating FlashList virtualization | High | L |
| AuthContext not memoized + duplicates profile | Fresh value object every render re-renders every query consumer; profile cached in both AuthContext and TanStack (drifts after avatar upload). Slim Auth to session-only, memoize | Medium | M |
| `setUser` stale-closure | `setUserId`/`setUserName` spread render-time `user`; two in one tick can drop an update. Use functional updaters | Medium | S |
| Shared-value-in-effect | `use-shared-search` reads `screenView.value` in a `useEffect` dep — won't re-run reliably, breaks React Compiler. Use `useAnimatedReaction` | Medium | S |
| Status vocabulary mismatch | `UserMediaStatus` (`watching/reading/playing`, `userMediaService.ts:5-10`) vs CLAUDE.md's `in_progress`. The `user_media` CHECK is not in any migration, so a runtime DB failure is unverifiable from the repo — reconcile against the live schema | Medium | S |
| Stale project docs | `CLAUDE.md` says Expo 54 (actual 56) and lists 8 edge functions that don't exist (actual: `favorite-recommendations`, `media-detail`, `search-media`, `search-tmdb`, `showtimes`, `sync-tmdb-popular-movies`, `tv-season-detail`) | Medium | S |
| Dead/test code in production | `addSampleDataForTesting` with hardcoded UUIDs; `// force rank indicator for testing` (`collection/[id].tsx:507`); red debug detent; mislabeled "Home" stack titles in Match & Social layouts | Low | S |
| HomeBackdrop effect deps + worklet API drift | Stale-closure under React Compiler; mixes deprecated `.value`/`runOnJS` with `.get()/.set()/scheduleOnRN` across home files | Medium | S |

**Accessibility gaps (cross-cutting, currently near-absent — only 5 files use any a11y props):**
- The entire **tab bar** has no `accessibilityRole="tab"`, labels, or `selected` state — the most important nav surface is invisible to screen readers.
- Icon-only buttons everywhere (settings gear, filter, sheet close, toast close/action, search clear) have no labels. Standardize on `AnimatedIconButton`, which already does this right.
- `StarRating` has no `accessibilityRole="adjustable"`/`accessibilityValue` and no non-gesture path; `Switch` exposes no `role="switch"`/state.
- **No font-scaling policy** — zero `maxFontSizeMultiplier`; fixed `height: 52` controls will clip at large Dynamic Type.

**Two correctness landmines in the design tokens** (`constants/colors.ts`): the **light theme reuses dark glass tokens** (near-white `inputText` `#E5E5E5` on a dark field over a white page — many pairs fail WCAG AA), and `silverDark: "##293840"` (`:64`) is an invalid double-hash literal. The light-theme contrast failure is the genuinely damaging one — either tune light mode properly or gate the toggle to dark-only until it's done.

---

## 7. Quick Wins (<1 day each, high impact)

1. **Handle the no-session signup case** (or disable email confirmation) so new users can't dead-end before the app opens. The single highest-correctness fix. (`signup.tsx:215-230`, `auth-context.tsx:101`)
2. **Fix the Library empty-state condition** → `mediaItems.length === 0`. One line; stops telling users with media that they have none. (`(library)/index.tsx:147`)
3. **Replace `window.location.reload()` with `refetch()`** on the profile Retry. One line; removes a native crash. (`(profile)/index.tsx:215`)
4. **Delete Home's three discarded by-type queries** and re-gate content-ready on only `favoriteRecommendations` + `popularMovies`. Removes wasted fetches and speeds the splash. (`(home)/index.tsx:34-68`)
5. **Hide every no-op control** you won't wire this week: Home/Library filter buttons, Match CTA, Edit Profile, the Favorite radial action, the count Pressables, both Share buttons. A hidden control beats a lying one.
6. **Remove `backgroundColor: "red"`** from the review-input detent. (`review-input.tsx:546`)
7. **Extract `<SpotlightBackdrop>`** and replace the 6 inline copies — kills the duplicated SVG filter id (`filter0_f_2_34`) collision risk in one PR.
8. **Either round the star picker to integers OR stop offering half-stars** — pick one so the rating UI stops lying about precision it discards. (`review-input.tsx:301`)
9. **Add `accessibilityRole`/`accessibilityLabel`/`selected` to the five tab buttons.** Mechanical; makes the primary nav usable with VoiceOver.
10. **Fix the onboarding double-navigation race** — remove the `router.push("/")` and let `completeOnboarding` own navigation. (`media-preferences.tsx:62`)
11. **Disable the completion/login/signup buttons while their async handler runs** — prevents double-fire duplicate navigations.
12. **Update `CLAUDE.md`** (Expo 56, correct edge-function list) and **fix `silverDark: "##293840"`** → single hash. Both trivial doc/literal corrections; low individual impact but they remove active misinformation. (`constants/colors.ts:64`)

---

**Bottom line:** Medley has already done the expensive, risky work — the animation craft, the recommendation engine that matters (`favorite-recommendations`), the data-layer skeleton, and the social schema. What remains is mostly assembly and honesty: fix the signup dead-end, wire the orphaned tracking chain, finish or hide the two dead tabs, get the schema into migrations, evolve the storage model into a *minimal* diary, and stop shipping controls that lie. Do the P0 list this week — lead with the email-verification fix, then the one-liners — then commit to the diary layer and the Match deck. Those two unlock the retention loop and the marquee feature the whole app is visually promising.