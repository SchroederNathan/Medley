import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../../../contexts/theme-context";
import { fontFamily } from "../../../lib/fonts";
import Button from "../button";
import Modal from "../sheet";

interface AuthSheetProps {
  visible: boolean;
  onClose: () => void;
}

const AuthSheet = ({ visible, onClose }: AuthSheetProps) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  return (
    <Modal visible={visible} onClose={onClose} title="Login or Sign Up">
      <View style={styles.container}>
        <Button
          title="Login"
          onPress={() => {
            router.push("/login");
            onClose();
          }}
          styles={{ marginBottom: 16 }}
          variant="secondary"
        />
        <Button
          title="Sign Up"
          onPress={() => {
            router.push("/signup");
            onClose();
          }}
          styles={{ marginBottom: 24 }}
        />
        <Text style={[styles.description, { color: theme.secondaryText }]}>
          Sign up or log in to create boards, find personalized recommendations
          and more.
        </Text>
      </View>
    </Modal>
  );
};

export default AuthSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  primaryButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  secondaryButton: {
    marginBottom: 24,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  footerText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.6,
  },
});
