import { router } from "expo-router";
import { UserRound } from "lucide-react-native";
import React, { useContext } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemeContext } from "../../contexts/theme-context";

const ProfileButton = () => {
  const { theme } = useContext(ThemeContext);

  // Create profile button component
  return (
    <TouchableOpacity
      style={[
        styles.profileButton,
        {
          backgroundColor: theme.buttonBackground,
          borderColor: theme.buttonBorder,
        },
      ]}
      onPress={() => router.push("/(profile)")}
    >
      <UserRound size={24} color={theme.text} />
    </TouchableOpacity>
  );
};

export default ProfileButton;

const styles = StyleSheet.create({
  profileButton: {
    height: 52,
    width: 52,
    borderWidth: 1,
    aspectRatio: 1,
    borderRadius: 26,

    justifyContent: "center",
    alignItems: "center",
  },
});
