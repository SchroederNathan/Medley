import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { Media } from "../../types/media";
import MediaCard from "./media-card";

const CollectionMediaGrid = ({ mediaItems }: { mediaItems: Media[] }) => {
  const { theme } = useContext(ThemeContext);
  // Use first 3 media items, or create placeholders if not enough
  const displayMedia = mediaItems.slice(0, 3);

  return (
    <View
      style={[
        styles.mediaImages,
        {
          backgroundColor: theme.buttonBackground,
          borderColor: theme.buttonBorder,
        },
      ]}
    >
      {/* Left media card - full height */}
      <View style={styles.leftMedia}>
        {displayMedia[0] && (
          <MediaCard
            media={displayMedia[0]}
            width="100%"
            height="100%"
            style={styles.mediaCard}
            isTouchable={false}
          />
        )}
      </View>

      {/* Right media cards - stacked */}
      <View style={styles.rightMedia}>
        <View style={styles.topRightMedia}>
          {displayMedia[1] && (
            <MediaCard
              media={displayMedia[1]}
              isTouchable={false}
              width="100%"
              height="100%"
              style={styles.mediaCard}
            />
          )}
        </View>
        <View style={styles.bottomRightMedia}>
          {displayMedia[2] && (
            <MediaCard
              media={displayMedia[2]}
              isTouchable={false}
              width="100%"
              height="100%"
              style={styles.mediaCard}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const CollectionCard = ({
  mediaItems,
  title,
}: {
  mediaItems: Media[];
  title: string;
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          //   borderColor: theme.buttonBorder,
          //   backgroundColor: theme.buttonBackground,
        },
      ]}
    >
      <CollectionMediaGrid mediaItems={mediaItems} />
      <View style={styles.rightContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {mediaItems.length} items
          </Text>
        </View>
        {/* <ChevronRight size={24} color={theme.secondaryText} /> */}
      </View>
    </TouchableOpacity>
  );
};

export default CollectionCard;

const styles = StyleSheet.create({
  container: {
    // borderRadius: 16,
    overflow: "hidden",
    // borderWidth: 1,
    // padding: 12,
    flexDirection: "row",
    // backgroundColor: "red",
    gap: 12,
  },

  rightContent: {
    flex: 1,
    gap: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  mediaImages: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 100, // Square-ish aspect ratio
    width: 100,
    padding: 8,
    gap: 4,
  },

  leftMedia: {
    flex: 2,
    height: "100%",
  },

  rightMedia: {
    flex: 1,
    height: "100%",
    gap: 4,
  },

  topRightMedia: {
    flex: 1,
  },

  bottomRightMedia: {
    flex: 1,
  },

  mediaCard: {
    borderRadius: 4,
  },

  title: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },

  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 4,
  },
});
