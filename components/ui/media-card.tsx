import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  DimensionValue,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { Media } from "../../types/media";

const MediaCard = ({
  media,
  width = 150,
  height = 200,
  style,
  isTouchable = true,
}: {
  media: Media;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
  isTouchable?: boolean;
}) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const pulse = useSharedValue(0.6);
  const scale = useSharedValue(1);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (!isLoading) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [isLoading]);
  const cardContent = (
    <>
      {isLoading && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.buttonBackground },
            skeletonStyle,
          ]}
        />
      )}
      <Image
        source={{ uri: media.poster_url }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoadEnd={() => {
          setIsLoading(false);
          pulse.value = 0;
        }}
        transition={300}
      />
    </>
  );

  if (isTouchable) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            height: height,
            width: width,
            backgroundColor: theme.buttonBackground,
          },
          scaleStyle,
          style,
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push(`/media-detail?id=${media.id}`)}
          onPressIn={() => {
            scale.value = withSpring(0.95);
          }}
          onPressOut={() => {
            scale.value = withSpring(1);
          }}
          style={styles.touchableContent}
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height: height,
          width: width,
          backgroundColor: theme.buttonBackground,
        },
        style,
      ]}
    >
      {cardContent}
    </View>
  );
};

export default MediaCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  touchableContent: {
    width: "100%",
    height: "100%",
  },
});
