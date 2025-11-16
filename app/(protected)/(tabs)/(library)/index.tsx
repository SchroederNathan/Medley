import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import AddCollection from "../../../../components/ui/add-collection";
import { AnimatedBlur } from "../../../../components/ui/animated-blur";
import { AnimatedChevron } from "../../../../components/ui/animated-chevron";
import CollectionCard from "../../../../components/ui/collection-card";
import MediaCard from "../../../../components/ui/media-card";
import ProfileButton from "../../../../components/ui/profile-button";
import { PullToSearchContent } from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import TabPager from "../../../../components/ui/tab-pager";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useLibrarySearch } from "../../../../hooks/use-library-search";
import { useUserCollections } from "../../../../hooks/use-user-collections";
import { useUserMedia } from "../../../../hooks/use-user-media";
import { fontFamily } from "../../../../lib/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_SPACING * 3) / 4;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const LibraryScreen = () => {
  const { theme } = useContext(ThemeContext);
  const collectionsQuery = useUserCollections();
  const mediaQuery = useUserMedia();
  const [activeTab, setActiveTab] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  // Use library-specific search functionality
  const { searchResults, isLoading, isError } = useLibrarySearch(query);

  const handleSearchChange = (text: string) => {
    setQuery(text);
  };

  const handleSearchClear = () => {
    setQuery("");
  };

  const tabs = [
    { key: "all", title: "All" },
    { key: "collections", title: "Collections" },
    { key: "ranked", title: "Ranked" },
  ];

  const allMedia = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);

  const allCollections = useMemo(
    () => collectionsQuery.data ?? [],
    [collectionsQuery.data]
  );

  // Filter collections by type
  const unrankedCollections = useMemo(
    () => allCollections.filter((c: any) => !c.ranked),
    [allCollections]
  );

  const rankedCollections = useMemo(
    () => allCollections.filter((c: any) => c.ranked),
    [allCollections]
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

      <PullToSearchContent
        searchResults={searchResults}
        searchQuery={query}
        isSearchLoading={isLoading}
        isSearchError={isError}
      >
        {/* <Text style={[styles.headerTitle, { color: theme.text }]}>
          Your Library
        </Text> */}
        <View style={{ flex: 1 }}>
          {collectionsQuery.isLoading ? (
            <Text style={{ color: theme.secondaryText }}>Loading…</Text>
          ) : collectionsQuery.isError ? (
            <Text style={{ color: theme.text }}>
              Failed to load collections
            </Text>
          ) : (
            <TabPager
              tabs={tabs}
              style={{ marginHorizontal: -20 }}
              selectedKey={activeTab}
              onChange={(key: string) => setActiveTab(key)}
              pages={[
                // All tab - shows both ranked and unranked
                <View key="all" style={{ flex: 1 }}>
                  {allCollections.length === 0 ? (
                    <Text
                      style={{
                        color: theme.secondaryText,
                        textAlign: "center",
                        marginTop: 40,
                        fontFamily: fontFamily.plusJakarta.regular,
                      }}
                    >
                      No media yet. Save some media to get started!
                    </Text>
                  ) : (
                    <FlashList
                      data={allMedia}
                      renderItem={({ item }) => (
                        <MediaCard
                          media={item}
                          width={CARD_WIDTH}
                          height={CARD_HEIGHT}
                        />
                      )}
                      masonry
                      numColumns={4}
                      keyExtractor={(item) => item.id}
                      ItemSeparatorComponent={() => (
                        <View style={{ height: CARD_SPACING }} />
                      )}
                      contentContainerStyle={{
                        paddingTop: 20,
                        marginRight: 28,
                        paddingBottom: 100,
                      }}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  )}
                </View>,
                // Collections tab - unranked only
                <View
                  key="collections"
                  style={{ flex: 1, paddingTop: 24, gap: 16 }}
                >
                  <AddCollection
                    title="Add Collection"
                    onPress={() => {
                      router.push("/collection/form");
                    }}
                  />
                  {unrankedCollections.length === 0 ? (
                    <Text
                      style={{
                        color: theme.secondaryText,
                        textAlign: "center",
                        marginTop: 40,
                        fontFamily: fontFamily.plusJakarta.regular,
                      }}
                    >
                      No unranked collections yet.
                    </Text>
                  ) : (
                    unrankedCollections.map((collection: any) => (
                      <CollectionCard
                        id={collection.id}
                        key={collection.id}
                        mediaItems={
                          collection.collection_items
                            ?.sort((a: any, b: any) => a.position - b.position)
                            .map((item: any) => item.media) ?? []
                        }
                        onPress={() => {
                          router.push(`/collection/${collection.id}`);
                        }}
                        title={collection.name}
                        ranked={false}
                      />
                    ))
                  )}
                </View>,
                // Rankings tab - ranked only
                <View key="ranked" style={{ flex: 1, paddingTop: 24, gap: 16 }}>
                  <AddCollection
                    title="Add Ranking"
                    onPress={() => {
                      router.push("/collection/form");
                    }}
                  />
                  {rankedCollections.length === 0 ? (
                    <Text
                      style={{
                        color: theme.secondaryText,
                        textAlign: "center",
                        marginTop: 40,
                        fontFamily: fontFamily.plusJakarta.regular,
                      }}
                    >
                      No ranked collections yet.
                    </Text>
                  ) : (
                    rankedCollections.map((collection: any) => (
                      <CollectionCard
                        id={collection.id}
                        key={collection.id}
                        mediaItems={
                          collection.collection_items
                            ?.sort((a: any, b: any) => a.position - b.position)
                            .map((item: any) => item.media) ?? []
                        }
                        onPress={() => {
                          router.push(`/collection/${collection.id}`);
                        }}
                        title={collection.name}
                        ranked={true}
                      />
                    ))
                  )}
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
