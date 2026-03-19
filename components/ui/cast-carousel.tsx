import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useContext } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { MediaCastMember } from "../../types/media";

// Placeholder data with 10 empty cast members
const placeholderCast = Array.from({ length: 10 }, (_, i) => ({
  id: `placeholder-${i}`,
  name: `Cast ${i + 1}`,
  character: `Character ${i + 1}`,
}));

const CastCarouselItem = ({
  item,
  theme,
}: {
  item: MediaCastMember;
  theme: any;
}) => (
  <View style={styles.castItem}>
    {item.profile_path ? (
      <Image
        source={{ uri: item.profile_path }}
        contentFit="cover"
        style={styles.circleImage}
      />
    ) : (
      <View
        style={[styles.circleImage, { backgroundColor: theme.secondaryText }]}
      />
    )}
    <Text style={[styles.castName, { color: theme.text }]} numberOfLines={1}>
      {item.name}
    </Text>
    <Text
      style={[styles.castCharacterName, { color: theme.secondaryText }]}
      numberOfLines={1}
    >
      {item.character ?? ""}
    </Text>
  </View>
);

const CastCarousel = ({
  cast,
  title = "Cast",
  style,
}: {
  cast?: MediaCastMember[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const { theme } = useContext(ThemeContext);
  const data = cast?.length ? cast : placeholderCast;
  const renderItem = useCallback(
    ({ item }: { item: MediaCastMember }) => (
      <CastCarouselItem item={item} theme={theme} />
    ),
    [theme]
  );

  return (
    <View style={style}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default CastCarousel;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
  castItem: {
    alignItems: "center",
    marginRight: 16,
    width: 104,
  },
  circleImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  castName: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
    marginTop: 8,
    textAlign: "center",
  },
  castCharacterName: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
    textAlign: "center",
  },
});
