import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useContext } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "../../contexts/auth-context";
import { ThemeContext } from "../../contexts/theme-context";
import { ProfileButtonIcon } from "./svg-icons";

const ProfileButton = () => {
  const { user } = useContext(AuthContext);
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
      {user?.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
        />
      ) : (
        <ProfileButtonIcon size={24} color={theme.text} />
      )}
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
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
});
