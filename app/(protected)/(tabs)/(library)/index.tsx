import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import CollectionCard from "../../../../components/ui/collection-card";
import ProfileButton from "../../../../components/ui/profile-button";
import { PullToSearchContent } from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import TabPager from "../../../../components/ui/tab-pager";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useSharedSearch } from "../../../../hooks/use-shared-search";
import { useUserMedia } from "../../../../hooks/use-user-media";
import { fontFamily } from "../../../../lib/fonts";

const LibraryScreen = () => {
  const { theme } = useContext(ThemeContext);
  const userMediaQuery = useUserMedia();
  const [activeTab, setActiveTab] = React.useState("all");

  // Use shared search functionality
  const { query, searchResults, handleSearchChange, handleSearchClear } =
    useSharedSearch();

  const tabs = [
    { key: "all", title: "All lists" },
    { key: "movies", title: "Movie lists" },
    { key: "games", title: "Game lists" },
  ];

  const allItems = userMediaQuery.data ?? [];
  const movieItems = React.useMemo(
    () =>
      allItems.filter(
        (m: any) => (m.media_type || "").toLowerCase() === "movie"
      ),
    [allItems]
  );
  const gameItems = React.useMemo(
    () =>
      allItems.filter(
        (m: any) => (m.media_type || "").toLowerCase() === "game"
      ),
    [allItems]
  );

  const handleFilterPress = () => {
    // Add filter functionality here - could filter by media type, collections, etc.
    console.log("Filter pressed on Library tab");
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

      <PullToSearchContent searchResults={searchResults} searchQuery={query}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Your Library
        </Text>
        <View style={{ flex: 1 }}>
          {userMediaQuery.isLoading ? (
            <Text style={{ color: theme.secondaryText }}>Loading…</Text>
          ) : userMediaQuery.isError ? (
            <Text style={{ color: theme.text }}>Failed to load library</Text>
          ) : (
            <TabPager
              tabs={tabs}
              selectedKey={activeTab}
              onChange={(key: string) => setActiveTab(key)}
              style={{ marginTop: 8 }}
              pages={[
                <View key="all" style={{ flex: 1, paddingTop: 24, gap: 16 }}>
                  <CollectionCard mediaItems={allItems} title="Big list" />
                  <CollectionCard
                    mediaItems={allItems}
                    title="Cool Collection"
                  />
                  <CollectionCard mediaItems={allItems} title="All items" />
                </View>,
                <View key="movies" style={{ flex: 1, paddingTop: 24, gap: 16 }}>
                  <CollectionCard mediaItems={movieItems} title="Movie list" />
                  <CollectionCard
                    mediaItems={movieItems}
                    title="Awesome Movies"
                  />
                </View>,
                <View key="games" style={{ flex: 1, paddingTop: 24, gap: 16 }}>
                  <CollectionCard mediaItems={gameItems} title="Game lists" />
                </View>,
              ]}
            />
          )}
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
        searchPlaceholder="Search your library"
      />
    </View>
  );
};

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
  headerTitle: {
    fontSize: 40,
    fontFamily: fontFamily.tanker.regular,
    marginTop: 16,
  },
});
