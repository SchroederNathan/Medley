import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useCallback, useContext } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { MediaTrailer } from "../../types/media";
import { PlaySolidIcon } from "./svg-icons";

const TrailerThumbnail = ({ trailer }: { trailer: MediaTrailer }) => {
  const { theme } = useContext(ThemeContext);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
  }, [trailer.key]);

  return (
    <View>
      <Text style={[styles.title, { color: theme.text }]}>Trailer</Text>
      <Pressable
        onPress={handlePress}
        style={[styles.container, { borderColor: theme.border }]}
      >
        <Image
          source={{
            uri: `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`,
          }}
          cachePolicy="memory-disk"
          transition={200}
          contentFit="cover"
          style={styles.thumbnail}
        />
        <View style={styles.overlay}>
          <View
            style={[
              styles.playButton,
              {
                backgroundColor: theme.buttonBackground,
                borderColor: theme.buttonBorder,
              },
            ]}
          >
            <PlaySolidIcon size={24} color={theme.text} />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default TrailerThumbnail;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    width: 230,
    height: 128.75,
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
