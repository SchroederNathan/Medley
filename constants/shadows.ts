// boxShadow strings (never legacy shadowColor/shadowOffset/elevation shadows).
// Note: elevation paired with zIndex for Android stacking order is layout,
// not a shadow, and does not belong here.
export const shadows = {
  // Subtle top inner highlight used on glassy cards and posters.
  insetHighlight: "rgba(204, 219, 232, 0.3) 0 1px 4px -0.5px inset",
  // Deeper variant for large carousel cards.
  insetHighlightDeep: "rgba(204, 219, 232, 0.25) 0 2px 8px -1px inset",
  // Floating surfaces (toasts, popovers).
  overlay: "0px 4px 8px rgba(0, 0, 0, 0.3)",
} as const;
