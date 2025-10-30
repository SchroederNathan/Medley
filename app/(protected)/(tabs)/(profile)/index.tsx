import { useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import { AnimatedProfileImage } from "../../../../components/ui/animated-profile-image";
import Button from "../../../../components/ui/button";
import { DefaultProfileImage } from "../../../../components/ui/default-profile-image";
import { SettingsIcon } from "../../../../components/ui/svg-icons";
import { ProfileImageAnimationProvider } from "../../../../contexts/profile-image-animation-context";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";

const ProfileScreen = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading, error, data: profile } = useUserProfile();
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
    <ProfileImageAnimationProvider>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Svg
          width="150%"
          height="100%"
          viewBox="0 0 500 550"
          style={styles.spotlightSvg}
        >
          <Defs>
            <Filter
              id="filter0_f_2_34"
              x="-167.2"
              y="-262.2"
              width="700.02"
              height="850.854"
              filterUnits="userSpaceOnUse"
            >
              <FeFlood floodOpacity="0" result="BackgroundImageFix" />
              <FeBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <FeGaussianBlur
                stdDeviation="61.85"
                result="effect1_foregroundBlur_2_34"
              />
            </Filter>
          </Defs>
          <Path
            d="M-43.5 -81.5L7.5 -138.5L420.12 380.955L280.62 480.954L-43.5 -81.5Z"
            fill="#D4D4D4"
            fillOpacity="0.1"
            filter="url(#filter0_f_2_34)"
          />
        </Svg>

        <View style={styles.header}>
          <Pressable
            onPress={() => router.push("/settings")}
            style={{ padding: 10, marginRight: -10 }}
          >
            <SettingsIcon size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Content */}
        <DefaultProfileImage />
        <Text style={[styles.name, { color: theme.text }]}>
          {profile?.name}
        </Text>
      </View>
      <AnimatedProfileImage />
    </ProfileImageAnimationProvider>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    marginBottom: 32,
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },

  name: {
    fontFamily: fontFamily.plusJakarta.bold,
    fontSize: 24,
    marginTop: 20,
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
