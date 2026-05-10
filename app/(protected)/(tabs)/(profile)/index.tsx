import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ArrowUpDown } from "lucide-react-native";
import React, { useContext, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
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
import CollectionCard from "../../../../components/ui/collection-card";
import { DefaultProfileImage } from "../../../../components/ui/default-profile-image";
import MediaCard from "../../../../components/ui/media-card";
import ActionMenu from "../../../../components/ui/sheets/action-menu";
import { SettingsIcon } from "../../../../components/ui/svg-icons";
import TabPager from "../../../../components/ui/tab-pager";
import UserReviewCard from "../../../../components/ui/user-review-card";
import { AuthContext } from "../../../../contexts/auth-context";
import { ThemeContext } from "../../../../contexts/theme-context";
import { ZoomAnimationProvider } from "../../../../contexts/zoom-animation-context";
import { useFollowCounts } from "../../../../hooks/use-follow-counts";
import { useUserCollections } from "../../../../hooks/use-user-collections";
import { useUserMedia } from "../../../../hooks/use-user-media";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { useUserReviews } from "../../../../hooks/use-user-reviews";
import { fontFamily } from "../../../../lib/fonts";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_SPACING * 3) / 4;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

type ReviewSort = "recent" | "oldest" | "rating-desc" | "rating-asc";

const sortLabels: Record<ReviewSort, string> = {
  recent: "Most Recent",
  oldest: "Oldest",
  "rating-desc": "Highest Rated",
  "rating-asc": "Lowest Rated",
};

// Helper function to format review date
const formatReviewDate = (dateString: string): string => {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  const year = date.getFullYear();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();

  // Include year only if it's not the current year
  if (year === currentYear) {
    return `${month} ${day}`;
  } else {
    return `${month} ${day}, ${year}`;
  }
};

const tabs = [
  { key: "library", title: "Library" },
  { key: "reviews", title: "Reviews" },
  { key: "collections", title: "Collections" },
];

