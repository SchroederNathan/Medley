import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
}

const ModalHeader = ({ title, onClose }: ModalHeaderProps) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  return (
    <View style={[styles.container]}>
      <TouchableOpacity
        onPress={() => onClose?.() || router.back()}
        style={styles.closeButton}
      >
        <Text style={[styles.closeButtonText, { color: theme.text }]}>
          Cancel
        </Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
};

export default ModalHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
    textAlign: "center",
    position: "absolute",
    left: 0,
    right: 0,
  },
  closeButton: {
    marginBottom: -2,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    fontSize: 14,
  },
});
