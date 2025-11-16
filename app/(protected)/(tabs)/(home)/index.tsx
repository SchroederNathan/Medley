import React, { useContext, useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import { AnimatedBlur } from "../../../../components/ui/animated-blur";
import { AnimatedChevron } from "../../../../components/ui/animated-chevron";
import Button from "../../../../components/ui/button";
import Carousel from "../../../../components/ui/carousel";
import HomeCarousel from "../../../../components/ui/home-carousel";
import ProfileButton from "../../../../components/ui/profile-button";
import { PullToSearchContent } from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import { AuthContext } from "../../../../contexts/auth-context";
import { ContentReadyContext } from "../../../../contexts/content-ready-context";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useRecommendations } from "../../../../hooks/use-recommendations";
import { useSharedSearch } from "../../../../hooks/use-shared-search";
import { fontFamily } from "../../../../lib/fonts";
import { sendPushNotification } from "../../../../lib/notifications";

const IndexScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { setContentReady } = useContext(ContentReadyContext);
  const {
    query,
    searchResults,
    isLoading: searchLoading,
    isError: searchError,
    handleSearchChange,
    handleSearchClear,
  } = useSharedSearch();
  const paddingBottom = useSafeAreaInsets().bottom + 72;
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

  // Mark content as ready when all recommendations have loaded (successfully or with error)
  useEffect(() => {
    const allQueriesFinished =
      !recommendedGames.isLoading &&
      !recommendedMovies.isLoading &&
      !recommendedTvShows.isLoading;

    if (allQueriesFinished) {
      setContentReady(true);
    }
  }, [
    recommendedGames.isLoading,
    recommendedMovies.isLoading,
    recommendedTvShows.isLoading,
    setContentReady,
  ]);

  // const getTimeBasedGreeting = () => {
  //   const hour = new Date().getHours();
  //   if (hour < 12) return "Good morning";
  //   if (hour < 17) return "Good afternoon";
  //   return "Good evening";
  // };

  const handleFilterPress = () => {
    // Add filter functionality here - could open a modal, show filter options, etc.
    console.log("Filter pressed on Home tab");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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

      <PullToSearchContent
        searchResults={searchResults}
        searchQuery={query}
        isSearchLoading={searchLoading}
        isSearchError={searchError}
      >
        {/* Featured carousel at the top */}
        <HomeCarousel media={recommendedMovies.data ?? []} />

        {/* Main content - always show recommendations */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: paddingBottom }}
          style={{ paddingTop: 0, overflow: "visible" }}
          nestedScrollEnabled
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <Button
            title="Send Push Notification"
            onPress={() => {
              sendPushNotification({
                userId: user?.id as string,
                body: "Hello, this is a test push notification",
              });
            }}
          />
          <Carousel
            style={{ marginTop: 0 }}
            media={recommendedMovies.data ?? []}
            title="Movies for you"
          />
          <Carousel
            style={{ marginTop: 32 }}
            media={recommendedGames.data ?? []}
            title="Games for you"
          />
          <Carousel
            style={{ marginTop: 32 }}
            media={recommendedTvShows.data ?? []}
            title="TV for you"
          />
        </ScrollView>
      </PullToSearchContent>

      {/* Animated blur backdrop */}
      <AnimatedBlur />

      {/* Animated chevron that appears during pull */}
      <AnimatedChevron />

      {/* Shared header with pull-to-search functionality */}
      <SharedHeader
        rightButton={<ProfileButton />}
        showFilterButton={true}
        onFilterPress={handleFilterPress}
        searchValue={query}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        searchPlaceholder="Search media"
      />
    </View>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
    flex: 1,
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
});
