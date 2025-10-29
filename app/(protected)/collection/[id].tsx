import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedDetailHeader } from "../../../components/ui/animated-detail-header";
import MediaCard from "../../../components/ui/media-card";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollection } from "../../../hooks/use-collection";
import { fontFamily } from "../../../lib/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_SPACING * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const CollectionDetail = () => {
  const { theme } = useContext(ThemeContext);
  const safeAreaInsets = useSafeAreaInsets();

  // Route param
  const { id } = useLocalSearchParams();
  const collectionId = Array.isArray(id) ? id[0] : id;

  // Data
  const { data: collection, isLoading, error } = useCollection(collectionId);

  // Render rank indicator for media cards
  const renderRankIndicator = (rank: number) => {
    if (!collection?.ranked) return null;
    switch (rank) {
      case 1:
        return (
          <View
            style={{
              position: "relative",
              width: 32,
              height: 32,
              overflow: "visible",
            }}
          >
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../../assets/badges/gold-badge.png")}
              style={{
                position: "absolute",
                width: 40,
                height: 40,
                top: -4,
                left: -4,
                tintColor: theme.background,
              }}
            />
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../../assets/badges/gold-badge.png")}
              style={{
                width: 32,
                height: 32,
              }}
            />
          </View>
        );
      case 2:
        return (
          <View
            style={{
              position: "relative",
              width: 32,
              height: 32,
              overflow: "visible",
            }}
          >
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../../assets/badges/silver-badge.png")}
              style={{
                position: "absolute",
                width: 40,
                height: 40,
                top: -4,
                left: -4,
                tintColor: theme.background,
              }}
            />
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../../assets/badges/silver-badge.png")}
              style={{
                width: 32,
                height: 32,
              }}
            />
          </View>
        );
      case 3:
        return (
          <View
            style={{
              position: "relative",
              width: 32,
              height: 32,
              overflow: "visible",
            }}
          >
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../../assets/badges/bronze-badge.png")}
              style={{
                position: "absolute",
                width: 40,
                height: 40,
                top: -4,
                left: -4,
                tintColor: theme.background,
              }}
            />
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../../assets/badges/bronze-badge.png")}
              style={{
                width: 32,
                height: 32,
              }}
            />
          </View>
        );
      default:
        return (
          <View
            style={{
              position: "relative",
              width: 32,
              height: 32,
              overflow: "visible",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -4,
                left: -4,
                width: 40,
                height: 40,
                backgroundColor: theme.background,
                borderRadius: 30,
              }}
            />
            <Text
              style={{
                fontSize: 14,
                width: 32,
                height: 32,
                fontFamily: fontFamily.plusJakarta.bold,
                color: theme.secondaryText,
                backgroundColor: theme.buttonBackground,
                borderRadius: 30,
                textAlign: "center",
                paddingTop: 6,
              }}
            >
              {rank}
            </Text>
          </View>
        );
    }
  };

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
    <View
      style={[
        { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 },
      ]}
    >
      {/* Animated Header */}
      <AnimatedDetailHeader
        scrollY={scrollY}
        title={collection.name}
        theme={theme}
        topPadding={20}
        titleYPosition={140}
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
          <FlashList
            data={collection.collection_items}
            renderItem={({ item, index }) => (
              <View style={{ position: "relative", marginBottom: 20 }}>
                <MediaCard
                  media={item.media}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                />
                {/* Temporarily force rank indicator for testing */}
                {true && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: -16,
                      left: CARD_WIDTH / 2 - 16,
                      zIndex: 10,
                    }}
                  >
                    {renderRankIndicator(index + 1)}
                  </View>
                )}
              </View>
            )}
            masonry
            numColumns={3}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => (
              <View style={{ height: CARD_SPACING }} />
            )}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 120,
            }}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  scrollViewContent: {},
  content: {},

  title: {
    fontSize: 40,
    fontFamily: fontFamily.tanker.regular,
  },
});