const ProfileScreen = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<string>("library");
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const tabPagerContainerRef = useRef<View>(null);
  const scrollY = useSharedValue(0);
  const [tabPagerHeaderY, setTabPagerHeaderY] = useState(0);

  const { isLoading, error, data: profile } = useUserProfile();
  const {
    data: reviews,
    isLoading: reviewsLoading,
    isFetching: reviewsFetching,
    error: reviewsError,
    refetch: refetchReviews,
  } = useUserReviews();
  const {
    data: collections,
    isLoading: collectionsLoading,
    isFetching: collectionsFetching,
    error: collectionsError,
    refetch: refetchCollections,
  } = useUserCollections();
  const {
    data: media,
    isLoading: mediaLoading,
    isRefetching: mediaFetching,
    isError: mediaError,
    refetch: refetchMedia,
  } = useUserMedia();
  const { data: followCounts } = useFollowCounts(user?.id);

  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    const copy = [...reviews];
    switch (reviewSort) {
      case "recent":
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return copy.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "rating-desc":
        return copy.sort((a, b) => b.rating - a.rating);
      case "rating-asc":
        return copy.sort((a, b) => a.rating - b.rating);
    }
  }, [reviews, reviewSort]);

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
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={
                reviewsFetching || collectionsFetching || mediaFetching
              }
              onRefresh={() => {
                refetchReviews();
                refetchCollections();
                refetchMedia();
              }}
              tintColor={theme.text}
            />
          }
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
              <Text style={[styles.count, { color: theme.text }]}>
                {followCounts?.followers ?? 0}
              </Text>
              <Text style={[styles.countLabel, { color: theme.secondaryText }]}>
                Followers
              </Text>
            </Pressable>
            <View
              style={[styles.separator, { backgroundColor: theme.border }]}
            />
            <Pressable style={styles.countContainer}>
              <Text style={[styles.count, { color: theme.text }]}>
                {followCounts?.following ?? 0}
              </Text>
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
                <View key="library" style={{ flex: 1, paddingTop: 20 }}>
                  {mediaLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" />
                      <Text
                        style={{ color: theme.secondaryText, marginTop: 8 }}
                      >
                        Loading library...
                      </Text>
                    </View>
                  ) : mediaError ? (
                    <View style={styles.errorContainer}>
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        Failed to load library
                      </Text>
                    </View>
                  ) : media && media.length > 0 ? (
                    <FlashList
                      data={media}
                      renderItem={({ item }) => (
                        <MediaCard
                          media={item}
                          width={CARD_WIDTH}
                          height={CARD_HEIGHT}
                          rating={item.user_rating ?? undefined}
                        />
                      )}
                      masonry
                      numColumns={4}
                      keyExtractor={(item) => item.id}
                      ItemSeparatorComponent={() => (
                        <View style={{ height: CARD_SPACING }} />
                      )}
                      contentContainerStyle={{
                        paddingTop: 0,
                        marginRight: 28,
                        paddingBottom: 100,
                      }}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        Nothing tracked yet
                      </Text>
                    </View>
                  )}
                </View>,
                <View key="reviews" style={{ flex: 1, paddingTop: 20 }}>
                  {sortedReviews.length > 0 && (
                    <Pressable
                      onPress={() => setSortMenuVisible(true)}
                      style={styles.sortButton}
                      hitSlop={8}
                    >
                      <ArrowUpDown size={16} color={theme.secondaryText} />
                      <Text
                        style={[
                          styles.sortLabel,
                          { color: theme.secondaryText },
                        ]}
                      >
                        {sortLabels[reviewSort]}
                      </Text>
                    </Pressable>
                  )}
                  {reviewsLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" />
                      <Text
                        style={{ color: theme.secondaryText, marginTop: 8 }}
                      >
                        Loading reviews...
                      </Text>
                    </View>
                  ) : reviewsError ? (
                    <View style={styles.errorContainer}>
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        Failed to load reviews
                      </Text>
                    </View>
                  ) : sortedReviews.length > 0 ? (
                    sortedReviews.map((review, index) => (
                      <View
                        key={review.id}
                        style={
                          index < sortedReviews.length - 1
                            ? styles.reviewCardContainer
                            : undefined
                        }
                      >
                        <UserReviewCard
                          title={review.media.title}
                          posterUrl={review.media.poster_url}
                          review={review.review}
                          rating={review.rating}
                          mediaId={review.media.id}
                          createdAt={formatReviewDate(review.createdAt)}
                        />
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        No reviews yet
                      </Text>
                    </View>
                  )}
                </View>,
                <View
                  key="collections"
                  style={{ flex: 1, paddingTop: 20, gap: 16 }}
                >
                  {collectionsLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" />
                      <Text
                        style={{ color: theme.secondaryText, marginTop: 8 }}
                      >
                        Loading collections...
                      </Text>
                    </View>
                  ) : collectionsError ? (
                    <View style={styles.errorContainer}>
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        Failed to load collections
                      </Text>
                    </View>
                  ) : collections && collections.length > 0 ? (
                    collections.map((collection) => (
                      <CollectionCard
                        key={collection.id}
                        id={collection.id}
                        title={collection.name}
                        ranked={collection.ranked}
                        mediaItems={
                          collection.collection_items
                            ?.sort((a, b) => a.position - b.position)
                            .map((item) => item.media) ?? []
                        }
                        onPress={() => {
                          router.push(`/collection/${collection.id}`);
                        }}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.secondaryText },
                        ]}
                      >
                        No collections yet
                      </Text>
                    </View>
                  )}
                </View>,
              ]}
            />
          </View>
        </Animated.ScrollView>
      </View>
      <AnimatedProfileImage />
      <ActionMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        actions={(
          ["recent", "oldest", "rating-desc", "rating-asc"] as ReviewSort[]
        ).map((key) => ({
          title: sortLabels[key],
          icon: null,
          onPress: () => {
            setReviewSort(key);
            setSortMenuVisible(false);
          },
        }))}
      />
    </ZoomAnimationProvider>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
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
    top: -1600,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
  container: {
    flex: 1,
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: fontFamily.plusJakarta.regular,
    fontSize: 16,
  },
  reviewCardContainer: {
    marginBottom: 32,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginRight: 40,
    marginBottom: 16,
  },
  sortLabel: {
    fontFamily: fontFamily.plusJakarta.medium,
    fontSize: 14,
  },
});
