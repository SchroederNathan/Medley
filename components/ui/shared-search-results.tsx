import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { FC, useContext } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { ThemedText } from "./themed-text";

type SearchResult = {
  id: string;
  title: string;
  year?: string;
  backdrop_url?: string;
  media_type?: string;
};

type SharedSearchResultsProps = {
  searchResults?: any[];
  searchQuery?: string;
  flatResults?: SearchResult[];
  isLoading?: boolean;
  isError?: boolean;
};

export const SharedSearchResults: FC<SharedSearchResultsProps> = ({
  searchResults = [],
  searchQuery,
  flatResults,
  isLoading = false,
  isError = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const { grossHeight } = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const renderFlatResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.flatResultItem}
      onPress={() => router.push(`/media-detail?id=${item.id}`)}
    >
      <Image
        source={{ uri: item.backdrop_url }}
        contentFit="cover"
        style={[
          styles.resultImage,
          {
            borderColor: theme.border,
          },
        ]}
      />
      <View style={styles.resultContent}>
        <ThemedText weight="bold">{item.title}</ThemedText>
        {item.year && (
          <ThemedText variant="subhead" color="secondary">
            {item.year}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText
          color="secondary"
          style={[styles.emptyText, { marginTop: spacing.lg }]}
        >
          Searching...
        </ThemedText>
      </View>
    );
  }

  // Show error state
  if (isError) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText weight="medium" style={styles.emptyText}>
          Failed to load search results
        </ThemedText>
        <ThemedText
          variant="subhead"
          color="secondary"
          style={[styles.emptyText, { marginTop: spacing.sm }]}
        >
          Please try again
        </ThemedText>
      </View>
    );
  }

  if (flatResults && flatResults.length > 0) {
    return (
      <FlashList
        data={flatResults}
        style={{ paddingHorizontal: spacing.xl }}
        renderItem={renderFlatResult}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={[
          styles.flatContainer,
          {
            paddingTop: grossHeight + spacing.xl,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <ThemedText color="secondary" style={styles.emptyText}>
        {searchQuery
          ? `No results found for "${searchQuery}"`
          : "Pull down to search"}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  flatContainer: {
    gap: spacing.md,
  },
  flatResultItem: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  resultImage: {
    borderRadius: radius.xs,
    borderWidth: 1,
    width: 150,
    aspectRatio: 940 / 549,
  },
  resultContent: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.huge,
  },
  emptyText: {
    textAlign: "center",
  },
});
