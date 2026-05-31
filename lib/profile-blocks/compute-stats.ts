import { Media } from "../../types/media";
import { UserReview } from "../../services/userMediaService";

export interface ProfileStatCount {
  label: string;
  count: number;
}

export interface ProfileStats {
  byType: ProfileStatCount[];
  totalTracked: number;
  averageRating: number | null;
  reviewCount: number;
}

// Maps the DB media_type literals to display labels.
const MEDIA_TYPE_LABELS: Record<string, string> = {
  movie: "Movies",
  tv_show: "TV",
  game: "Games",
  book: "Books",
};

const mediaTypeLabel = (mediaType: string): string =>
  MEDIA_TYPE_LABELS[mediaType] ?? mediaType;

/**
 * Computes profile stats from already-cached library + review data.
 * Pure function (no hooks) so it's React-Compiler-safe and easy to test.
 */
export function computeProfileStats(
  media: Media[],
  reviews: UserReview[]
): ProfileStats {
  const counts = new Map<string, number>();
  for (const item of media) {
    const label = mediaTypeLabel(item.media_type);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const byType: ProfileStatCount[] = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const rated = media.filter(
    (item) => item.user_rating != null && item.user_rating > 0
  );
  const averageRating =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, item) => sum + (item.user_rating ?? 0), 0) /
            rated.length) *
            10
        ) / 10
      : null;

  return {
    byType,
    totalTracked: media.length,
    averageRating,
    reviewCount: reviews.length,
  };
}
