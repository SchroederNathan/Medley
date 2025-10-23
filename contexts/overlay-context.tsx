import { BlurView } from "expo-blur";
import React, { createContext, useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type OverlayContextType = {
  showOverlay: (content?: React.ReactNode) => void;
  hideOverlay: () => void;
};

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const blurIntensity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(1);
  const contentRotation = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);
  const [overlayContent, setOverlayContent] = useState<React.ReactNode>(null);

  const showOverlay = (content?: React.ReactNode) => {
    setOverlayContent(content || null);
    setIsVisible(true);
    overlayOpacity.value = withTiming(1, { duration: 300 });
    blurIntensity.value = withTiming(100, { duration: 300 });

    // Animate content scale and rotation
    if (content) {
      contentScale.value = withTiming(1.1, { duration: 300 });
      contentRotation.value = withTiming(Math.random() * 6 - 3, {
        duration: 300,
      });
    }
  };

  const hideOverlay = () => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    blurIntensity.value = withTiming(0, { duration: 200 });
    contentScale.value = withTiming(1, { duration: 200 });
    contentRotation.value = withTiming(0, { duration: 200 });
    // Delay hiding the overlay to allow animation to complete
    setTimeout(() => {
      setIsVisible(false);
      setOverlayContent(null);
    }, 200);
  };

  const blurAnimatedProps = useAnimatedProps(() => {
    return {
      intensity: blurIntensity.value,
    };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [
      { scale: contentScale.value },
      { rotate: `${contentRotation.value}deg` },
    ],
  }));

  return (
    <OverlayContext.Provider value={{ showOverlay, hideOverlay }}>
      {children}
      {isVisible && (
        <>
          {/* Blur overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.overlay,
              overlayStyle,
            ]}
            pointerEvents="none"
          >
            <AnimatedBlurView
              tint="dark"
              style={StyleSheet.absoluteFill}
              animatedProps={blurAnimatedProps}
              experimentalBlurMethod="dimezisBlurView"
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0, 0, 0, 0.7)" },
              ]}
            />
          </Animated.View>
          {/* Content rendered above the blur */}
          {overlayContent && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.contentOverlay,
                contentStyle,
              ]}
              pointerEvents="auto"
            >
              {overlayContent}
            </Animated.View>
          )}
        </>
      )}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9998,
  },
  contentOverlay: {
    zIndex: 9999,
  },
});
