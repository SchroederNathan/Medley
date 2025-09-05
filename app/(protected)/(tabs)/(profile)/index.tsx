import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Button from "../../../../components/ui/button";
import { AuthContext } from "../../../../contexts/auth-context";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";

const ProfileScreen = () => {
  const authContext = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { data: profile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading profile</Text>
        <Button
          title="Retry"
          onPress={() => window.location.reload()} // Simple refresh for demo
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {profile && (
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: theme.text }]}>
            Welcome, {profile.name}!
          </Text>
          <Text style={[styles.preferences, { color: theme.text }]}>
            Media Preferences:{" "}
            {profile.media_preferences?.preferred_media?.join(", ") || "None"}
          </Text>
        </View>
      )}

      <Button
        title="Logout"
        onPress={() => authContext.logOut()}
        styles={styles.button}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    marginBottom: 40,
    alignItems: "center",
  },
  name: {
    fontFamily: fontFamily.plusJakarta.bold,
    fontSize: 24,
    marginBottom: 10,
  },
  preferences: {
    fontFamily: fontFamily.plusJakarta.regular,
    fontSize: 16,
    marginBottom: 5,
  },
  onboarding: {
    fontFamily: fontFamily.plusJakarta.regular,
    fontSize: 16,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: fontFamily.plusJakarta.regular,
    fontSize: 16,
    color: "red",
    marginBottom: 20,
  },
  button: {
    width: "100%",
  },
});
