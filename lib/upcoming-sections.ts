import type { UpcomingMovieItem } from "../services/mediaService";

export type UpcomingListRow =
  | { type: "header"; key: string; title: string }
  | { type: "movie"; key: string; item: UpcomingMovieItem };

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const dayWithYearFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function todayLocalYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const date = parseYmdLocal(ymd);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as a local date (new Date("YYYY-MM-DD") would be UTC). */
function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDayHeader(ymd: string, todayYmd: string): string {
  if (ymd === todayYmd) return "Today";
  if (ymd === addDaysYmd(todayYmd, 1)) return "Tomorrow";
  const date = parseYmdLocal(ymd);
  const currentYear = parseYmdLocal(todayYmd).getFullYear();
  return date.getFullYear() === currentYear
    ? dayFormatter.format(date)
    : dayWithYearFormatter.format(date);
}

/**
 * Flattens upcoming items into one FlashList-ready array of day headers and
 * movie rows, plus the header indexes for stickyHeaderIndices. Items are
 * deduped by media id, past dates are dropped, and days that straddle a page
 * boundary merge because grouping runs over the accumulated list each time.
 */
export function buildUpcomingRows(items: UpcomingMovieItem[]): {
  rows: UpcomingListRow[];
  stickyHeaderIndices: number[];
} {
  const todayYmd = todayLocalYmd();
  const seenMediaIds = new Set<string>();
  const rows: UpcomingListRow[] = [];
  const stickyHeaderIndices: number[] = [];
  let currentDay: string | null = null;

  // TMDB sorts by primary release date; the regional date we group on can
  // deviate by a few days, so re-sort before the single grouping pass.
  const sorted = [...items].sort((a, b) =>
    a.release_date < b.release_date ? -1 : a.release_date > b.release_date ? 1 : 0
  );

  for (const item of sorted) {
    if (!item.release_date || item.release_date < todayYmd) continue;
    if (seenMediaIds.has(item.media.id)) continue;
    seenMediaIds.add(item.media.id);

    if (item.release_date !== currentDay) {
      currentDay = item.release_date;
      stickyHeaderIndices.push(rows.length);
      rows.push({
        key: `header-${currentDay}`,
        title: formatDayHeader(currentDay, todayYmd),
        type: "header",
      });
    }

    rows.push({ item, key: item.media.id, type: "movie" });
  }

  return { rows, stickyHeaderIndices };
}
