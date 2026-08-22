import ArrowLeft02Icon from "@hugeicons-pro/core-stroke-standard/ArrowLeft02Icon";
import ChampionIcon from "@hugeicons-pro/core-stroke-standard/ChampionIcon";
import PlusSignIcon from "@hugeicons-pro/core-stroke-standard/PlusSignIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { ThemedText } from "../../../components/ui/themed-text";
import {
  motion,
  radius,
  spacing,
  type,
} from "../../../constants/theme";
import { AuthContext } from "../../../contexts/auth-context";
import { ThemeContext } from "../../../contexts/theme-context";
import {
  useCreateCollection,
  useUpdateCollectionWithItems,
} from "../../../hooks/mutations";
import { useCollection } from "../../../hooks/use-collection";
import { useCollectionSearch } from "../../../hooks/use-collection-search";
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
      contentOpacity.value = withTiming(0, { duration: motion.base });
      contentTranslateX.value = withTiming(-50, { duration: motion.base });

      searchOpacity.value = withTiming(1, { duration: motion.base });
      searchTranslateX.value = withTiming(0, { duration: motion.base });

      backArrowTranslateX.value = withTiming(0, { duration: motion.base });

      backArrowOpacity.value = withTiming(1, { duration: motion.base }, () => {
        runOnJS(setIsEditingEntries)(true);
      });

      // Animate header: New Collection out (down), Search Media in (down)
      headerNewOpacity.value = withTiming(0, { duration: motion.base });
      headerNewTranslateY.value = withSpring(10, { duration: motion.base });
      headerSearchOpacity.value = withDelay(
        motion.fast,
        withSpring(1, { duration: motion.base })
      );
      headerSearchTranslateY.value = withDelay(
        motion.fast,
        withSpring(0, { duration: motion.base })
      );
    } else {
      // Fade out search and fade in content
      searchOpacity.value = withTiming(0, { duration: motion.base });
      searchTranslateX.value = withTiming(300, { duration: motion.base });

      backArrowOpacity.value = withTiming(0, { duration: motion.base });
      backArrowTranslateX.value = withTiming(-50, { duration: motion.base });

      contentOpacity.value = withTiming(1, { duration: motion.base });
      contentTranslateX.value = withTiming(0, { duration: motion.base }, () => {
        runOnJS(setIsEditingEntries)(false);
      });

      // Animate header back: Search Media out (up), New Collection in (up)
      headerSearchOpacity.value = withSpring(0, { duration: motion.base });
      headerSearchTranslateY.value = withSpring(-10, { duration: motion.base });
      headerNewOpacity.value = withDelay(
        motion.fast,
        withSpring(1, { duration: motion.base })
      );
      headerNewTranslateY.value = withDelay(
        motion.fast,
        withSpring(0, { duration: motion.base })
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
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={24}
              strokeWidth={2.5}
              color={theme.text}
            />
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
                <HugeiconsIcon
                  icon={ChampionIcon}
                  size={24}
                  strokeWidth={2.5}
                  color={theme.text}
                />
                <ThemedText variant="titleSm" weight="medium">
                  Ranked
                </ThemedText>
              </View>
              <Switch value={isRanked} onValueChange={setIsRanked} />
            </View>
            <View style={styles.entriesContainer}>
              <View style={styles.editEntriesHeaderContainer}>
                <TouchableOpacity
                  style={styles.editEntriesHeaderButton}
                  onPress={handleEditEntries}
                >
                  <ThemedText variant="heading">Edit Entries</ThemedText>
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    size={24}
                    strokeWidth={2.5}
                    color={theme.text}
                  />
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
                  <ThemedText color="secondary" style={styles.emptyStateText}>
                    No media added yet. Tap &quot;Edit Entries&quot; to search
                    and add media.
                  </ThemedText>
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
            { bottom: -insets.bottom - spacing.xxxl },
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
                <ThemedText color="secondary" style={styles.searchEmptyText}>
                  Searching...
                </ThemedText>
              ) : searchError ? (
                <ThemedText weight="medium" style={styles.searchEmptyText}>
                  Failed to load search results
                </ThemedText>
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
                <ThemedText color="secondary" style={styles.searchEmptyText}>
                  No results found for &quot;{searchQuery}&quot;
                </ThemedText>
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
                  { paddingBottom: insets.bottom + spacing.xxxl },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <ThemedText color="secondary" style={styles.searchEmptyText}>
                    No media added yet. Start typing to search for media to add.
                  </ThemedText>
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
    paddingHorizontal: spacing.xl,
  },
  searchContainer: {
    position: "absolute",
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    gap: spacing.md,
  },
  searchInput: {},
  searchContent: {
    flex: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  headerTitle: {
    ...type.screenTitle,
    textAlign: "center",
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
    gap: spacing.md,
  },
  backArrowButtonTouchable: {
    width: "100%",
    height: "100%",
    paddingLeft: spacing.xl,
    justifyContent: "center",
    alignItems: "flex-start",

    zIndex: 100,
  },
  inputContainer: {
    gap: spacing.md,
    zIndex: 1,
  },
  entriesContainer: {
    gap: spacing.md,
  },
  entriesList: {
    marginBottom: 52, // clears the absolutely-positioned 52pt button
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
    borderRadius: radius.xs,
  },
  searchResultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    overflow: "hidden",
    gap: spacing.md,
  },
  searchResultItem: {},
  searchEmptyText: {
    textAlign: "center",
    paddingVertical: spacing.huge,
  },
  editEntriesHeaderContainer: {
    position: "relative",
    zIndex: 1,
  },
  editEntriesHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    zIndex: 2,
  },
  // Draggable list styles
  draggableList: {
    flex: 1,
    maxHeight: 360,
    overflow: "hidden",
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  draggableListContent: {
    paddingBottom: spacing.xxxl,
  },
  // Search screen draggable list styles
  searchDraggableList: {
    marginTop: -spacing.md,
    paddingTop: spacing.md,
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  searchDraggableListContent: {
    paddingBottom: spacing.xxxl,
  },
  emptyStateText: {
    textAlign: "center",
    paddingBottom: 72, // optical centering between switch row and button
    paddingTop: 52,
  },
  rankedSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
