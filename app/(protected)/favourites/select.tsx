import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MediaCard from "../../../components/ui/media-card";
import Search from "../../../components/ui/search";
import { ThemedText } from "../../../components/ui/themed-text";
import { spacing } from "../../../constants/theme";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollectionSearch } from "../../../hooks/use-collection-search";
import { useFavourites } from "../../../hooks/use-favourites";
import { useSetFavourites } from "../../../hooks/mutations";
import { MAX_FAVOURITES } from "../../../services/favouritesService";
import { Media } from "../../../types/media";

/**
 * Single-slot favourites picker shown as a modal.
 *
 * `mode=add` appends to the favourites list; `mode=replace&position=N` swaps the
 * media at the 1-indexed slot N. Both persist through the same replace-all
 * mutation and dismiss on success.
 */
const FavouritesSelect = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; position?: string }>();

  const mode = params.mode === "replace" ? "replace" : "add";
  const slotIndex = params.position ? Number(params.position) - 1 : -1;

  const { data: existing } = useFavourites();
  const setFavourites = useSetFavourites();
  const current = useMemo(() => existing ?? [], [existing]);

  const {
    query: searchQuery,
    searchResults,
    isLoading: searchLoading,
    isError: searchError,
    handleSearchChange,
  } = useCollectionSearch();

  const title = mode === "replace" ? "Replace favourite" : "Add favourite";

  const handleSelect = (media: Media) => {
    const isReplace =
      mode === "replace" && slotIndex >= 0 && slotIndex < current.length;

    if (isReplace) {
      const existsElsewhere = current.some(
        (item, index) => item.id === media.id && index !== slotIndex
      );
      if (existsElsewhere) {
        Alert.alert(
          "Already a favourite",
          `${media.title} is already in your favourites.`
        );
        return;
      }
    } else {
      if (current.some((item) => item.id === media.id)) {
        Alert.alert(
          "Already a favourite",
          `${media.title} is already in your favourites.`
        );
        return;
      }
      if (current.length >= MAX_FAVOURITES) {
        Alert.alert(
          "Favourites full",
          `You can feature up to ${MAX_FAVOURITES} favourites. Remove one to add another.`
        );
        return;
      }
    }

    const next = isReplace
      ? current.map((item, index) => (index === slotIndex ? media : item))
      : [...current, media];

    Keyboard.dismiss();
    setFavourites.mutate(next, {
      onSuccess: () => router.back(),
      onError: (error) =>
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "Failed to save favourites. Please try again."
        ),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="screenTitle">{title}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ThemedText weight="medium" color="secondary">
            Cancel
          </ThemedText>
        </TouchableOpacity>
      </View>

      <Search
        placeholder="Search for media..."
        value={searchQuery}
        onChangeText={handleSearchChange}
      />

      <View style={styles.content}>
        {searchLoading ? (
          <ThemedText color="secondary" style={styles.emptyText}>
            Searching...
          </ThemedText>
        ) : searchError ? (
          <ThemedText style={styles.emptyText}>
            Failed to load results
          </ThemedText>
        ) : searchResults.length > 0 ? (
          <ScrollView
            contentContainerStyle={[
              styles.resultsGrid,
              { paddingBottom: insets.bottom + spacing.xxl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelect(item)}
                disabled={setFavourites.isPending}
              >
                <MediaCard
                  media={item}
                  width={120}
                  height={180}
                  isTouchable={false}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ThemedText color="secondary" style={styles.emptyText}>
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : "Search to find media to feature."}
          </ThemedText>
        )}
      </View>
    </View>
  );
};

export default FavouritesSelect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    marginTop: spacing.md,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: spacing.huge,
  },
});
