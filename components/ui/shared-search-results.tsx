import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { FC, useContext } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useHeaderHeight } from "../../hooks/use-header-height";
import { fontFamily } from "../../lib/fonts";

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
        <Text
          style={[
            styles.resultTitle,
            {
              color: theme.text,
              fontFamily: fontFamily.plusJakarta.bold,
            },
          ]}
        >
          {item.title}
        </Text>
        {item.year && (
          <Text
            style={[
              styles.resultYear,
              {
                color: theme.secondaryText,
                fontFamily: fontFamily.plusJakarta.regular,
              },
            ]}
          >
            {item.year}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text
          style={[
            styles.emptyText,
            {
              color: theme.secondaryText,
              fontFamily: fontFamily.plusJakarta.regular,
              marginTop: 16,
            },
          ]}
        >
          Searching...
        </Text>
      </View>
    );
  }

  // Show error state
  if (isError) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={[
            styles.emptyText,
            {
              color: theme.text,
              fontFamily: fontFamily.plusJakarta.medium,
            },
          ]}
        >
          Failed to load search results
        </Text>
        <Text
          style={[
            styles.emptyText,
            {
              color: theme.secondaryText,
              fontFamily: fontFamily.plusJakarta.regular,
              fontSize: 14,
              marginTop: 8,
            },
          ]}
        >
          Please try again
        </Text>
      </View>
    );
  }

  if (flatResults && flatResults.length > 0) {
    return (
      <FlashList
        data={flatResults}
        style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 8 }}
        renderItem={renderFlatResult}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={[styles.flatContainer, { paddingTop: grossHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          styles.emptyText,
          {
            color: theme.secondaryText,
            fontFamily: fontFamily.plusJakarta.regular,
          },
        ]}
      >
        {searchQuery
          ? `No results found for "${searchQuery}"`
          : "Pull down to search"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  flatContainer: {
    gap: 12,
  },
  flatResultItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  resultImage: {
    borderRadius: 4,
    borderWidth: 1,
    width: 150,
    aspectRatio: 940 / 549,
  },
  resultContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  resultTitle: {
    fontSize: 16,
  },
  resultYear: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
