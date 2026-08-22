import MoreVerticalSolidIcon from "@hugeicons-pro/core-solid-standard/MoreVerticalIcon";
import StarSolidIcon from "@hugeicons-pro/core-solid-standard/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { radius, shadows, spacing, type } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { ThemedText } from "./themed-text";
import { TruncatedText } from "./truncated-text";

interface UserReviewCardProps {
  review: string;
  posterUrl: string;
  title: string;
  rating: number;
  createdAt: string;
  mediaId: string;
}
const UserReviewCard = ({
  review,
  posterUrl,
  title,
  rating,
  createdAt,
  mediaId,
}: UserReviewCardProps) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        router.push(`/media-detail?id=${mediaId}`);
      }}
    >
      <ThemedText variant="headline">{title}</ThemedText>
      <View style={styles.starRatingContainer}>
        <View style={styles.starRating}>
          {Array.from({ length: 5 }, (_, i) => {
            const fillPercentage = Math.min(1, Math.max(0, rating - i));
            const starSize = 16;
            if (fillPercentage <= 0) {
              return (
                <HugeiconsIcon
                  icon={StarSolidIcon}
                  key={i}
                  size={starSize}
                  color={theme.border}
                />
              );
            }
            if (fillPercentage >= 1) {
              return (
                <HugeiconsIcon
                  icon={StarSolidIcon}
                  key={i}
                  size={starSize}
                  color={theme.text}
                />
              );
            }
            // Half star
            return (
              <View key={i} style={{ width: starSize, height: starSize }}>
                <HugeiconsIcon
                  icon={StarSolidIcon}
                  size={starSize + 2}
                  color={theme.border}
                />
                <View
                  style={{
                    position: "absolute",
                    width: starSize * fillPercentage,
                    height: starSize,
                    overflow: "hidden",
                  }}
                >
                  <HugeiconsIcon
                    icon={StarSolidIcon}
                    size={starSize}
                    color={theme.text}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <ThemedText variant="subhead" color="secondary">
          {"·    "}
          {createdAt}
        </ThemedText>
      </View>

      <View style={styles.posterReviewContainer}>
        <Image source={{ uri: posterUrl }} style={styles.posterImage} />
        <TruncatedText
          text={review}
          numberOfLines={8}
          textStyle={[styles.reviewText, { color: theme.text }]}
          containerStyle={styles.reviewContainer}
          animated={true}
        />
      </View>
      <Pressable style={styles.optionsButton}>
        <HugeiconsIcon
          icon={MoreVerticalSolidIcon}
          size={24}
          color={theme.text}
        />
      </Pressable>
    </Pressable>
  );
};

export default UserReviewCard;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginRight: spacing.huge, // Space for options button
  },
  starRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  starRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  reviewContainer: {
    flex: 1,
    flexShrink: 1,
    marginTop: -spacing.xs,
  },
  reviewText: {
    ...type.subhead,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  posterReviewContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    alignItems: "flex-start",
  },
  posterImage: {
    width: 75,
    aspectRatio: 2 / 3,
    borderRadius: radius.xs,
    boxShadow: shadows.insetHighlight,
    flexShrink: 0,
  },
  optionsButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
});
