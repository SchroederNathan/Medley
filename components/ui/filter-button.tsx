import React, { FC, useContext } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Filter } from "lucide-react-native";
import Animated, { useAnimatedStyle, withDelay, withTiming } from "react-native-reanimated";
import { EDIT_HOME_CONTAINER_WIDTH, useHomeAnimation } from "../../contexts/home-animation-context";
import { ThemeContext } from "../../contexts/theme-context";

type FilterButtonProps = {
  onPress?: () => void;
};

export const FilterButton: FC<FilterButtonProps> = ({ onPress }) => {
  const { offsetY, screenView } = useHomeAnimation();
  const { theme } = useContext(ThemeContext);

  // Animate opacity and blur just like Raycast's edit home button
  const rButtonStyle = useAnimatedStyle(() => {
    if (offsetY.value < 0 || screenView.value === "commands") {
      return {
        opacity: 0,
        pointerEvents: "none",
      };
    }

    return {
      opacity: withDelay(300, withTiming(1, { duration: 0 })),
      pointerEvents: "auto",
    };
  });

  const handlePress = () => {
    // Add haptic feedback or other press handling here
    onPress?.();
  };

  return (
    <Animated.View style={[styles.container, rButtonStyle]}>
      <Pressable
        onPress={handlePress}
        style={styles.pressable}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Filter size={24} color={theme.text} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: EDIT_HOME_CONTAINER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  pressable: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
});
