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
import Carousel from "../../../../components/ui/carousel";
import Search from "../../../../components/ui/search";
import { ThemeContext } from "../../../../contexts/theme-context";
import { usePreferredMedia } from "../../../../hooks/use-preferred-media";
import { useRecommendations } from "../../../../hooks/use-recommendations";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";

const IndexScreen = () => {
  const { theme } = useContext(ThemeContext);
  const userProfile = useUserProfile();
  const [query, setQuery] = useState("");
  const mediaQuery = usePreferredMedia(query);
  const recommendedGames = useRecommendations({
    kind: "type",
    mediaType: "game",
  });
  const recommendedMovies = useRecommendations({
    kind: "type",
    mediaType: "movie",
  });
  const recommendedTvShows = useRecommendations({
    kind: "type",
    mediaType: "tv_show",
  });
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
      {/* <Button
        title="Test Recommendations"
        onPress={() => {
          TestRecommendations.testRecommendationSystem(userProfile.data?.id);
        }}
      />
      <Button
        title="Backfill Genres"
        onPress={() => FixedGenreExtractor.backfillAllGenres()}
      />
      <Button
        title="Test Genre Extraction"
        onPress={() => FixedGenreExtractor.testExtraction(5)}
      />
      <Button
        title="update utens"
        onPress={async () => {
          // await FixedGenreExtractor.updateSingleItem('abd6eb9b-a255-470a-82a4-bfd06bcfed49'); // Smurfs (movie)
          // await FixedGenreExtractor.updateSingleItem('1ae089b4-907a-4eeb-bec7-698012598c3a'); // Superman (movie)
          // await FixedGenreExtractor.updateSingleItem('9a2cd9fe-40a5-4fd0-8a4a-4de7eda157eb'); // The Studio (tv_show)
          // await FixedGenreExtractor.updateSingleItem('974c3e1d-77c4-443f-806c-ca500adb97a3'); // Red Dead Revolver (game)
          console.log(userProfile.data?.id);
          await supabase;
          supabase
            .rpc("get_cross_media_recommendations", {
              target_user_id: "c3f2f050-ffb2-4a93-aa2c-948a60bacad0",
              target_media_type: "tv_show",
              recommendation_limit: 10,
            })
            .then(({ data, error }) => console.log(error || data));
        }}
      /> */}
      {query.length > 0 ? (
        <>
          {/* Search Results */}
          <View style={{ marginTop: 16, flex: 1 }}>
            {recommendedGames.isLoading ||
            recommendedMovies.isLoading ||
            recommendedTvShows.isLoading ? (
              <ActivityIndicator />
            ) : recommendedGames.isError ||
              recommendedMovies.isError ||
              recommendedTvShows.isError ? (
              <Text style={{ color: theme.text }}>Failed to load media</Text>
            ) : (
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
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: theme.border,
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
        <>
          <Carousel
            style={{ marginTop: 16 }}
            media={recommendedMovies.data ?? []}
            title="Movies for you"
          />
          <Carousel
            style={{ marginTop: 16 }}
            media={recommendedGames.data ?? []}
            title="Games for you"
          />
          <Carousel
            style={{ marginTop: 16 }}
            media={recommendedTvShows.data ?? []}
            title="TV for you"
          />
        </>
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
