import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedBlur } from "../../../../components/ui/animated-blur";
import { AnimatedChevron } from "../../../../components/ui/animated-chevron";
import Carousel from "../../../../components/ui/carousel";
import HomeBackdrop from "../../../../components/ui/home-backdrop";
import HomeCarousel from "../../../../components/ui/home-carousel";
import ProfileButton from "../../../../components/ui/profile-button";
import { PullToSearchContent } from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import { ContentReadyContext } from "../../../../contexts/content-ready-context";
import { ThemeContext } from "../../../../contexts/theme-context";
import { usePopularMovies } from "../../../../hooks/use-popular-movies";
import { useRecommendations } from "../../../../hooks/use-recommendations";
import { useSharedSearch } from "../../../../hooks/use-shared-search";
import { fontFamily } from "../../../../lib/fonts";

const IndexScreen = () => {
  const { theme } = useContext(ThemeContext);
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
  const favoriteRecommendations = useRecommendations({
    kind: "favorites",
  });
  const recommendedGames = useRecommendations({
    kind: "type",
    mediaType: "game",
  });
  const recommendedMovies = useRecommendations({
    kind: "type",
    mediaType: "movie",
  });
  const popularMovies = usePopularMovies(20);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const recommendedTvShows = useRecommendations({
    kind: "type",
    mediaType: "tv_show",
  });

  // Mark content as ready when all recommendations have loaded (successfully or with error)
  useEffect(() => {
    const allQueriesFinished =
      !favoriteRecommendations.isLoading &&
      !recommendedGames.isLoading &&
      !recommendedMovies.isLoading &&
      !popularMovies.isLoading &&
      !recommendedTvShows.isLoading;

    if (allQueriesFinished) {
      setContentReady(true);
    }
  }, [
    favoriteRecommendations.isLoading,
    recommendedGames.isLoading,
    recommendedMovies.isLoading,
    popularMovies.isLoading,
    recommendedTvShows.isLoading,
    setContentReady,
  ]);

  useEffect(() => {
    if (favoriteRecommendations.isError) {
      console.warn(
        "Failed to load favorite recommendations",
        favoriteRecommendations.error
      );
    }
  }, [favoriteRecommendations.error, favoriteRecommendations.isError]);

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
      <HomeBackdrop
        media={popularMovies.data ?? []}
        currentIndex={carouselIndex}
      />

      <PullToSearchContent
        searchResults={searchResults}
        searchQuery={query}
        isSearchLoading={searchLoading}
        isSearchError={searchError}
      >
        {/* Featured carousel at the top */}
        <HomeCarousel
          media={popularMovies.data ?? []}
          onIndexChange={setCarouselIndex}
        />

        {/* Main content - always show recommendations */}
        <View style={{ paddingBottom: paddingBottom }}>
          {favoriteRecommendations.data &&
          favoriteRecommendations.data.length > 0 ? (
            <Carousel
              style={{ marginTop: 20 }}
              media={favoriteRecommendations.data}
              title="Based on your favorites"
            />
          ) : null}
          <Carousel
            style={{
              marginTop:
                favoriteRecommendations.data &&
                favoriteRecommendations.data.length > 0
                  ? 32
                  : 0,
            }}
            media={popularMovies.data ?? []}
            title="Popular Movies"
          />
        </View>
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
