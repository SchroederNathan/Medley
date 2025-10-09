import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import React, { useContext } from "react";
import {
  Dimensions,
  Platform,
  Modal as RNModal,
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
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
  showCloseButton?: boolean;
  enableDragToClose?: boolean;
}

// Modal height - 70% of screen height for a good default
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.64;

const Modal = ({
  visible,
  onClose,
  title,
  children,
  style,
  showCloseButton = true,
  enableDragToClose = true,
}: ModalProps) => {
  const { theme } = useContext(ThemeContext);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const [isAnimating, setIsAnimating] = React.useState(false);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event: any) => {
      if (!enableDragToClose) return;

      const newTranslateY = context.value.y + event.translationY;
      // Allow dragging down but prevent dragging up past the modal height
      const maxTranslateY = SCREEN_HEIGHT - MODAL_HEIGHT;
      const clampedTranslateY = Math.max(maxTranslateY, newTranslateY);

      translateY.value = clampedTranslateY;
    })
    .onEnd((event: any) => {
      if (!enableDragToClose) return;

      const velocity = event.velocityY;
      const currentPosition = translateY.value;

      // If dragged down more than 25% of modal height or high velocity downward, close modal
      const modalTop = SCREEN_HEIGHT - MODAL_HEIGHT;
      const dragDistance = currentPosition - modalTop;
      const shouldClose = dragDistance > MODAL_HEIGHT * 0.25 || velocity > 500;

      if (shouldClose) {
        // Close modal with smooth spring animation
        translateY.value = withSpring(SCREEN_HEIGHT);
        runOnJS(onClose)();
      } else {
        // Snap back to open position with spring
        translateY.value = withSpring(modalTop);
      }

      // Haptic feedback
      runOnJS(Haptics.selectionAsync)();
    });

  // Handle modal visibility changes
  React.useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      // Animate in
      translateY.value = withSpring(SCREEN_HEIGHT - MODAL_HEIGHT);
    } else {
      // Animate out with spring for natural "bouncing back down" feel
      translateY.value = withSpring(SCREEN_HEIGHT, {}, () => {
        // Animation completed, hide modal after close animation
        runOnJS(setIsAnimating)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [SCREEN_HEIGHT - MODAL_HEIGHT, SCREEN_HEIGHT],
      [20, 8],
      "clamp",
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      // Ensure border radius is applied to the border itself
      borderRadius: borderRadius,
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [SCREEN_HEIGHT, SCREEN_HEIGHT - MODAL_HEIGHT],
      [0, 0.5],
      "clamp",
    );

    return {
      opacity,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    height: MODAL_HEIGHT,
  }));

  if (!visible && !isAnimating) return null;

  return (
    <RNModal
      visible={visible || isAnimating}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPressIn={onClose}
        />
      </Animated.View>

      {/* Modal */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.modal,
            animatedStyle,
            { borderColor: theme.buttonBorder },
            style,
          ]}
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
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
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

            {/* Content */}
            <Animated.ScrollView
              style={[styles.content, contentStyle]}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </Animated.ScrollView>
          </BlurView>
        </Animated.View>
      </GestureDetector>
    </RNModal>
  );
};

export default Modal;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 1)",
    zIndex: 0,
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1000,
  },
  blurView: {
    flex: 1,
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
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
});
