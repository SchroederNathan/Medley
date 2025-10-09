import React, { useContext, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Button from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import Search from "../../../components/ui/search";
import { ThemeContext } from "../../../contexts/theme-context";
import { fontFamily } from "../../../lib/fonts";

const CreateCollection = () => {
  const { theme } = useContext(ThemeContext);
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingEntries, setIsEditingEntries] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Animation values
  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const searchTranslateX = useSharedValue(300);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

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
              <View style={styles.entriesList}></View>
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
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <View style={styles.searchContent}></View>
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
});
