import { router } from "expo-router";
import { UserRound } from "lucide-react-native";
import React, { useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Search from "../../../../components/ui/search";
import { ThemeContext } from "../../../../contexts/theme-context";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";

const IndexScreen = () => {
  const { theme } = useContext(ThemeContext);
  const userProfile = useUserProfile();
  const [query, setQuery] = useState("");

  const topPadding = useSafeAreaInsets().top;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {getTimeBasedGreeting()},{"\n"}
          {userProfile.data?.name || "User"}
        </Text>
        <TouchableOpacity
          style={[
            styles.profileButton,
            {
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            },
          ]}
          onPress={() => router.push("/profile")}
        >
          <UserRound size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      {/* Search */}
      <Search
        value={query}
        onChangeText={setQuery}
        placeholder="Search media"
        onClear={() => setQuery("")}
      />
    </View>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontFamily: fontFamily.plusJakarta.bold,
  },
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
