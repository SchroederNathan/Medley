import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  Layout,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import Carousel from "../../../components/ui/carousel";
import StatusButton from "../../../components/ui/status-button";
import { AuthContext } from "../../../contexts/auth-context";
import { ThemeContext } from "../../../contexts/theme-context";
import { useMediaItem } from "../../../hooks/use-media-item";
import { fontFamily } from "../../../lib/fonts";
import { RecommendationService } from "../../../services/recommendationService";

const mediaTypeToTitle = (mediaType: "movie" | "tv_show" | "book" | "game") => {
  switch (mediaType) {
    case "movie":
      return "Movie";
    case "tv_show":
      return "TV Show";
    case "book":
      return "Book";
    case "game":
      return "Game";
  }
};

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

const POSTER_PADDING = 72;

const MediaDetailScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams();
  const topPadding = useSafeAreaInsets().top;
  const mediaId = Array.isArray(id) ? id[0] : id;

  // Shared scroll position drives parallax transformations
  const scrollY = useSharedValue(0);

  // Worklet-optimized scroll handler for 60fps parallax animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: ({ contentOffset: { y } }) => {
      // Direct shared value assignment runs on UI thread for smooth transforms
      scrollY.value = y;
    },
  });

  const { data: media, isLoading, error } = useMediaItem(mediaId);
  const [recs, setRecs] = React.useState<any[]>([]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mediaId) return;
      try {
        const results = await RecommendationService.getSimilarToMedia(
          user?.id || "",
          mediaId,
          undefined,
          { limit: 20 },
        );

        console.log("results", results[0]);
        if (mounted) setRecs(results || []);
      } catch {
        if (mounted) setRecs([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [mediaId, user?.id]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { paddingTop: topPadding, backgroundColor: theme.background },
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
          styles.errorContainer,
          { backgroundColor: theme.background, paddingTop: topPadding },
        ]}
      >
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          Failed to load media details
        </Text>
        <Text style={[styles.errorMessage, { color: theme.secondaryText }]}>
          {error.message}
        </Text>
        <Button title="Try Again" onPress={() => router.back()} />
      </View>
    );
  }

  if (!media) {
    return (
      <View
        style={[
          styles.notFoundContainer,
          { backgroundColor: theme.background, paddingTop: topPadding },
        ]}
      >
        <Text style={[styles.notFoundText, { color: theme.text }]}>
          Media not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: theme.background }]}>
      {/* Parallax Backdrop */}
      <ParallaxBackdropImage scrollY={scrollY} imageUri={media.backdrop_url} />

      {/* Back Button Overlay */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.backButton,
          {
            top: topPadding + 12,
            backgroundColor: theme.buttonBackground,
            borderColor: theme.buttonBorder,
            position: "absolute",
            zIndex: 10,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={20} color={theme.text} />
      </TouchableOpacity>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: BACKDROP_HEIGHT - POSTER_PADDING },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={1000 / 60}
      >
        {/* Poster + Core Details Row */}
        <View style={[styles.posterRow, { marginTop: POSTER_PADDING }]}>
          <Image
            source={{ uri: media.poster_url }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            style={[styles.posterImage, { borderColor: theme.buttonBorder }]}
          />
          <View style={styles.posterDetails}>
            <Text
              style={[styles.titleText, { color: theme.text }]}
              numberOfLines={3}
            >
              {media.title}
            </Text>
            <Text style={[styles.subtitleText, { color: theme.secondaryText }]}>
              {media.genres[0]} · {media.year}
              {typeof media.duration_minutes === "number" &&
              media.duration_minutes > 0
                ? `  ·  ${media.duration_minutes} min`
                : ""}
              {typeof media.rating_average === "number" &&
              media.rating_count > 0
                ? `  ·  ${media.rating_average.toFixed(1)}`
                : ""}
            </Text>
          </View>
        </View>

        {/* Body Content */}
        <Animated.View
          style={styles.bodyContent}
          layout={Layout.duration(220).easing(Easing.out(Easing.cubic))}
        >
          <StatusButton
            title={
              "Save " +
              mediaTypeToTitle(
                media.media_type as "movie" | "tv_show" | "book" | "game",
              )
            }
            mediaId={mediaId!}
            mediaType={
              media.media_type as "movie" | "tv_show" | "book" | "game"
            }
            styles={styles.button}
            onStatusSaved={() => {
              if (!user?.id) return;
              // Optimistically update cached library list
              queryClient.setQueryData<any[]>(
                ["userLibrary", user.id],
                (prev) => {
                  const list = Array.isArray(prev) ? prev : [];
                  if (list.some((m) => m.id === media.id)) return list;
                  return [media, ...list];
                },
              );
            }}
          />
          {media.description?.length > 0 && (
            <Animated.View
              layout={Layout.duration(220).easing(Easing.out(Easing.cubic))}
            >
              <Text style={[styles.descriptionText, { color: theme.text }]}>
                {media.description}
              </Text>
            </Animated.View>
          )}

          {/* Optional metadata */}
          <Animated.View
            style={styles.metadataContainer}
            layout={Layout.duration(220).easing(Easing.out(Easing.cubic))}
          >
            {media.metadata?.original_title &&
              media.metadata.original_title !== media.title && (
                <Text
                  style={[styles.metadataText, { color: theme.secondaryText }]}
                >
                  Original title:{" "}
                  <Text style={{ color: theme.text }}>
                    {media.metadata.original_title}
                  </Text>
                </Text>
              )}
          </Animated.View>
          {recs.length > 0 && (
            <Animated.View
              layout={Layout.duration(220).easing(Easing.out(Easing.cubic))}
              style={{ marginTop: 24 }}
            >
              <Carousel title="You might also like" media={recs as any} />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

export default MediaDetailScreen;

const styles = StyleSheet.create({
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Error states
  errorContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    marginBottom: 16,
  },
  errorMessage: {
    marginBottom: 24,
  },

  // Not found states
  notFoundContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    marginBottom: 24,
  },

  // Main content
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },

  // Backdrop section
  backdropContainer: {
    height: 320,
    marginTop: -16,
  },
  backdropImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  backdropGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },

  // Back button
  backButton: {
    position: "absolute",
    left: 16,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  // Poster row
  posterRow: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 80,
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
  },
  posterImage: {
    width: 120,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  posterDetails: {
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.medium,
  },

  // Body content
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 100,
  },
  button: {
    marginBottom: 16,
  },
  descriptionText: {
    lineHeight: 22,
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  metadataContainer: {
    marginTop: 16,
    gap: 8,
  },
  metadataText: {
    // Colors are applied inline
  },
});
