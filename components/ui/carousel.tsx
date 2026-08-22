import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { spacing } from "../../constants/theme";
import { Media } from "../../types/media";
import MediaCard from "./media-card";
import { ThemedText } from "./themed-text";
const Carousel = ({
  media,
  title,
  style,
}: {
  media: Media[];
  title: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const renderItem = useCallback(
    ({ item }: { item: Media }) => (
      <MediaCard media={item} style={{ marginRight: spacing.md }} />
    ),
    []
  );
  return (
    <View style={style}>
      <ThemedText variant="heading" style={styles.title}>
        {title}
      </ThemedText>
      <FlashList
        data={media}
        keyExtractor={(item) => item.id}
        style={{ marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl }}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default Carousel;

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
});
