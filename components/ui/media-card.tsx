import React, { useContext } from "react";
import {
  DimensionValue,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { Media } from "../../types/media";

const MediaCard = ({
  media,
  width = 150,
  height = 200,
  style,
}: {
  media: Media;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          height: height,
          width: width,
          backgroundColor: theme.buttonBackground,
        },
        style,
      ]}
    >
      <Image
        source={{ uri: media.poster_url }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

export default MediaCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
