import type { ComponentType } from "react";

/**
 * The set of profile block kinds the app knows how to render.
 * Add a new kind here, then register its component in `registry.ts`.
 */
export type ProfileBlockKind = "favourites" | "stats";

/**
 * A single block instance as stored in a user's saved layout.
 * `id` is stable across reorders and is used as the React key /
 * DraggableFlatList keyExtractor. `enabled: false` blocks stay in the
 * config (so toggling restores their position) but are not rendered.
 */
export interface ProfileBlockConfig {
  id: string;
  kind: ProfileBlockKind;
  enabled: boolean;
}

/**
 * The full ordered layout document persisted on `profiles.profile_layout`.
 * `version` lets us migrate the shape forward later.
 */
export interface ProfileLayout {
  version: 1;
  blocks: ProfileBlockConfig[];
}

/**
 * Props every block component receives. Each block fetches its own data via
 * its own hook; `userId` enables reuse on other users' profiles and
 * `isOwnProfile` drives edit affordances / empty-state placeholders.
 */
export interface ProfileBlockProps {
  userId: string;
  isOwnProfile: boolean;
  config: ProfileBlockConfig;
}

/**
 * Registry entry describing a block kind: how to render it, its display title
 * (shown in the customization editor), and whether it's part of the default
 * seeded layout.
 */
export interface ProfileBlockDefinition {
  kind: ProfileBlockKind;
  title: string;
  Component: ComponentType<ProfileBlockProps>;
  defaultEnabled: boolean;
}
