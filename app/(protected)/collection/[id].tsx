import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedDetailHeader } from "../../../components/ui/animated-detail-header";
import MediaCard from "../../../components/ui/media-card";
import ActionMenu from "../../../components/ui/sheets/action-menu";
import {
  CopyIcon,
  MoreVerticalIcon,
  PencilIcon,
  Share2Icon,
  Trash,
} from "../../../components/ui/svg-icons";
import { TruncatedText } from "../../../components/ui/truncated-text";
import { ThemeContext } from "../../../contexts/theme-context";
import { useCollection } from "../../../hooks/use-collection";
import { useUserProfileById } from "../../../hooks/use-user-profile";
import { fontFamily } from "../../../lib/fonts";
import { useToast } from "../../../contexts/toast-context";
import { CollectionService } from "../../../services/collectionService";
import { AuthContext } from "../../../contexts/auth-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_SPACING * 3) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

// Parallax animation constants
const BACKDROP_WIDTH = Dimensions.get("window").width;
const BACKDROP_HEIGHT = 320; // Same as current backdrop height
const TOP_OFFSET = 30; // Offset for parallax effect

interface BackdropImageProps {
  imageUri: string;
}

const BackdropImage: React.FC<BackdropImageProps> = ({ imageUri }) => {
  return (
    <View style={{ width: BACKDROP_WIDTH, height: BACKDROP_HEIGHT }}>
      {/* Base crisp image layer */}
      <Image
        source={{ uri: imageUri }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        style={{
          width: BACKDROP_WIDTH,
          height: BACKDROP_HEIGHT,
        }}
      />
      {/* Linear gradient overlay */}
      <LinearGradient
        colors={["rgba(10,10,10,0)", "rgba(10,10,10,1)"]}
        locations={[0, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

interface ParallaxBackdropImageProps {
  scrollY: SharedValue<number>;
  imageUri: string;
}

const ParallaxBackdropImage: React.FC<ParallaxBackdropImageProps> = ({
  scrollY,
  imageUri,
}) => {
  // Parallax animation style combining translateY movement and scale transforms
  const rImageBgStyle = useAnimatedStyle(() => {
    return {
      // Negative offset compensates for status bar space
      top: -TOP_OFFSET,
      transform: [
        {
          // Parallax effect: image moves slower than scroll for depth illusion
          // Pull down (-30px): image moves down 30px
          // Normal scroll (0-height): image moves up at 1:1 ratio with scroll
          translateY: interpolate(
            scrollY.value,
            [-TOP_OFFSET, 0, BACKDROP_HEIGHT], // Input: pull-down, start, full scroll
            [TOP_OFFSET, 0, -BACKDROP_HEIGHT], // Output: move down, neutral, move up
            Extrapolation.CLAMP,
          ),
        },
        {
          // Scale animation for dramatic pull-to-zoom effect (iOS bounce)
          // Overscroll creates 2x zoom, returns to normal at scroll start
          scale: interpolate(
            scrollY.value,
            [-BACKDROP_HEIGHT, -TOP_OFFSET, 0], // Input: max overscroll, minor pull, normal
            [2, 1, 1], // Output: 200% zoom, normal, normal
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        rImageBgStyle,
        // Fixed dimensions prevent layout shifts during animations
        // transformOrigin "top" ensures scaling happens from header top edge
        {
          width: BACKDROP_WIDTH,
          height: BACKDROP_HEIGHT,
          transformOrigin: "top",
          position: "absolute",
        },
      ]}
    >
      <BackdropImage imageUri={imageUri} />
    </Animated.View>
  );
};

// Helper function to format date with ordinal suffix
const formatCollectionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  const year = date.getFullYear();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();

  const ordinalDay = `${day}`;

  // Include year only if it's not the current year
  if (year === currentYear) {
    return `${month} ${ordinalDay}`;
  } else {
    return `${month} ${ordinalDay}, ${year}`;
  }
};

const CollectionDetail = () => {
  const { theme } = useContext(ThemeContext);
  const safeAreaInsets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  // Route param
  const { id } = useLocalSearchParams();
  const collectionId = Array.isArray(id) ? id[0] : id;
  const { showToast } = useToast();
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Data
  const { data: collection, isLoading, error } = useCollection(collectionId);

  // Fetch collection owner's profile
  const { data: ownerProfile } = useUserProfileById(collection?.user_id);

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

  // Get backdrop URL from first media item
  const firstMediaItem = collection.collection_items?.[0]?.media;
  const backdropUrl = firstMediaItem?.backdrop_url;

  return (
    <>
      <View style={[{ flex: 1, backgroundColor: theme.background }]}>
        {/* Parallax Backdrop */}
        {backdropUrl && (
          <ParallaxBackdropImage scrollY={scrollY} imageUri={backdropUrl} />
        )}

        {/* Animated Header */}
        <AnimatedDetailHeader
          scrollY={scrollY}
          title={collection.name}
          isModal={Platform.OS === "ios"}
          theme={theme}
          topPadding={20}
          titleYPosition={352}
          rightButtons={[
            {
              icon: <Share2Icon size={20} color={theme.text} />,
              onPress: () => {
                // TODO: Implement share functionality
              },
            },
            {
              icon: <MoreVerticalIcon size={20} color={theme.text} />,
              onPress: () => {
                setShowActionMenu(true);
              },
            },
          ]}
        />

        <Animated.ScrollView
          style={[
            styles.scrollView,
            { paddingTop: backdropUrl ? BACKDROP_HEIGHT - 72 : 72 },
          ]}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: safeAreaInsets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={1000 / 60}
        >
          <View style={[styles.content, { paddingHorizontal: 20 }]}>
            {/* Owner Profile Section */}
            {ownerProfile && (
              <View style={styles.ownerSection}>
                <View
                  style={[
                    styles.profileImageContainer,
                    {
                      backgroundColor: theme.buttonBackground,
                      borderColor: theme.buttonBorder,
                    },
                  ]}
                >
                  {ownerProfile.avatar_url ? (
                    <Image
                      source={{ uri: ownerProfile.avatar_url }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.profilePlaceholderText,
                        { color: theme.text },
                      ]}
                    >
                      {ownerProfile.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  )}
                </View>
                <View style={styles.ownerNameContainer}>
                  <Text style={[styles.ownerName, { color: theme.text }]}>
                    {ownerProfile.name || "Unknown User"}
                  </Text>
                  <Text
                    style={[styles.dateCreated, { color: theme.secondaryText }]}
                  >
                    {formatCollectionDate(collection.created_at)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.title, { color: theme.text }]}>
              {collection.name}
            </Text>
            {collection.description ? (
              <TruncatedText
                text={collection.description}
                numberOfLines={5}
                textStyle={[
                  styles.descriptionText,
                  { color: theme.secondaryText },
                ]}
                containerStyle={styles.descriptionContainer}
                backgroundColor={theme.background}
              />
            ) : null}

            {/* Items */}
            <FlashList
              data={collection.collection_items}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    position: "relative",
                    marginBottom: collection.ranked ? 20 : 0,
                  }}
                >
                  <MediaCard
                    media={item.media}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                  />
                  {/* Temporarily force rank indicator for testing */}
                  {collection.ranked && (
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
      <ActionMenu
        visible={showActionMenu}
        onClose={() => {
          setShowActionMenu(false);
        }}
        actions={[
          {
            title: "Share",
            icon: <Share2Icon size={20} color={theme.text} />,
            onPress: () => {
              // TODO: Implement share functionality
              setShowActionMenu(false);
            },
          },
          {
            title: "Edit",
            icon: <PencilIcon size={20} color={theme.text} />,
            onPress: () => {
              // TODO: Implement edit functionality
              setShowActionMenu(false);
            },
          },
          {
            title: "Clone",
            icon: <CopyIcon size={20} color={theme.text} />,
            onPress: () => {
              // TODO: Implement add to collection functionality
              setShowActionMenu(false);
            },
          },
          {
            title: "Delete",
            destructive: true,
            icon: <Trash size={20} color={theme.destructive} />,
            onPress: async () => {
              try {
                await CollectionService.deleteCollection(
                  collectionId,
                  user?.id || "",
                );
                setShowActionMenu(false);
                router.back();
                setTimeout(() => {
                  showToast({
                    message: `${collection.name} deleted`,
                  });
                }, 300);
              } catch {
                showToast({
                  message: "Failed to delete collection. Please try again.",
                });
              }
            },
          },
        ]}
      />
    </>
  );
};

export default CollectionDetail;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {},
  content: {},

  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  profilePlaceholderText: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.medium,
    textTransform: "uppercase",
  },
  ownerNameContainer: {
    flexDirection: "column",
    gap: 2,
  },
  ownerName: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  dateCreated: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  title: {
    fontSize: 40,
    fontFamily: fontFamily.tanker.regular,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
    lineHeight: 20,
  },
});
