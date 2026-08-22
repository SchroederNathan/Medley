// Spacing scale on a 4-point grid. Steps are derived from the values the app
// already uses most (16, 12, 20, 8, 4, 24, 32, 40). Use the nearest step for
// in-between values; xxs is the half-step for hairline gaps.
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;
