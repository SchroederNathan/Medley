import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useContext, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

type Buy = {
  logo_path: string;
  provider_id: number; // Defaults to 0
  provider_name: string;
  display_priority: number; // Defaults to 0
}[];

type Streaming = {
  logo_path: string;
  provider_id: number; // Defaults to 0
  provider_name: string;
  display_priority: number; // Defaults to 0
}[];

type PlatformType = Buy | Streaming | Rental;

type Platform = {
  provider_name: string;
  logo_path: string;
  type: PlatformType;
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
  const { theme } = useContext(ThemeContext);
  const data = platforms?.length ? platforms : placeholderPlatforms;

  return (
    <View style={style}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <FlashList
        data={data}
        keyExtractor={(item) => item.name}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
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
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },

  logoContainer: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  platformLogo: {
    height: 104,
  },
});
