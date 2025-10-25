import { useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import ProfileButton from "../../../../components/ui/profile-button";
import { PullToSearchContent } from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import TabPager from "../../../../components/ui/tab-pager";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useLibrarySearch } from "../../../../hooks/use-library-search";
import { useUserCollections } from "../../../../hooks/use-user-collections";
import { fontFamily } from "../../../../lib/fonts";

const LibraryScreen = () => {
  const { theme } = useContext(ThemeContext);
  const collectionsQuery = useUserCollections();
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

  const allCollections = useMemo(
    () => collectionsQuery.data ?? [],
    [collectionsQuery.data],
  );

  // Filter collections by type
  const unrankedCollections = useMemo(
    () => allCollections.filter((c: any) => !c.ranked),
    [allCollections],
  );

  const rankedCollections = useMemo(
    () => allCollections.filter((c: any) => c.ranked),
    [allCollections],
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
                <View key="all" style={{ flex: 1, paddingTop: 24, gap: 16 }}>
                  <AddCollection
                    title="Add Collection"
                    onPress={() => {
                      router.push("/collection/create");
                    }}
                  />
                  {allCollections.length === 0 ? (
                    <Text
                      style={{
                        color: theme.secondaryText,
                        textAlign: "center",
                        marginTop: 40,
                        fontFamily: fontFamily.plusJakarta.regular,
                      }}
                    >
                      No collections yet. Create your first one!
                    </Text>
                  ) : (
                    allCollections.map((collection: any) => (
                      <CollectionCard
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
                        ranked={collection.ranked}
                      />
                    ))
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
                      router.push("/collection/create");
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
                      router.push("/collection/create");
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
