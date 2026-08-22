import StarSolidIcon from "@hugeicons-pro/core-solid-standard/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { radius, spacing } from "../../../constants/theme";
import { ThemeContext } from "../../../contexts/theme-context";
import { useUserMedia } from "../../../hooks/use-user-media";
import { useUserReviews } from "../../../hooks/use-user-reviews";
import { computeProfileStats } from "../../../lib/profile-blocks/compute-stats";
import type { ProfileBlockProps } from "../../../lib/profile-blocks/types";
import { ThemedText } from "../../ui/themed-text";

const StatCell = ({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={[styles.cell, { backgroundColor: theme.card }]}>
      <View style={styles.valueRow}>
        {icon}
        <ThemedText variant="heading">{value}</ThemedText>
      </View>
      <ThemedText variant="footnote" weight="medium" color="secondary">
        {label}
      </ThemedText>
    </View>
  );
};

const StatsBlock = ({ isOwnProfile }: ProfileBlockProps) => {
  const { theme } = useContext(ThemeContext);
  const { data: media } = useUserMedia();
  const { data: reviews } = useUserReviews();

  const stats = useMemo(
    () => computeProfileStats(media ?? [], reviews ?? []),
    [media, reviews]
  );

  // Stats are computed from the current user's cached library only.
  // Lighting them up on other users' profiles is a follow-up (needs
  // userId-aware library/review hooks).
  if (!isOwnProfile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText variant="titleSm">Stats</ThemedText>
      <View style={styles.grid}>
        <StatCell value={String(stats.totalTracked)} label="Tracked" />
        {stats.byType.map((entry) => (
          <StatCell
            key={entry.label}
            value={String(entry.count)}
            label={entry.label}
          />
        ))}
        <StatCell
          value={
            stats.averageRating != null ? stats.averageRating.toFixed(1) : "—"
          }
          label="Avg rating"
          icon={
            <HugeiconsIcon icon={StarSolidIcon} size={14} color={theme.text} />
          }
        />
        <StatCell value={String(stats.reviewCount)} label="Reviews" />
      </View>
    </View>
  );
};

export default StatsBlock;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    minWidth: 88,
    flexGrow: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    gap: spacing.xs,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
