import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus, Trophy } from "lucide-react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import CollectionItem from "../../../components/ui/collection-item";
import Input from "../../../components/ui/input";
import MediaCard from "../../../components/ui/media-card";
import Search from "../../../components/ui/search";
import { Switch } from "../../../components/ui/switch";
import { AuthContext } from "../../../contexts/auth-context";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollection } from "../../../hooks/use-collection";
import { useCollectionSearch } from "../../../hooks/use-collection-search";
import {
  useCreateCollection,
  useUpdateCollectionWithItems,
} from "../../../hooks/mutations";
import { fontFamily } from "../../../lib/fonts";
import { Media } from "../../../types/media";

const CollectionForm = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const params = useLocalSearchParams();
  const collectionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditMode = !!collectionId;

  // Mutation hooks
  const createCollectionMutation = useCreateCollection();
  const updateCollectionMutation = useUpdateCollectionWithItems();

  // Load collection data if in edit mode
  const { data: collection, isLoading: isLoadingCollection } = useCollection(
    isEditMode ? collectionId : undefined
  );

  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  // Initialize isRanked from collection if available, otherwise default to false
  const [isRanked, setIsRanked] = useState(() => collection?.ranked ?? false);
  const [isEditingEntries, setIsEditingEntries] = useState(false);
  const [renderCounter, setRenderCounter] = useState(0);
  const insets = useSafeAreaInsets();

  const isCreating =
    createCollectionMutation.isPending || updateCollectionMutation.isPending;

  // Extract media items from collection if in edit mode
  const initialMedia = React.useMemo(() => {
    if (collection?.collection_items) {
      return collection.collection_items
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((item) => item.media);
    }
    return undefined;
  }, [collection]);

  const {
    query: searchQuery,
    searchResults,
    selectedMedia,
    isLoading: searchLoading,
    isError: searchError,
    handleSearchChange,
    addMediaToCollection,
    removeMediaFromCollection,
    reorderMedia,
  } = useCollectionSearch(initialMedia);

  // Populate form fields when collection loads (edit mode)
  useEffect(() => {
    if (collection) {
      setCollectionName(collection.name || "");
      setDescription(collection.description || "");
      setIsRanked(collection.ranked ?? false);
    }
  }, [collection]);

  // Animation values
  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const searchTranslateX = useSharedValue(300);
  const backArrowOpacity = useSharedValue(0);
  const backArrowTranslateX = useSharedValue(-50);

  // Header title animations
  const headerNewOpacity = useSharedValue(1);
  const headerNewTranslateY = useSharedValue(0);
  const headerSearchOpacity = useSharedValue(0);
  const headerSearchTranslateY = useSharedValue(-10);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleCollectionForm = () => {
    // Validation
    if (!collectionName.trim()) {
      Alert.alert("Name Required", "Please enter a name for your collection.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to create a collection.");
      return;
    }

    const shouldUpdate = isEditMode && collectionId;
    const trimmedDescription = description.trim() || undefined;
    const actionVerb = isEditMode ? "update" : "create";

    if (shouldUpdate) {
      // Update existing collection
      updateCollectionMutation.mutate(
        {
          collectionId: collectionId!,
          name: collectionName.trim(),
          description: trimmedDescription,
          ranked: isRanked,
          items: selectedMedia,
        },
        {
          onSuccess: () => {
            // Success! Navigate back to the collection detail page
            router.back();
            router.push(`/collection/${collectionId}`);
          },
          onError: (error) => {
            console.error(`Failed to ${actionVerb} collection:`, error);
            Alert.alert(
              "Error",
              error instanceof Error
                ? error.message
                : `Failed to ${actionVerb} collection. Please try again.`
            );
          },
        }
      );
    } else {
      // Create new collection
      createCollectionMutation.mutate(
        {
          name: collectionName.trim(),
          description: trimmedDescription,
          ranked: isRanked,
          items: selectedMedia,
        },
        {
          onSuccess: (newCollection) => {
            // Success! Navigate to the collection detail page
            router.back();
            router.push(`/collection/${newCollection.id}`);
          },
          onError: (error) => {
            console.error(`Failed to ${actionVerb} collection:`, error);
            Alert.alert(
              "Error",
              error instanceof Error
                ? error.message
                : `Failed to ${actionVerb} collection. Please try again.`
            );
          },
        }
      );
    }
  };

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Media>) => {
      const currentIndex = getIndex?.() ?? 0;
      return (
        <CollectionItem
          key={`${item.id}-${currentIndex}-${renderCounter}`}
          item={item}
          index={currentIndex}
          isRanked={isRanked}
          isDraggable={true}
          drag={drag}
          isActive={isActive}
          onRemove={() => removeMediaFromCollection(item.id)}
        />
      );
    },
    [isRanked, renderCounter, removeMediaFromCollection]
  );

  const handleEditEntries = () => {
    if (!isEditingEntries) {
      // Fade out content to the left and fade in search from the right
      contentOpacity.value = withTiming(0, { duration: 300 });
      contentTranslateX.value = withTiming(-50, { duration: 300 });

      searchOpacity.value = withTiming(1, { duration: 300 });
      searchTranslateX.value = withTiming(0, { duration: 300 });

      backArrowTranslateX.value = withTiming(0, { duration: 300 });

      backArrowOpacity.value = withTiming(1, { duration: 300 }, () => {
        runOnJS(setIsEditingEntries)(true);
      });

      // Animate header: New Collection out (down), Search Media in (down)
      headerNewOpacity.value = withTiming(0, { duration: 300 });
      headerNewTranslateY.value = withSpring(10, { duration: 300 });
      headerSearchOpacity.value = withDelay(
        100,
        withSpring(1, { duration: 300 })
      );
      headerSearchTranslateY.value = withDelay(
        100,
        withSpring(0, { duration: 300 })
      );
    } else {
      // Fade out search and fade in content
      searchOpacity.value = withTiming(0, { duration: 300 });
      searchTranslateX.value = withTiming(300, { duration: 300 });

      backArrowOpacity.value = withTiming(0, { duration: 300 });
      backArrowTranslateX.value = withTiming(-50, { duration: 300 });

      contentOpacity.value = withTiming(1, { duration: 300 });
      contentTranslateX.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setIsEditingEntries)(false);
      });

      // Animate header back: Search Media out (up), New Collection in (up)
      headerSearchOpacity.value = withSpring(0, { duration: 300 });
      headerSearchTranslateY.value = withSpring(-10, { duration: 300 });
      headerNewOpacity.value = withDelay(100, withSpring(1, { duration: 300 }));
      headerNewTranslateY.value = withDelay(
        100,
        withSpring(0, { duration: 300 })
      );
    }
  };

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateX: contentTranslateX.value }],
    };
  });

  const searchAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: searchOpacity.value,
      transform: [{ translateX: searchTranslateX.value }],
    };
  });

  const backArrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backArrowOpacity.value,
      transform: [{ translateX: backArrowTranslateX.value }],
    };
  });

  const headerNewAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerNewOpacity.value,
      transform: [{ translateY: headerNewTranslateY.value }],
    };
  });

  const headerSearchAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerSearchOpacity.value,
      transform: [{ translateY: headerSearchTranslateY.value }],
    };
  });

  // Show loading state while fetching collection data
  if (isEditMode && isLoadingCollection) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const headerTitle = isEditMode ? "Edit Collection" : "New Collection";

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={[backArrowAnimatedStyle, styles.backArrowButton]}>
          <TouchableOpacity
            onPress={handleEditEntries}
            style={styles.backArrowButtonTouchable}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerTitleContainer}>
          {/* Invisible placeholder to preserve layout/spacing */}
          <Text style={[styles.headerTitle, { color: "transparent" }]}>
            {headerTitle}
          </Text>
          <Animated.Text
            style={[
              styles.headerTitle,
              styles.headerAnimatedTitle,
              { color: theme.text },
              headerNewAnimatedStyle,
            ]}
          >
            {headerTitle}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.headerTitle,
              styles.headerAnimatedTitle,
              { color: theme.text },
              headerSearchAnimatedStyle,
            ]}
          >
            Search Media
          </Animated.Text>
        </View>
      </View>

      <View style={styles.container}>
        {/* Content */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            <View style={styles.inputContainer}>
              <Input
                placeholder="Collection Name"
                value={collectionName}
                onChangeText={setCollectionName}
              />
              <Input
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                minHeight={150}
                maxHeight={200}
              />
            </View>
            {/* Ranked Switch */}
            <View style={styles.rankedSwitchContainer}>
              <View style={styles.rankedSwitchLabelContainer}>
                <Trophy size={20} color={theme.text} />
                <Text
                  style={[
                    styles.rankedSwitchLabel,
                    {
                      color: theme.text,
                      fontFamily: fontFamily.plusJakarta.medium,
                    },
                  ]}
                >
                  Ranked
                </Text>
              </View>
              <Switch value={isRanked} onValueChange={setIsRanked} />
            </View>
            <View style={styles.entriesContainer}>
              <View style={styles.editEntriesHeaderContainer}>
                <TouchableOpacity
                  style={styles.editEntriesHeaderButton}
                  onPress={handleEditEntries}
                >
                  <Text
                    style={[
                      styles.editEntriesHeaderButtonText,
                      { color: theme.text },
                    ]}
                  >
                    Edit Entries
                  </Text>
                  <Plus size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.entriesList}>
                {selectedMedia.length > 0 ? (
                  <ScrollView
                    style={styles.draggableList}
                    contentContainerStyle={styles.draggableListContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {selectedMedia.map((item, index) => (
                      <CollectionItem
                        key={item.id}
                        item={item}
                        index={index}
                        isRanked={isRanked}
                        isDraggable={false}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Text
                    style={[
                      styles.emptyStateText,
                      {
                        color: theme.secondaryText,
                        fontFamily: fontFamily.plusJakarta.regular,
                      },
                    ]}
                  >
                    No media added yet. Tap &quot;Edit Entries&quot; to search
                    and add media.
                  </Text>
                )}
              </View>
              <Button
                title={
                  isCreating
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Collection"
                      : "Create Collection"
                }
                onPress={handleCollectionForm}
                styles={styles.button}
                variant="secondary"
                disabled={isCreating}
              />
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Search View */}
        <Animated.View
          style={[
            styles.searchContainer,
            searchAnimatedStyle,
            { bottom: -insets.bottom - 32 },
          ]}
        >
          <Search
            placeholder="Search for media to add..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={styles.searchInput}
          />
          <View style={styles.searchContent}>
            {searchQuery ? (
              // When there's a search query, show search results
              searchLoading ? (
                <Text
                  style={[
                    styles.searchEmptyText,
                    {
                      color: theme.secondaryText,
                      fontFamily: fontFamily.plusJakarta.regular,
                    },
                  ]}
                >
                  Searching...
                </Text>
              ) : searchError ? (
                <Text
                  style={[
                    styles.searchEmptyText,
                    {
                      color: theme.text,
                      fontFamily: fontFamily.plusJakarta.medium,
                    },
                  ]}
                >
                  Failed to load search results
                </Text>
              ) : searchResults.length > 0 ? (
                <ScrollView
                  style={styles.searchResultsScrollView}
                  contentContainerStyle={[
                    styles.searchResultsGrid,
                    { paddingBottom: insets.bottom },
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        addMediaToCollection(item);
                        handleSearchChange(""); // Clear search to show draggable list
                        dismissKeyboard(); // Dismiss keyboard after adding item
                      }}
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
                <Text
                  style={[
                    styles.searchEmptyText,
                    {
                      color: theme.secondaryText,
                      fontFamily: fontFamily.plusJakarta.regular,
                    },
                  ]}
                >
                  No results found for &quot;{searchQuery}&quot;
                </Text>
              )
            ) : (
              // When there's no search query, show the draggable list (even if empty)
              <DraggableFlatList
                data={selectedMedia}
                onDragEnd={({ data }) => {
                  reorderMedia(data);
                  setRenderCounter((prev) => prev + 1);
                }}
                keyExtractor={(item) => item.id}
                renderItem={renderDraggableItem}
                style={styles.searchDraggableList}
                contentContainerStyle={[
                  styles.searchDraggableListContent,
                  { paddingBottom: insets.bottom + 32 },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text
                    style={[
                      styles.searchEmptyText,
                      {
                        color: theme.secondaryText,
                        fontFamily: fontFamily.plusJakarta.regular,
                      },
                    ]}
                  >
                    No media added yet. Start typing to search for media to add.
                  </Text>
                }
              />
            )}
          </View>
        </Animated.View>
      </View>
    </>
  );
};

export default CollectionForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    gap: 12,
  },
  searchInput: {},
  searchContent: {
    flex: 1,
    gap: 12,
  },
  searchTitle: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.semiBold,
    textAlign: "center",
  },
  searchResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    textAlign: "center",
    fontFamily: fontFamily.tanker.regular,
  },
  headerTitleContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAnimatedTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  backArrowButton: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 72,
  },
  rankedSwitchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backArrowButtonTouchable: {
    width: "100%",
    height: "100%",
    paddingLeft: 20,
    justifyContent: "center",
    alignItems: "flex-start",

    zIndex: 100,
  },
  inputContainer: {
    gap: 12,
    zIndex: 1,
  },
  editEntriesButton: {},
  entriesContainer: {
    gap: 12,
  },
  entriesList: {
    marginBottom: 52,
  },
  blurGradientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    zIndex: 0,
    pointerEvents: "none",
  },

  button: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
  },
  // Search result styles
  searchResultsScrollView: {
    flex: 1,
    borderRadius: 4,
  },
  searchResultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    overflow: "hidden",
    gap: 12,
  },
  searchResultItem: {},
  searchEmptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
  // Media cards styles for main screen
  mediaCardsScrollView: {
    flex: 1,
    height: 300,
    borderRadius: 4,
  },
  mediaCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    overflow: "hidden",
    gap: 12,
  },
  mediaCardItem: {},
  editEntriesHeaderContainer: {
    position: "relative",
    zIndex: 1,
  },
  editEntriesHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    paddingBottom: 8,
    zIndex: 2,
  },
  editEntriesHeaderButtonText: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  // Draggable list styles
  draggableList: {
    flex: 1,
    maxHeight: 360,
    overflow: "hidden",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  draggableListContent: {
    paddingBottom: 32,
  },
  // Search screen draggable list styles
  searchDraggableList: {
    // flex: 1,
    marginTop: -12,
    paddingTop: 12,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  searchDraggableListContent: {
    paddingBottom: 32,
  },
  draggableItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    gap: 12,
  },
  draggableContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  draggableTitle: {
    fontSize: 16,
  },
  draggableYear: {
    fontSize: 14,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: fontFamily.plusJakarta.bold,
  },
  rankNumberSmall: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: fontFamily.plusJakarta.bold,
    minWidth: 24,
    textAlign: "center",
  },
  rankContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    paddingBottom: 72,
    paddingTop: 52,
  },
  rankedSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
  },
  rankedSwitchLabel: {
    fontSize: 18,
  },
});
