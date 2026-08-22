import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { spacing } from "../../constants/theme";
import { ThemedText } from "./themed-text";

type Platform = {
  name: string;
  logo_url: string | number;
  url: string;
};

// Placeholder data with 10 empty cast members
const placeholderPlatforms = Array.from({ length: 10 }, (_, i) => ({
  name: `Platform ${i + 1}`,
  logo_url: require("../../assets/platform-logos/netflix.png"),
  url: `https://www.platform${i + 1}.com`,
}));

const LogoItem = ({ logo_url }: { logo_url: string | number }) => {
  const [imageWidth, setImageWidth] = useState<number>(150);

  return (
    <View style={styles.logoContainer}>
      <Image
        source={typeof logo_url === "string" ? { uri: logo_url } : logo_url}
        style={[styles.platformLogo, { width: imageWidth }]}
        contentFit="contain"
        cachePolicy="memory-disk"
        onLoad={(event) => {
          // expo-image onLoad provides source with width/height
          const source = event.source;
          if (source?.width && source?.height) {
            const aspectRatio = source.width / source.height;
            setImageWidth(104 * aspectRatio);
          }
        }}
      />
    </View>
  );
};

const WhereToWatchCarousel = ({
  platforms,
  title = "Where to watch",
  style,
}: {
  platforms?: Platform[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const data = platforms?.length ? platforms : placeholderPlatforms;

  return (
    <View style={style}>
      <ThemedText variant="heading" style={styles.title}>
        {title}
      </ThemedText>
      <FlashList
        data={data}
        keyExtractor={(item) => item.name}
        style={{ marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl }}
        renderItem={({ item }) => <LogoItem logo_url={item.logo_url} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default WhereToWatchCarousel;

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },

  logoContainer: {
    marginRight: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  platformLogo: {
    height: 104,
  },
});
