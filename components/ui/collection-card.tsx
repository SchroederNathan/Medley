import Delete02Icon from "@hugeicons-pro/core-stroke-standard/Delete02Icon";
import Edit03Icon from "@hugeicons-pro/core-stroke-standard/Edit03Icon";
import Share08Icon from "@hugeicons-pro/core-stroke-standard/Share08Icon";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useContext, useMemo, useRef } from "react";
import { Alert, Share, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  runOnUI,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { radius, spacing } from "../../constants/theme";
import { AuthContext } from "../../contexts/auth-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useToast } from "../../contexts/toast-context";
import { useRadialOverlay } from "../../hooks/use-radial-overlay";
import { CollectionService } from "../../services/collectionService";
import { Media } from "../../types/media";
import MediaCard from "./media-card";
import { ThemedText } from "./themed-text";

const CollectionMediaGrid = ({ mediaItems }: { mediaItems: Media[] }) => {
  const { theme } = useContext(ThemeContext);
  // Use first 3 media items, or create placeholders if not enough
  const displayMedia = mediaItems.slice(0, 3);

  return (
    <View
      style={[
        styles.mediaImages,
        {
          backgroundColor: theme.buttonBackground,
          borderColor: theme.buttonBorder,
        },
      ]}
    >
      {/* Left media card - full height */}
      <View style={styles.leftMedia}>
        {displayMedia[0] && (
          <MediaCard
            media={displayMedia[0]}
            width="100%"
            height="100%"
            style={styles.mediaCard}
            isTouchable={false}
          />
        )}
      </View>

      {/* Right media cards - stacked */}
      <View style={styles.rightMedia}>
        <View style={styles.topRightMedia}>
          {displayMedia[1] && (
            <MediaCard
              media={displayMedia[1]}
              isTouchable={false}
              width="100%"
              height="100%"
              style={styles.mediaCard}
            />
          )}
        </View>
        <View style={styles.bottomRightMedia}>
          {displayMedia[2] && (
            <MediaCard
              media={displayMedia[2]}
              isTouchable={false}
              width="100%"
              height="100%"
              style={styles.mediaCard}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const CollectionCard = ({
  id,
  mediaItems,
  isLoading = false,
  title,
  ranked = false,
  onPress,
}: {
  id: string;
  mediaItems: Media[];
  isLoading?: boolean;
  title: string;
  ranked?: boolean;
  onPress?: () => void;
}) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { showToast } = useToast();
  const cardRef = useRef<View>(null);
  const scale = useSharedValue(1);

  const content = (
    <View
      style={{
        opacity: isLoading ? 0.6 : 1,
        flexDirection: "row",
        flex: 1,
        gap: spacing.lg,
      }}
    >
      <CollectionMediaGrid mediaItems={mediaItems} />
      <View style={styles.rightContent}>
        <ThemedText variant="headline" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText variant="subhead" color="secondary">
          {mediaItems.length} items
        </ThemedText>
      </View>
    </View>
  );

  const actions = useMemo(
    () => [
      { id: "edit", icon: Edit03Icon, title: "Edit" },
      { id: "delete", icon: Delete02Icon, title: "Delete" },
      { id: "share", icon: Share08Icon, title: "Share" },
    ],
    []
  );

  const { longPressGesture, panGesture, isLongPressed, overlayOpen } =
    useRadialOverlay({
      actions,
      onSelect: async (actionId) => {
        if (actionId === "share") {
          const shareMessage = title || "Share";
          try {
            await Share.share({ message: shareMessage });
          } catch {}
        } else if (actionId === "edit") {
          router.push(`/collection/form?id=${id}`);
        } else if (actionId === "delete") {
          if (!user?.id) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(
            "Delete collection",
            "Are you sure you want to delete this collection?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await CollectionService.deleteCollection(id);
                    showToast({
                      message: `${title} deleted`,
                    });
                  } catch {
                    showToast({
                      message: "Failed to delete collection. Please try again.",
                    });
                  }
                },
              },
            ]
          );
        }
        // Reset scale when overlay closes
        runOnUI(() => {
          "worklet";
          scale.value = withSpring(1);
        })();
      },
      onCancel: () => {
        // Reset scale when overlay is cancelled/dismissed
        runOnUI(() => {
          "worklet";
          scale.value = withSpring(1);
        })();
      },
      targetRef: cardRef as React.RefObject<View>,
      renderClone: ({ x, y, width, height }) => (
        <View style={{ position: "absolute", top: y, left: x, width, height }}>
          <View
            style={[
              styles.container,
              {
                width,
                height,
                overflow: "visible",
              },
            ]}
          >
            {content}
          </View>
        </View>
      ),
    });

  const longPressWithScale = longPressGesture
    .onBegin(() => {
      "worklet";
      scale.value = withSpring(0.98);
    })
    .onFinalize(() => {
      "worklet";
      // Only reset scale if overlay didn't open (user released before long press completed)
      if (overlayOpen.value === 0) {
        scale.value = withSpring(1);
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      "worklet";
      scale.value = withSpring(0.98);
    })
    .onEnd(() => {
      "worklet";
      scale.value = withSpring(1);
      if (!isLongPressed.value && onPress) {
        runOnJS(onPress)();
      }
    })
    .onFinalize(() => {
      "worklet";
      scale.value = withSpring(1);
    });

  // Pan gesture to track finger movement during and after long press
  // Reset scale if user drags away without opening overlay
  const pan = panGesture.onFinalize(() => {
    "worklet";
    // Reset scale if overlay is not open (user dragged away without opening menu)
    if (overlayOpen.value === 0) {
      scale.value = withSpring(1);
    }
  });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(longPressWithScale, tapGesture),
    pan
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        ref={cardRef}
        style={[
          styles.container,
          {
            //   borderColor: theme.buttonBorder,
            //   backgroundColor: theme.buttonBackground,
            transform: [{ scale: scale }],
          },
        ]}
      >
        {content}
      </Animated.View>
    </GestureDetector>
  );
};

export default CollectionCard;

const styles = StyleSheet.create({
  container: {
    // borderRadius: 16,
    overflow: "hidden",
    // borderWidth: 1,
    // padding: 12,
    flexDirection: "row",
    // backgroundColor: "red",
    gap: spacing.md,
  },

  rightContent: {
    flex: 1,
    gap: spacing.xs,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  mediaImages: {
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    height: 100, // Square-ish aspect ratio
    width: 100,
    padding: spacing.sm,
    gap: spacing.xs,
  },

  leftMedia: {
    flex: 2,
    height: "100%",
  },

  rightMedia: {
    flex: 1,
    height: "100%",
    gap: spacing.xs,
  },

  topRightMedia: {
    flex: 1,
  },

  bottomRightMedia: {
    flex: 1,
  },

  mediaCard: {
    borderRadius: radius.xs,
  },

  title: {
    textAlign: "center",
  },
});
