import { Star } from "lucide-react-native";
import React, { useContext, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../../../contexts/theme-context";
import { useUserMedia } from "../../../hooks/use-user-media";
import { useUserReviews } from "../../../hooks/use-user-reviews";
import { computeProfileStats } from "../../../lib/profile-blocks/compute-stats";
import { fontFamily } from "../../../lib/fonts";
import type { ProfileBlockProps } from "../../../lib/profile-blocks/types";

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
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      </View>
      <Text style={[styles.label, { color: theme.secondaryText }]}>
        {label}
      </Text>
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
      <Text style={[styles.title, { color: theme.text }]}>Stats</Text>
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
          icon={<Star size={14} color={theme.text} fill={theme.text} />}
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
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    minWidth: 88,
    flexGrow: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamily.plusJakarta.medium,
  },
});
