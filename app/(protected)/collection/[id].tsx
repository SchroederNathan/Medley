import { router, useLocalSearchParams } from "expo-router";
import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedDetailHeader } from "../../../components/ui/animated-detail-header";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollection } from "../../../hooks/use-collection";
import { fontFamily } from "../../../lib/fonts";

const CollectionDetail = () => {
  const { theme } = useContext(ThemeContext);
  const safeAreaInsets = useSafeAreaInsets();

  // Route param
  const { id } = useLocalSearchParams();
  const collectionId = Array.isArray(id) ? id[0] : id;

  // Data
  const { data: collection, isLoading, error } = useCollection(collectionId);

  // Shared scroll position for header animations
  const scrollY = useSharedValue(0);

  // Scroll handler for smooth animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: ({ contentOffset: { y } }) => {
      scrollY.value = y;
    },
  });

  if (isLoading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.background, paddingTop: safeAreaInsets.top },
        ]}
      >
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.background, paddingTop: safeAreaInsets.top },
        ]}
      >
        <Text style={{ color: theme.text, marginBottom: 12 }}>
          Failed to load collection
        </Text>
        <Text style={{ color: theme.secondaryText, marginBottom: 16 }}>
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
        <Text
          onPress={() => router.back()}
          style={{ color: theme.text, textDecorationLine: "underline" }}
        >
          Go back
        </Text>
      </View>
    );
  }

  if (!collection) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.background, paddingTop: safeAreaInsets.top },
        ]}
      >
        <Text style={{ color: theme.text, marginBottom: 12 }}>
          Collection not found
        </Text>
        <Text
          onPress={() => router.back()}
          style={{ color: theme.text, textDecorationLine: "underline" }}
        >
          Go back
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: theme.background, padding: 20 }]}>
      {/* Animated Header */}
      <AnimatedDetailHeader
        scrollY={scrollY}
        title={collection.name}
        theme={theme}
        topPadding={20}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingBottom: safeAreaInsets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={1000 / 60}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            {collection.name}
          </Text>
          {collection.description ? (
            <Text style={{ color: theme.secondaryText, marginTop: 8 }}>
              {collection.description}
            </Text>
          ) : null}

          {/* Items */}
          <View style={{ marginTop: 16, gap: 12 }}>
            {collection.collection_items?.map((item) => (
              <View
                key={item.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ color: theme.secondaryText, width: 20 }}>
                  {item.position}.
                </Text>
                <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
                  {item.media?.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default CollectionDetail;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 72,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
  },
  content: {
    // paddingTop: 20,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 40,
    fontFamily: fontFamily.tanker.regular,
  },
});
