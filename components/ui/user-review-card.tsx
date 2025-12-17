import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { MoreVerticalIcon, StarSolidIcon } from "./svg-icons";
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
      <Text style={[styles.titleText, { color: theme.text }]}>{title}</Text>
      <View style={styles.starRatingContainer}>
        <View style={styles.starRating}>
          {Array.from({ length: 5 }, (_, i) => {
            const fillPercentage = Math.min(1, Math.max(0, rating - i));
            const starSize = 16;
            if (fillPercentage <= 0) {
              return (
                <StarSolidIcon key={i} size={starSize} color={theme.border} />
              );
            }
            if (fillPercentage >= 1) {
              return (
                <StarSolidIcon key={i} size={starSize} color={theme.text} />
              );
            }
            // Half star
            return (
              <View key={i} style={{ width: starSize, height: starSize }}>
                <StarSolidIcon size={starSize + 2} color={theme.border} />
                <View
                  style={{
                    position: "absolute",
                    width: starSize * fillPercentage,
                    height: starSize,
                    overflow: "hidden",
                  }}
                >
                  <StarSolidIcon size={starSize} color={theme.text} />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.dateText, { color: theme.secondaryText }]}>
          {"·    "}
          {createdAt}
        </Text>
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
        <MoreVerticalIcon size={24} color={theme.text} />
      </Pressable>
    </Pressable>
  );
};

export default UserReviewCard;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginRight: 40, // Space for options button
  },
  titleText: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  starRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  starRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewContainer: {
    flex: 1,
    flexShrink: 1,
    marginTop: -4,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  dateText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  posterReviewContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    alignItems: "flex-start",
  },
  posterImage: {
    width: 75,
    aspectRatio: 2 / 3,
    borderRadius: 4,
    boxShadow: "rgba(204, 219, 232, 0.3) 0 1px 4px -0.5px inset",
    flexShrink: 0,
  },
  optionsButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
});
