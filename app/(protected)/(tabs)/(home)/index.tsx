import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { UserRound } from "lucide-react-native";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Carousel from "../../../../components/ui/carousel";
import MediaCard from "../../../../components/ui/media-card";
import Search from "../../../../components/ui/search";
import { ThemeContext } from "../../../../contexts/theme-context";
import { usePreferredMedia } from "../../../../hooks/use-preferred-media";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";

const IndexScreen = () => {
  const { theme } = useContext(ThemeContext);
  const userProfile = useUserProfile();
  const [query, setQuery] = useState("");
  const mediaQuery = usePreferredMedia(query);
  const topPadding = useSafeAreaInsets().top;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            onPress={() => router.push("/(profile)")}
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
        {query.length > 0 ? (
          <>
            {/* Search Results */}
            <View style={{ marginTop: 16, flex: 1 }}>
              {mediaQuery.isLoading ? (
                <ActivityIndicator />
              ) : mediaQuery.isError ? (
                <Text style={{ color: theme.text }}>Failed to load media</Text>
              ) : (
                <FlashList
                  data={mediaQuery.data}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <View
                      style={[
                        // Horizontal gap for the column
                        index % 2 ? { paddingLeft: 6 } : { paddingRight: 6 },
                        { flex: 1 },
                      ]}
                    >
                      <MediaCard
                        media={item}
                        width={"100%"}
                        height={"auto"}
                        style={{ aspectRatio: 3 / 4, marginBottom: 12 }}
                      />
                    </View>
                  )}
                  numColumns={2}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </>
        ) : (
          <Carousel
            style={{ marginTop: 16 }}
            media={mediaQuery.data ?? []}
            title="All Preferred Media"
          />
        )}
      </View>
    </TouchableWithoutFeedback>
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
});
