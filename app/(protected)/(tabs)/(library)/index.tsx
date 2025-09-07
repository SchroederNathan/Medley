import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserMedia } from "../../../../hooks/use-user-media";
import MediaCard from "../../../../components/ui/media-card";

const LibraryScreen = () => {
  const { theme } = useContext(ThemeContext);
  const topPadding = useSafeAreaInsets().top;
  const userMediaQuery = useUserMedia();
  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <Svg
        width="150%"
        height="100%"
        viewBox="0 0 500 550"
        style={styles.spotlightSvg}
      >
        <Defs>
          <Filter
            id="filter0_f_2_34"
            x="-167.2"
            y="-262.2"
            width="700.02"
            height="850.854"
            filterUnits="userSpaceOnUse"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <FeGaussianBlur
              stdDeviation="61.85"
              result="effect1_foregroundBlur_2_34"
            />
          </Filter>
        </Defs>
        <Path
          d="M-43.5 -81.5L7.5 -138.5L420.12 380.955L280.62 480.954L-43.5 -81.5Z"
          fill="#D4D4D4"
          fillOpacity="0.1"
          filter="url(#filter0_f_2_34)"
        />
      </Svg>
      <Text style={{ color: theme.text, marginBottom: 16 }}>Your Library</Text>
      <View style={{ flex: 1 }}>
        {userMediaQuery.isLoading ? (
          <Text style={{ color: theme.secondaryText }}>Loading…</Text>
        ) : userMediaQuery.isError ? (
          <Text style={{ color: theme.text }}>Failed to load library</Text>
        ) : (
          <FlashList
            data={userMediaQuery.data ?? []}
            keyExtractor={(item) => item.id}
            numColumns={4}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item, index }) => (
              <View style={[{ paddingHorizontal: 4, flex: 1 }]}>
                <MediaCard
                  media={item}
                  width={"100%"}
                  height={"auto"}
                  style={{ aspectRatio: 3 / 4, marginBottom: 8 }}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
});
