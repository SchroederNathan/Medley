import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "./modal";
import AuthModal from "./modals/auth-modal";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";

// Example usage of the custom Modal component
const ModalUsageExample = () => {
  const { theme } = React.useContext(ThemeContext);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isCustomModalVisible, setIsCustomModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Modal Component Examples
      </Text>

      {/* Example 1: Using the Auth Modal */}
      <TouchableOpacity
        style={[styles.button, { borderColor: theme.border }]}
        onPress={() => setIsAuthModalVisible(true)}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>
          Open Auth Modal
        </Text>
      </TouchableOpacity>

      {/* Example 2: Custom Modal with various content */}
      <TouchableOpacity
        style={[styles.button, { borderColor: theme.border }]}
        onPress={() => setIsCustomModalVisible(true)}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>
          Open Custom Modal
        </Text>
      </TouchableOpacity>

      {/* Auth Modal Example */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />

      {/* Custom Modal Example */}
      <Modal
        visible={isCustomModalVisible}
        onClose={() => setIsCustomModalVisible(false)}
        title="Custom Modal"
      >
        <View style={styles.customContent}>
          <Text style={[styles.customTitle, { color: theme.text }]}>
            Welcome to the Custom Modal!
          </Text>
          <Text style={[styles.customDescription, { color: theme.text }]}>
            This modal supports:
          </Text>
          <View style={styles.featureList}>
            <Text style={[styles.feature, { color: theme.text }]}>
              • Drag to different detent positions
            </Text>
            <Text style={[styles.feature, { color: theme.text }]}>
              • Smooth animations with spring physics
            </Text>
            <Text style={[styles.feature, { color: theme.text }]}>
              • Theme-aware styling
            </Text>
            <Text style={[styles.feature, { color: theme.text }]}>
              • iOS-style detent behavior
            </Text>
            <Text style={[styles.feature, { color: theme.text }]}>
              • Customizable detent heights
            </Text>
          </View>
          <Text style={[styles.customNote, { color: theme.text }]}>
            Try dragging the modal up and down to see the different detent positions!
          </Text>
        </View>
      </Modal>
    </View>
  );
};

export default ModalUsageExample;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.tanker.regular,
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  customContent: {
    flex: 1,
    paddingVertical: 20,
  },
  customTitle: {
    fontSize: 24,
    fontFamily: fontFamily.tanker.regular,
    textAlign: "center",
    marginBottom: 20,
  },
  customDescription: {
    fontSize: 18,
    fontFamily: fontFamily.plusJakarta.semiBold,
    textAlign: "center",
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 24,
  },
  feature: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    marginBottom: 8,
    lineHeight: 24,
  },
  customNote: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.7,
  },
});

