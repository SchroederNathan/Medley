import { useRouter } from "expo-router";
import React, { useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
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
import TabPager from "../../../../components/ui/tab-pager";
import { ThemeContext } from "../../../../contexts/theme-context";
import { ZoomAnimationProvider } from "../../../../contexts/zoom-animation-context";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { fontFamily } from "../../../../lib/fonts";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const tabs = [
  { key: "reviews", title: "Reviews" },
  { key: "collections", title: "Collections" },
];

const ProfileScreen = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>("reviews");
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const tabPagerContainerRef = useRef<View>(null);
  const scrollY = useSharedValue(0);
  const [tabPagerHeaderY, setTabPagerHeaderY] = useState(0);

  const { isLoading, error, data: profile } = useUserProfile();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const measureTabPagerPosition = () => {
    if (tabPagerContainerRef.current && scrollViewRef.current) {
      tabPagerContainerRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          // y is relative to the ScrollView content, which is what we need
          setTabPagerHeaderY(y);
        },
        () => {
          // Fallback to measureInWindow if measureLayout fails
          tabPagerContainerRef.current?.measureInWindow(
            (x, y, width, height) => {
              // Convert window coordinates to scroll content coordinates
              // We need to account for the scroll position and padding
              const scrollContentY = y - insets.top - 20; // Subtract paddingTop
              setTabPagerHeaderY(scrollContentY);
            }
          );
        }
      );
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Measure position and scroll
    if (tabPagerContainerRef.current) {
      tabPagerContainerRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          // y is already relative to ScrollView content
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: Math.max(0, y - insets.top),
              animated: true,
            });
          }
        },
        () => {
          // Fallback
          measureTabPagerPosition();
          setTimeout(() => {
            if (scrollViewRef.current && tabPagerHeaderY > 0) {
              scrollViewRef.current.scrollTo({
                y: Math.max(0, tabPagerHeaderY - insets.top),
                animated: true,
              });
            }
          }, 50);
        }
      );
    }
  };
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
    <ZoomAnimationProvider>
      <View style={styles.container}>
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

        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            alignItems: "center",
            paddingBottom: 100,
            // Ensure minimum height to allow scrolling even with minimal content
            // Calculate: TabPager position + screen height - safe area top
            // This ensures we can scroll TabPager to top but never past it
            minHeight:
              tabPagerHeaderY > 0
                ? tabPagerHeaderY + SCREEN_HEIGHT - insets.top
                : SCREEN_HEIGHT * 2,
          }}
        >
          <View style={[styles.header, { top: insets.top + 20 }]}>
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
          <View style={styles.profileInfoRow}>
            <Pressable style={styles.countContainer}>
              <Text style={[styles.count, { color: theme.text }]}>0</Text>
              <Text style={[styles.countLabel, { color: theme.secondaryText }]}>
                Followers
              </Text>
            </Pressable>
            <View
              style={[styles.separator, { backgroundColor: theme.border }]}
            />
            <Pressable style={styles.countContainer}>
              <Text style={[styles.count, { color: theme.text }]}>7</Text>
              <Text style={[styles.countLabel, { color: theme.secondaryText }]}>
                Following
              </Text>
            </Pressable>
          </View>

          <Button
            title="Edit Profile"
            onPress={() => {}}
            styles={styles.editProfileButton}
          />

          <View
            ref={tabPagerContainerRef}
            style={{
              flex: 1,
              width: "100%",
              marginTop: insets.top < 20 ? 52 : insets.top, // gives proper margin between follower/following count row and tab pager
            }}
            onLayout={() => {
              // Measure position after layout
              measureTabPagerPosition();
            }}
          >
            <TabPager
              tabs={tabs}
              selectedKey={activeTab}
              onChange={handleTabChange}
              style={{ marginHorizontal: -20 }}
              centerTabs={true}
              pages={[
                <View key="reviews" style={{ flex: 1 }}></View>,
                <View key="collections" style={{ flex: 1 }}></View>,
              ]}
            />
          </View>
        </Animated.ScrollView>
      </View>
      <AnimatedProfileImage />
    </ZoomAnimationProvider>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    position: "absolute",
    right: 20,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    // marginBottom: 32,
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
    marginBottom: 24,
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
  profileInfoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  countContainer: {
    width: 100,
    alignItems: "center",
    gap: 4,
  },
  count: {
    fontFamily: fontFamily.plusJakarta.bold,
    fontSize: 16,
  },
  countLabel: {
    fontFamily: fontFamily.plusJakarta.medium,
    fontSize: 16,
  },
  separator: {
    width: 1,
    height: 30,
  },
  editProfileButton: {
    marginTop: 24,
  },
});
