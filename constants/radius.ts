// Corner radii. Pair every non-full radius with borderCurve: "continuous".
// A nested surface inside a padded parent uses the parent radius minus the
// padding (e.g. radius.md outer with 1px padding -> radius.md - 1 inner).
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999, // capsules and circles
} as const;
