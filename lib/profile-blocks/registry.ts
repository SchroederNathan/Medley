import FavouritesBlock from "../../components/profile/blocks/favourites-block";
import StatsBlock from "../../components/profile/blocks/stats-block";
import type {
  ProfileBlockDefinition,
  ProfileBlockKind,
  ProfileLayout,
} from "./types";

/**
 * The single place block kinds register. To add a new block type:
 *   1. add its kind to `ProfileBlockKind` in types.ts
 *   2. add an entry here pointing at its component
 */
export const PROFILE_BLOCK_REGISTRY: Record<
  ProfileBlockKind,
  ProfileBlockDefinition
> = {
  favourites: {
    kind: "favourites",
    title: "Favourites",
    Component: FavouritesBlock,
    defaultEnabled: true,
  },
  stats: {
    kind: "stats",
    title: "Stats",
    Component: StatsBlock,
    defaultEnabled: true,
  },
};

export const ALL_BLOCK_KINDS = Object.keys(
  PROFILE_BLOCK_REGISTRY
) as ProfileBlockKind[];

export function getBlockDefinition(
  kind: string
): ProfileBlockDefinition | undefined {
  return PROFILE_BLOCK_REGISTRY[kind as ProfileBlockKind];
}

/**
 * The layout seeded for users who haven't customized their profile yet.
 * Block instance ids equal their kind since each kind appears at most once.
 */
export const DEFAULT_PROFILE_LAYOUT: ProfileLayout = {
  version: 1,
  blocks: ALL_BLOCK_KINDS.map((kind) => ({
    id: kind,
    kind,
    enabled: PROFILE_BLOCK_REGISTRY[kind].defaultEnabled,
  })),
};
