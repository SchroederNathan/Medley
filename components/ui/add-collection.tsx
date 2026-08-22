import PlusSignIcon from "@hugeicons-pro/core-stroke-standard/PlusSignIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useContext } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { spacing } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { ThemedText } from "./themed-text";

const AddCollection = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[
          styles.addBox,
          {
            backgroundColor: theme.buttonBackground,
            borderColor: theme.buttonBorder,
          },
        ]}
      >
        <HugeiconsIcon
          icon={PlusSignIcon}
          size={32}
          color={theme.text}
          strokeWidth={2}
        />
      </View>
      <ThemedText variant="headline">{title}</ThemedText>
    </TouchableOpacity>
  );
};

export default AddCollection;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: 10,
  },
  addBox: {
    height: 100,
    width: 100,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
