import React, { useContext, useMemo, useRef } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Share2, Pencil, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ThemeContext } from "../../contexts/theme-context";
import { AuthContext } from "../../contexts/auth-context";
import { fontFamily } from "../../lib/fonts";
import { Media } from "../../types/media";
import MediaCard from "./media-card";
import { useRadialOverlay } from "../../hooks/use-radial-overlay";
import { CollectionService } from "../../services/collectionService";

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
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const cardRef = useRef<View>(null);
  const scale = useSharedValue(1);

  const content = (
    <View
      style={{
        opacity: isLoading ? 0.6 : 1,
        flexDirection: "row",
        flex: 1,
        gap: 16,
      }}
    >
      <CollectionMediaGrid mediaItems={mediaItems} />
      <View style={styles.rightContent}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          {mediaItems.length} items
        </Text>
      </View>
    </View>
  );

  const actions = useMemo(
    () => [
      { id: "edit", icon: Pencil },
      { id: "delete", icon: Trash2 },
      { id: "share", icon: Share2 },
    ],
    [],
  );

  const { longPressGesture, panGesture, isLongPressed } = useRadialOverlay({
    actions,
    onSelect: async (actionId) => {
      if (actionId === "share") {
        try {
          await Share.share({ message: title || "Share" });
        } catch {}
      } else if (actionId === "edit") {
        router.push(`/collection/${id}`);
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
                  await CollectionService.deleteCollection(id, user?.id || "");
                } catch {}
              },
            },
          ],
        );
      }
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
      scale.value = withSpring(0.97);
    })
    .onFinalize(() => {
      "worklet";
      scale.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      "worklet";
      scale.value = withSpring(0.97);
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

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(longPressWithScale, tapGesture),
    panGesture,
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
    gap: 12,
  },

  rightContent: {
    flex: 1,
    gap: 4,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  mediaImages: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 100, // Square-ish aspect ratio
    width: 100,
    padding: 8,
    gap: 4,
  },

  leftMedia: {
    flex: 2,
    height: "100%",
  },

  rightMedia: {
    flex: 1,
    height: "100%",
    gap: 4,
  },

  topRightMedia: {
    flex: 1,
  },

  bottomRightMedia: {
    flex: 1,
  },

  mediaCard: {
    borderRadius: 4,
  },

  title: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },

  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 4,
  },
});
