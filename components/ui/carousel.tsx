import { FlashList } from "@shopify/flash-list";
import React, { useContext } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { Media } from "../../types/media";
import MediaCard from "./media-card";
const Carousel = ({
  media,
  title,
  style,
}: {
  media: Media[];
  title: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={style}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <FlashList
        data={media}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MediaCard media={item} style={{ marginRight: 12 }} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default Carousel;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
});
