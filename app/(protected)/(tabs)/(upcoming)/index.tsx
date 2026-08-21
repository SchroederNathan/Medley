import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useContext, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AnimatedBlur } from "../../../../components/ui/animated-blur";
import { AnimatedChevron } from "../../../../components/ui/animated-chevron";
import ProfileButton from "../../../../components/ui/profile-button";
import {
  PullToSearchContent,
  PullToSearchScrollProps,
} from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import UpcomingRow from "../../../../components/ui/upcoming-row";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useMountAfterInteractions } from "../../../../hooks/use-mount-after-interactions";
import { useSharedSearch } from "../../../../hooks/use-shared-search";
import { useUpcomingMovies } from "../../../../hooks/use-upcoming-movies";
import { fontFamily } from "../../../../lib/fonts";
import {
  UpcomingListRow,
  buildUpcomingRows,
} from "../../../../lib/upcoming-sections";

const UpcomingScreen = () => {
  const { theme } = useContext(ThemeContext);
  const {
    query: searchQuery,
    searchResults,
    isLoading: searchLoading,
    isError: searchError,
    handleSearchChange,
    handleSearchClear,
  } = useSharedSearch();
  const { items, query } = useUpcomingMovies();
  const contentReady = useMountAfterInteractions();

  // Day headers scroll inline. FlashList 2.0.2's stickyHeaderIndices engages
  // headers before their cells reach the top and doubles them up at group
  // boundaries (shopify/flash-list#1942, #1959) — revisit when fixed upstream.
  const { rows } = useMemo(() => buildUpcomingRows(items), [items]);

  const handleEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: UpcomingListRow }) =>
      item.type === "header" ? (
        <View style={styles.dayHeader}>
          <Text style={[styles.dayHeaderText, { color: theme.text }]}>
            {item.title}
          </Text>
        </View>
      ) : (
        <UpcomingRow media={item.item.media} />
      ),
    [theme]
  );

  const renderList = useCallback(
    (scrollProps: PullToSearchScrollProps) => {
      if (!contentReady || (query.isLoading && rows.length === 0)) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="small" />
            <Text style={[styles.stateText, { color: theme.secondaryText }]}>
              Loading upcoming releases...
            </Text>
          </View>
        );
      }

      if (query.isError && rows.length === 0) {
        return (
          <View style={styles.centered}>
            <Text style={[styles.stateText, { color: theme.secondaryText }]}>
              Failed to load upcoming releases
            </Text>
          </View>
        );
      }

      return (
        <FlashList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.type}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
          {...scrollProps}
        />
      );
    },
    [
      contentReady,
      handleEndReached,
      query.isError,
      query.isFetchingNextPage,
      query.isLoading,
      renderItem,
      rows,
      theme,
    ]
  );

  return (
    <View style={styles.container}>
      <PullToSearchContent
        searchResults={searchResults}
        searchQuery={searchQuery}
        isSearchLoading={searchLoading}
        isSearchError={searchError}
        renderList={renderList}
      />

      {/* Animated blur backdrop */}
      <AnimatedBlur />

      {/* Animated chevron that appears during pull */}
      <AnimatedChevron />

      {/* Shared header with pull-to-search functionality */}
      <SharedHeader
        rightButton={<ProfileButton />}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        searchPlaceholder="Search media"
      />
    </View>
  );
};

export default UpcomingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stateText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  listContent: {
    paddingBottom: 120,
  },
  dayHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  dayHeaderText: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  footer: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
