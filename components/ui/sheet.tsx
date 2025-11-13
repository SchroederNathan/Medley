import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import React, { useContext } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import Button from "./button";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SheetProps {
  visible: boolean;
  headerVisible?: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  showCloseButton?: boolean;
  enableDragToClose?: boolean;
  cancelVisible?: boolean;
}

const Sheet = ({
  visible,
  headerVisible = true,
  onClose,
  title,
  children,
  style,
  showCloseButton = true,
  enableDragToClose = true,
  cancelVisible = false,
}: SheetProps) => {
  const { theme } = useContext(ThemeContext);
  // Dynamic modal height based on content
  const modalHeight = useSharedValue(0);
  // Cancel button height (fixed at 52px + 4px gap)
  const CANCEL_BUTTON_HEIGHT = 52;
  const BUTTON_GAP = -12;
  // When bottom is insets.bottom, the modal's bottom starts at SCREEN_HEIGHT - insets.bottom
  // To position it correctly, we need to translate it up by modalHeight when open
  // Closed position: translateY = modalHeight (modal is off-screen below)
  // Open position: translateY = 0 (modal bottom is at SCREEN_HEIGHT - insets.bottom)
  // Start off-screen until height is measured
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const [isAnimating, setIsAnimating] = React.useState(false);
  const insets = useSafeAreaInsets();
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event: any) => {
      if (!enableDragToClose) return;

      const newTranslateY = context.value.y + event.translationY;
      // Allow dragging down but prevent dragging up past 0 (fully open)
      const maxDrag = modalHeight.value + insets.bottom;
      const clampedTranslateY = Math.max(0, Math.min(maxDrag, newTranslateY));

      translateY.value = clampedTranslateY;
    })
    .onEnd((event: any) => {
      if (!enableDragToClose) return;

      const velocity = event.velocityY;
      const currentPosition = translateY.value;

      // If dragged down more than 25% of modal height or high velocity downward, close modal
      const dragDistance = currentPosition;
      const shouldClose =
        dragDistance > modalHeight.value * 0.25 || velocity > 500;

      if (shouldClose) {
        // Close modal with smooth spring animation
        // Go further than safe area to ensure it's completely hidden
        const buttonOffset = cancelVisible
          ? CANCEL_BUTTON_HEIGHT + BUTTON_GAP
          : 0;
        translateY.value = withSpring(
          modalHeight.value + buttonOffset + insets.bottom,
        );
        runOnJS(onClose)();
      } else {
        // Snap back to open position with spring
        translateY.value = withSpring(0);
      }

      // Haptic feedback
      runOnJS(Haptics.selectionAsync)();
    });

  // Handle modal visibility changes
  React.useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      // Animate in - position right above safe area (translateY = 0 means fully open)
      // If height is already measured, animate immediately
      // Otherwise, wait for onLayout to measure and animate
      if (modalHeight.value > 0) {
        translateY.value = modalHeight.value;
        translateY.value = withSpring(0);
      }
    } else {
      // Animate out with spring for natural "bouncing back down" feel
      // Go further than safe area to ensure it's completely hidden
      const buttonOffset = cancelVisible ? CANCEL_BUTTON_HEIGHT : 0;
      const closePosition =
        (modalHeight.value || SCREEN_HEIGHT) +
        buttonOffset +
        insets.bottom +
        40;
      translateY.value = withSpring(closePosition, {}, () => {
        // Animation completed, hide modal after close animation
        runOnJS(setIsAnimating)(false);
      });
    }
  }, [visible, insets.bottom, cancelVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    const maxHeight = modalHeight.value || SCREEN_HEIGHT;
    const closePosition = maxHeight + insets.bottom;
    const borderRadius = interpolate(
      translateY.value,
      [0, closePosition],
      [20, 8],
      "clamp",
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
      borderRadius: borderRadius,
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const maxHeight = modalHeight.value || SCREEN_HEIGHT;
    const closePosition = maxHeight + insets.bottom;
    const opacity = interpolate(
      translateY.value,
      [closePosition, 0],
      [0, 1],
      "clamp",
    );

    return {
      opacity,
    };
  });

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => {
    // Button should animate with the sheet
    // When sheet moves down, button moves down with it
    // Both use the same translateY to maintain consistent gap
    return {
      transform: [{ translateY: translateY.value }],
      opacity: cancelVisible ? 1 : 0,
    };
  });

  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== modalHeight.value) {
      const wasZero = modalHeight.value === 0;
      modalHeight.value = height;
      // If this is the first measurement and modal is visible, animate it in
      if (wasZero && visible) {
        translateY.value = height;
        translateY.value = withSpring(0);
      }
    }
  };

  if (!visible && !isAnimating) return null;

  return (
    <Modal
      visible={visible || isAnimating}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPressIn={onClose}
        />
      </Animated.View>

      {/* Container for sheet and cancel button in column layout */}
      <View style={styles.sheetContainer}>
        {/* Sheet */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.modal,
              animatedStyle,
              {
                borderColor: theme.buttonBorder,
                bottom: cancelVisible
                  ? insets.bottom + CANCEL_BUTTON_HEIGHT - BUTTON_GAP
                  : insets.bottom,
              },
              style,
            ]}
            onLayout={handleContentLayout}
          >
            <BlurView
              intensity={20}
              tint="default"
              style={[
                styles.blurView,
                { backgroundColor: theme.modalBackground },
              ]}
            >
              {/* Handle for visual feedback */}
              <View
                style={[styles.handle, { backgroundColor: theme.buttonBorder }]}
              />

              {/* Header */}
              {headerVisible && (
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {title}
                  </Text>
                  {showCloseButton && (
                    <TouchableOpacity
                      style={[
                        styles.closeButton,
                        { backgroundColor: theme.fabButtonBackground },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onClose();
                      }}
                    >
                      <X size={24} color={theme.secondaryText} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.contentContainer}>{children}</View>
              </View>
            </BlurView>
          </Animated.View>
        </GestureDetector>

        {/* Cancel Button - Animated at bottom with safe area */}
        {cancelVisible && (
          <Animated.View
            style={[
              styles.cancelButtonContainer,
              cancelButtonAnimatedStyle,
              { bottom: insets.bottom },
            ]}
          >
            <Button
              title="Cancel"
              onPress={onClose}
              variant="primary"
              styles={styles.cancelButton}
            />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

export default Sheet;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 0,
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "column",
  },
  modal: {
    position: "absolute",
    borderCurve: "continuous",
    bottom: 0,
    left: 8,
    right: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  blurView: {
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.semiBold,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
    borderRadius: 24,
  },
  content: {
    flexShrink: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  cancelButtonContainer: {
    position: "absolute",
    left: 8,
    right: 8,
  },
  cancelButton: {
    width: "100%",
  },
});
