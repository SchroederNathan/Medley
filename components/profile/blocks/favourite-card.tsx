import { X } from "lucide-react-native";
import React, { useContext, useEffect, useMemo } from "react";
import { DimensionValue, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { ThemeContext } from "../../../contexts/theme-context";
import { Media } from "../../../types/media";
import MediaCard from "../../ui/media-card";

// ~1.4 degrees in radians -- subtle, iOS-home-screen style wobble.
const JIGGLE_ANGLE = 0.024;

type FavouriteCardProps = {
  media: Media;
  /** Width of the card wrapper. `"100%"` lets it fill a sortable grid cell. */
  width: DimensionValue;
  height: number;
  isEditing: boolean;
  rating?: number;
  /** Tap handler: opens the detail (normal) or the replace flow (editing). */
  onPress?: () => void;
  /** Removes this card from favourites (editing only). */
  onRemove?: () => void;
};

/**
 * A favourite poster rendered as a sortable grid item.
 *
 * Always wraps the poster in `Sortable.Touchable` so taps coexist with the
 * grid's drag gesture in both modes. In edit mode it wobbles and shows a delete
 * badge; the drag itself is owned by the grid.
 */
const FavouriteCard = ({
  media,
  width,
  height,
  isEditing,
  rating,
  onPress,
  onRemove,
}: FavouriteCardProps) => {
  const { theme } = useContext(ThemeContext);
  const rotation = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  // Tilt direction is derived from the (stable) media id, not the row index, so
  // reordering -- which changes a card's index but not its id -- never restarts
  // or interrupts the wobble.
  const direction = useMemo(
    () => (media.id.charCodeAt(0) % 2 === 0 ? 1 : -1),
    [media.id]
  );

  // Each branch replaces the running animation by assigning a new one, which
  // cancels the old one atomically on the UI thread. Never cancelAnimation()
  // before the assignment: the cancel is async (a scheduled self-assign) and
  // can land after the new animation has started, killing it and leaving the
  // card frozen mid-wobble.
  useEffect(() => {
    if (!isEditing || reducedMotion) {
      rotation.value = withTiming(0, { duration: 150 });
      return;
    }
    rotation.value = withSequence(
      withTiming(-JIGGLE_ANGLE * direction, {
        duration: 70,
        easing: Easing.inOut(Easing.ease),
      }),
      withRepeat(
        withTiming(JIGGLE_ANGLE * direction, {
          duration: 140,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, [isEditing, reducedMotion, direction, rotation]);

  // Unmount-only: stop an infinite wobble that would otherwise keep ticking on
  // the UI thread after the card is gone. Safe here because no replacement
  // animation follows the cancel.
  useEffect(() => () => cancelAnimation(rotation), [rotation]);

  const jiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}rad` }],
  }));

  return (
    <Animated.View style={[{ width }, jiggleStyle]}>
      <Sortable.Touchable onTap={onPress}>
        <MediaCard
          media={media}
          width="100%"
          height={height}
          isTouchable={false}
          rating={rating}
        />
      </Sortable.Touchable>

      {isEditing && onRemove ? (
        // RNGH-based so it shares the grid's gesture system (rather than mixing
        // an RN Pressable into the gesture tree); rendered last so taps on the
        // corner resolve to the badge, not the poster underneath.
        <Sortable.Touchable
          onTap={onRemove}
          hitSlop={10}
          style={[
            styles.deleteBadge,
            { backgroundColor: theme.text, borderColor: theme.background },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${media.title ?? "favourite"} from favourites`}
        >
          <X size={13} color={theme.background} strokeWidth={3} />
        </Sortable.Touchable>
      ) : null}
    </Animated.View>
  );
};

export default FavouriteCard;

const styles = StyleSheet.create({
  deleteBadge: {
    position: "absolute",
    top: -7,
    left: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
