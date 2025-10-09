import { Image } from "expo-image";
import { XIcon } from "lucide-react-native";
import React, { useContext, useState } from "react";
import {
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
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Button from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import MediaCard from "../../../components/ui/media-card";
import Search from "../../../components/ui/search";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollectionSearch } from "../../../hooks/use-collection-search";
import { fontFamily } from "../../../lib/fonts";
import { Media } from "../../../types/media";

const CreateCollection = () => {
  const { theme } = useContext(ThemeContext);
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingEntries, setIsEditingEntries] = useState(false);

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
  } = useCollectionSearch();

  // Animation values
  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const searchTranslateX = useSharedValue(300);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderDraggableItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Media>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        activeOpacity={0.7}
        style={[
          styles.draggableItem,
          {
            backgroundColor: isActive
              ? theme.buttonBackground
              : theme.inputBackground,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        <Image
          source={{ uri: item.poster_url }}
          contentFit="cover"
          style={styles.draggableImage}
        />
        <View style={styles.draggableContent}>
          <Text
            style={[
              styles.draggableTitle,
              {
                color: theme.text,
                fontFamily: fontFamily.plusJakarta.bold,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.draggableYear,
              {
                color: theme.secondaryText,
                fontFamily: fontFamily.plusJakarta.regular,
              },
            ]}
          >
            {item.year}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => removeMediaFromCollection(item.id)}
          style={styles.removeButton}
        >
          <XIcon color={theme.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  const handleEditEntries = () => {
    if (!isEditingEntries) {
      // Fade out content to the left and fade in search from the right
      contentOpacity.value = withTiming(0, { duration: 300 });
      contentTranslateX.value = withTiming(-50, { duration: 300 });

      searchOpacity.value = withTiming(1, { duration: 300 });
      searchTranslateX.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setIsEditingEntries)(true);
      });
    } else {
      // Fade out search and fade in content
      searchOpacity.value = withTiming(0, { duration: 300 });
      searchTranslateX.value = withTiming(300, { duration: 300 });

      contentOpacity.value = withTiming(1, { duration: 300 });
      contentTranslateX.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setIsEditingEntries)(false);
      });
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

  return (
    <>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          {/* Header */}
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              New Collection
            </Text>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
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
            <View style={styles.entriesContainer}>
              <Button
                title="Edit Entries"
                onPress={handleEditEntries}
                variant="primary"
              />
              <View style={styles.entriesList}>
                {selectedMedia.length > 0 ? (
                  <DraggableFlatList
                    data={selectedMedia}
                    onDragEnd={({ data }) => reorderMedia(data)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDraggableItem}
                    style={styles.draggableList}
                    ItemSeparatorComponent={() => (
                      <View style={{ height: 8 }} />
                    )}
                    contentContainerStyle={styles.draggableListContent}
                  />
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
                title="Create Collection"
                onPress={() => {}}
                styles={styles.button}
                variant="secondary"
              />
            </View>
          </Animated.View>

          {/* Search View */}
          <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
            <Search
              placeholder="Search for media to add..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              style={styles.searchInput}
            />
            <View style={styles.searchContent}>
              {searchLoading ? (
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
                  contentContainerStyle={styles.searchResultsGrid}
                  showsVerticalScrollIndicator={false}
                >
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        addMediaToCollection(item);
                        handleEditEntries(); // Close search and show collection
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
              ) : searchQuery ? (
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
                  Recommended media for your collection
                </Text>
              )}
            </View>
            <Button
              title="Done"
              onPress={handleEditEntries}
              styles={styles.button}
              variant="secondary"
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default CreateCollection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    position: "absolute",
    top: 72,
    left: 20,
    right: 20,
    bottom: 0,
    gap: 12,
    flex: 1,
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
  headerTitle: {
    fontSize: 24,
    textAlign: "center",
    paddingVertical: 24,
    fontFamily: fontFamily.tanker.regular,
  },
  inputContainer: {
    gap: 12,
  },
  editEntriesButton: {},
  entriesContainer: {
    gap: 12,
  },
  entriesList: {
    marginBottom: 52,
  },

  button: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  // Search result styles
  searchResultsScrollView: {
    flex: 1,
    marginBottom: 72,
  },
  searchResultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",

    overflow: "hidden",
    gap: 12,
  },
  searchResultItem: {
    width: "31.2%",
  },
  searchEmptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
  // Draggable list styles
  draggableList: {
    flex: 1,
    overflow: "visible",
  },
  draggableListContent: {
    paddingBottom: 32,
  },
  draggableItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  draggableImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
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
  removeButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
});
