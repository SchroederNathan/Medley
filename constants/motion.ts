// Shared animation durations (ms) so motion across the app feels related.
// Deliberately tuned one-off durations (75, 220, 250, 260...) stay inline;
// only use these for the common cases they name.
export const motion = {
  fast: 100, // press feedback
  quick: 200, // small state changes: toggles, fades
  base: 300, // element transitions: enter/exit
  slow: 600, // large surfaces: sheets, screen-level reveals
} as const;
