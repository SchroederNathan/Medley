import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import { UserRound } from "lucide-react-native";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import Button from "../../../../components/ui/button";
import Carousel from "../../../../components/ui/carousel";
import Search from "../../../../components/ui/search";
import { ThemeContext } from "../../../../contexts/theme-context";
import { usePreferredMedia } from "../../../../hooks/use-preferred-media";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";
import { TestRecommendations } from "../../../../scripts/test-recommendations";

const IndexScreen = () => {
  const { theme } = useContext(ThemeContext);
  const userProfile = useUserProfile();
  const [query, setQuery] = useState("");
  const mediaQuery = usePreferredMedia(query);
  const topPadding = useSafeAreaInsets().top;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  return (
    <Pressable
      onTouchStart={Keyboard.dismiss}
      accessible={false}
      style={[styles.container, { paddingTop: topPadding }]}
    >
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {getTimeBasedGreeting()},{"\n"}
          {userProfile.data?.name || "User"}
        </Text>
        <TouchableOpacity
          style={[
            styles.profileButton,
            {
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            },
          ]}
          onPress={() => router.push("/(profile)")}
        >
          <UserRound size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      {/* Search */}
      <Search
        value={query}
        onChangeText={setQuery}
        placeholder="Search media"
        onClear={() => setQuery("")}
      />
      <Button
        title="Test Recommendations"
        onPress={() => {
          TestRecommendations.testRecommendationSystem(userProfile.data?.id);
        }}
      />
      {query.length > 0 ? (
        <>
          {/* Search Results */}
          <View style={{ marginTop: 16, flex: 1 }}>
            {mediaQuery.isLoading ? (
              <ActivityIndicator />
            ) : mediaQuery.isError ? (
              <Text style={{ color: theme.text }}>Failed to load media</Text>
            ) : (
              // <FlashList
              //   data={mediaQuery.data}
              //   keyExtractor={(item) => item.id}
              //   renderItem={({ item, index }) => (
              //     <View
              //       style={[
              //         // Horizontal gap for the column
              //         index % 2 ? { paddingLeft: 6 } : { paddingRight: 6 },
              //         { flex: 1 },
              //       ]}
              //     >
              //       <MediaCard
              //         media={item}
              //         width={"100%"}
              //         height={"auto"}
              //         style={{ aspectRatio: 3 / 4, marginBottom: 12 }}
              //       />
              //     </View>
              //   )}
              //   numColumns={2}
              //   contentContainerStyle={{ paddingBottom: 24 }}
              //   showsVerticalScrollIndicator={false}
              // />
              <FlashList
                data={mediaQuery.data}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ flexDirection: "row", gap: 12 }}
                    onPress={() => router.push(`/media-detail?id=${item.id}`)}
                  >
                    <Image
                      source={{ uri: item.backdrop_url }}
                      contentFit="cover"
                      style={{
                        width: 150,
                        aspectRatio: 940 / 549,
                        marginBottom: 12,
                      }}
                    />
                    <View style={{ flex: 1, justifyContent: "center", gap: 4 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontFamily: fontFamily.plusJakarta.bold,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={{
                          color: theme.text,
                          fontFamily: fontFamily.plusJakarta.regular,
                        }}
                      >
                        {item.year}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </>
      ) : (
        <Carousel
          style={{ marginTop: 16 }}
          media={mediaQuery.data ?? []}
          title="All Preferred Media"
        />
      )}
    </Pressable>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
  profileButton: {
    height: 52,
    width: 52,
    borderWidth: 1,
    aspectRatio: 1,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
});
