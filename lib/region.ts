/**
 * Best-effort ISO 3166-1 region for the device, derived from the JS Intl
 * locale (no native module, no permission prompt). Falls back to US when the
 * locale carries no region subtag.
 */
export function getDeviceRegion(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    const match = /-([A-Z]{2})\b/.exec(locale.toUpperCase().replace(/_/g, "-"));
    if (match) return match[1];
  } catch {
    // Intl misconfigured on this device; fall through to the default.
  }
  return "US";
}
