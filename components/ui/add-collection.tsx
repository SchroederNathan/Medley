import { Plus } from "lucide-react-native";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

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
        <Plus size={32} color={theme.text} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AddCollection;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  title: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
});
