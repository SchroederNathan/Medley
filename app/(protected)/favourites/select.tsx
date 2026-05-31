import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MediaCard from "../../../components/ui/media-card";
import Search from "../../../components/ui/search";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollectionSearch } from "../../../hooks/use-collection-search";
import { useFavourites } from "../../../hooks/use-favourites";
import { useSetFavourites } from "../../../hooks/mutations";
import { fontFamily } from "../../../lib/fonts";
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      <Search
        placeholder="Search for media..."
        value={searchQuery}
        onChangeText={handleSearchChange}
      />

      <View style={styles.content}>
        {searchLoading ? (
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            Searching...
          </Text>
        ) : searchError ? (
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Failed to load results
          </Text>
        ) : searchResults.length > 0 ? (
          <ScrollView
            contentContainerStyle={[
              styles.resultsGrid,
              { paddingBottom: insets.bottom + 24 },
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
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : "Search to find media to feature."}
          </Text>
        )}
      </View>
    </View>
  );
};

export default FavouritesSelect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.tanker.regular,
  },
  cancel: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  content: {
    flex: 1,
    marginTop: 12,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
    fontFamily: fontFamily.plusJakarta.regular,
  },
});
