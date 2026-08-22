import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AnimatedBlur } from "../../../../components/ui/animated-blur";
import { AnimatedChevron } from "../../../../components/ui/animated-chevron";
import ProfileButton from "../../../../components/ui/profile-button";
import {
  PullToSearchContent,
  PullToSearchScrollProps,
} from "../../../../components/ui/pull-to-search-content";
import { SharedHeader } from "../../../../components/ui/shared-header";
import { ThemedText } from "../../../../components/ui/themed-text";
import UpcomingRow from "../../../../components/ui/upcoming-row";
import { spacing } from "../../../../constants/theme";
import { useMountAfterInteractions } from "../../../../hooks/use-mount-after-interactions";
import { useSharedSearch } from "../../../../hooks/use-shared-search";
import { useUpcomingMovies } from "../../../../hooks/use-upcoming-movies";
import {
  UpcomingListRow,
  buildUpcomingRows,
} from "../../../../lib/upcoming-sections";

const UpcomingScreen = () => {
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
          <ThemedText variant="heading">{item.title}</ThemedText>
        </View>
      ) : (
        <UpcomingRow media={item.item.media} />
      ),
    []
  );

  const renderList = useCallback(
    (scrollProps: PullToSearchScrollProps) => {
      if (!contentReady || (query.isLoading && rows.length === 0)) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="small" />
            <ThemedText variant="subhead" color="secondary">
              Loading upcoming releases...
            </ThemedText>
          </View>
        );
      }

      if (query.isError && rows.length === 0) {
        return (
          <View style={styles.centered}>
            <ThemedText variant="subhead" color="secondary">
              Failed to load upcoming releases
            </ThemedText>
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
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: 120,
  },
  dayHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
});
