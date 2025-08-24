import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useContext } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

interface RadioCardProps {
  title: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const RadioCard = ({
  title,
  icon,
  selected,
  onPress,
  style,
}: RadioCardProps) => {
  const { theme } = useContext(ThemeContext);

  const backgroundColor = theme.buttonBackground;
  const borderColor = selected ? theme.secondaryText : theme.buttonBorder;
  const thumbBackground = theme.fabButtonBackground;
  const thumbInner = theme.secondaryText;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.cardContainer, { borderColor }, style]}
      activeOpacity={0.9}
    >
      <BlurView
        intensity={20}
        tint="default"
        style={[styles.blurView, { backgroundColor }]}
      >
        <View style={styles.leftContent}>
          {icon}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
        <View
          style={[
            styles.radio,
            {
              backgroundColor: thumbBackground,
              borderColor: theme.buttonBorder,
            },
          ]}
        >
          <View
            style={[
              styles.radioInner,
              { backgroundColor: selected ? thumbInner : "transparent" },
            ]}
          />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

export default RadioCard;

const styles = StyleSheet.create({
  cardContainer: {
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  radio: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
