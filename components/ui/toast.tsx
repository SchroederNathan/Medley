import { useSegments } from "expo-router";
import { Check, X } from "lucide-react-native";
import React, { useCallback, useContext, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface ToastProps {
  message: string;
  actionText?: string;
  onActionPress?: () => void;
  onClose: () => void;
  visible: boolean;
  hasTabBar?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  actionText,
  onActionPress,
  onClose,
  visible,
  hasTabBar: hasTabBarProp,
}) => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const translateY = useSharedValue(200);
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  // Auto-detect if we're on a tab screen by checking route segments
  // Tab screens will have segments like: ["(protected)", "(tabs)", "(home)"]
  const isTabScreen =
    segments.includes("(tabs)") &&
    (segments.includes("(home)") ||
      segments.includes("(social)") ||
      segments.includes("(match)") ||
      segments.includes("(library)") ||
      segments.includes("(profile)"));

  // Use provided value or auto-detect
  const hasTabBar = hasTabBarProp !== undefined ? hasTabBarProp : isTabScreen;

  console.log(
    "Toast - segments:",
    segments,
    "isTabScreen:",
    isTabScreen,
    "hasTabBar:",
    hasTabBar,
  );

  // Calculate bottom position based on tab bar presence
  const bottomOffset = hasTabBar ? 100 : insets.bottom;

  const handleClose = useCallback(() => {
    translateY.value = withTiming(200, { duration: 250 });
    scale.value = withTiming(0.7, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => {
      onClose();
    }, 250);
  }, [translateY, scale, opacity, onClose]);

  useEffect(() => {
    if (visible) {
      // Animate in
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 200 });

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      // Animate out
      translateY.value = withTiming(200, { duration: 250 });
      scale.value = withTiming(0.7, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible, handleClose, translateY, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          backgroundColor: theme.text,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Check size={20} color={theme.background} strokeWidth={3} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: theme.background }]}>
            {message}
          </Text>
        </View>
        {actionText && onActionPress && (
          <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: theme.background }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={20} color={theme.background} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 16,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.semiBold,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.semiBold,
    textTransform: "uppercase",
  },
  closeButton: {
    padding: 4,
  },
});
