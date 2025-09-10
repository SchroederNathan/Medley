import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { Easing, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import StatusButton from "../../../components/ui/status-button";
import Carousel from "../../../components/ui/carousel";
import { AuthContext } from "../../../contexts/auth-context";
import { ThemeContext } from "../../../contexts/theme-context";
import { useMediaItem } from "../../../hooks/use-media-item";
import { fontFamily } from "../../../lib/fonts";
import { UserMediaService } from "../../../services/userMediaService";
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

const POSTER_PADDING = 72;

const MediaDetailScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { user, isLoggedIn } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams();
  const topPadding = useSafeAreaInsets().top;
  const mediaId = Array.isArray(id) ? id[0] : id;

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
          { limit: 20 }
        );
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
    <ScrollView
      style={[{ backgroundColor: theme.background }, styles.scrollView]}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Backdrop Section */}
      <View
        style={[
          styles.backdropContainer,
          { marginBottom: 16 + POSTER_PADDING },
        ]}
      >
        <Image
          source={{ uri: media.backdrop_url }}
          cachePolicy="memory-disk"
          transition={200}
          contentFit="cover"
          style={styles.backdropImage}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", theme.background]}
          locations={[0, 1]}
          style={styles.backdropGradient}
        />

        {/* Overlay Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              top: topPadding + 12,
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>

        {/* Poster + Core Details Row */}
        <View style={[styles.posterRow, { bottom: -POSTER_PADDING }]}>
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
              {media.year}
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
          mediaType={media.media_type as "movie" | "tv_show" | "book" | "game"}
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
            <Carousel title="Recommended for you" media={recs as any} />
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
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
