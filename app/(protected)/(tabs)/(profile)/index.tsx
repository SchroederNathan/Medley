import ArrowUpDownIcon from "@hugeicons-pro/core-stroke-standard/ArrowUpDownIcon";
import Settings01SolidIcon from "@hugeicons-pro/core-solid-standard/Settings01Icon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  type GestureResponderEvent,
  type LayoutRectangle,
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
import AddCollection from "../../../../components/ui/add-collection";
import { AnimatedProfileImage } from "../../../../components/ui/animated-profile-image";
import Button from "../../../../components/ui/button";
import CollectionCard from "../../../../components/ui/collection-card";
import { DefaultProfileImage } from "../../../../components/ui/default-profile-image";
import MediaCard from "../../../../components/ui/media-card";
import ActionMenu from "../../../../components/ui/sheets/action-menu";
import TabPager from "../../../../components/ui/tab-pager";
import { ThemedText } from "../../../../components/ui/themed-text";
import UserReviewCard from "../../../../components/ui/user-review-card";
import { spacing, type } from "../../../../constants/theme";
import { useAuroraScroll } from "../../../../contexts/aurora-scroll-context";
import { AuthContext } from "../../../../contexts/auth-context";
import { ProfileEditModeContext } from "../../../../contexts/profile-edit-mode-context";
import { ThemeContext } from "../../../../contexts/theme-context";
import { ZoomAnimationProvider } from "../../../../contexts/zoom-animation-context";
import ProfileBlockList from "../../../../components/profile/profile-block-list";
import { useFollowCounts } from "../../../../hooks/use-follow-counts";
import { useMountAfterInteractions } from "../../../../hooks/use-mount-after-interactions";
import { useProfileLayout } from "../../../../hooks/use-profile-layout";
import { useUserCollections } from "../../../../hooks/use-user-collections";
import { useUserMedia } from "../../../../hooks/use-user-media";
import { useUserProfile } from "../../../../hooks/use-user-profile";
import { useUserReviews } from "../../../../hooks/use-user-reviews";
import { queryKeys } from "../../../../lib/query-keys";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_SPACING * 3) / 4;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
// The library grid sits below the fold on first render, so mounting a few
// rows is enough for the initial commit; the rest fills in right after the
// screen paints (see useMountAfterInteractions).
const INITIAL_LIBRARY_COUNT = 12;

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

// Short titles: TabPager disables header scrolling when centerTabs is set,
// so all four must fit on one row.
const tabs = [
  { key: "library", title: "Media" },
  { key: "reviews", title: "Reviews" },
  { key: "collections", title: "Lists" },
  { key: "ranked", title: "Ranked" },
];

const ProfileScreen = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const profileLayout = useProfileLayout();
  const [activeTab, setActiveTab] = useState<string>("library");
  // Which profile block is in inline edit mode (e.g. Favourites jiggle mode).
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  // Window frame of the editing block, reported by the block itself.
  const editingBlockFrame = useRef<LayoutRectangle | null>(null);
  const setEditingBlockFrame = useCallback((frame: LayoutRectangle | null) => {
    editingBlockFrame.current = frame;
  }, []);
  const editModeValue = useMemo(
    () => ({ editingBlockId, setEditingBlockId, setEditingBlockFrame }),
    [editingBlockId, setEditingBlockFrame]
  );
  const dismissEditMode = () => setEditingBlockId(null);

  // While a block is editing, claim (capture phase) any touch that starts
  // outside its frame, before Pressables/cards underneath can take it. The
  // claimed tap dismisses edit mode on release and never activates whatever
  // was under the finger — same as iOS home-screen jiggle mode. Scroll
  // gestures still win via responder termination, which also dismisses.
  const shouldClaimOutsideTap = (event: GestureResponderEvent) => {
    if (editingBlockId === null) return false;
    const frame = editingBlockFrame.current;
    if (!frame) return true;
    const { pageX, pageY } = event.nativeEvent;
    return !(
      pageX >= frame.x &&
      pageX <= frame.x + frame.width &&
      pageY >= frame.y &&
      pageY <= frame.y + frame.height
    );
  };
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const tabPagerContainerRef = useRef<View>(null);
  const scrollY = useSharedValue(0);
  const auroraScroll = useAuroraScroll();
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

  // With the persisted query cache, all tab data is available the moment this
  // screen mounts, which used to mount every page of the pager (all library
  // cards, reviews and collections) in one huge commit and hang navigation.
  // Instead, mount only what's visible first; fill in the rest right after
  // the first paint. A tab the user activates early always renders its
  // content immediately.
  const contentReady = useMountAfterInteractions();
  const libraryItems = useMemo(() => {
    if (!media) return [];
    return contentReady ? media : media.slice(0, INITIAL_LIBRARY_COUNT);
  }, [media, contentReady]);
  const reviewsDeferred = !contentReady && activeTab !== "reviews";
  const collectionsDeferred = !contentReady && activeTab !== "collections";
  const rankedDeferred = !contentReady && activeTab !== "ranked";

  const unrankedCollections = useMemo(
    () => (collections ?? []).filter((collection) => !collection.ranked),
    [collections]
  );
  const rankedCollections = useMemo(
    () => (collections ?? []).filter((collection) => collection.ranked),
    [collections]
  );

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
      // Lets the aurora background follow a pull past the top.
      auroraScroll?.set(event.contentOffset.y);
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
    <ProfileEditModeContext.Provider value={editModeValue}>
      <ZoomAnimationProvider>
        <View
          style={styles.container}
          onStartShouldSetResponderCapture={shouldClaimOutsideTap}
          onResponderRelease={dismissEditMode}
          onResponderTerminate={dismissEditMode}
        >
          <Animated.ScrollView
            ref={scrollViewRef}
            onScroll={scrollHandler}
            onScrollBeginDrag={dismissEditMode}
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
                  if (user?.id) {
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.favourites.root(user.id),
                    });
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.userProfile.root(user.id),
                    });
                  }
                }}
                tintColor={theme.text}
                // The scroll view runs edge to edge with no header, so the
                // spinner's default resting place is the very top of the
                // screen, hidden behind the status bar and Dynamic Island —
                // measured without this, it never becomes visible at all. The
                // content's paddingTop does not move it; this does.
                progressViewOffset={insets.top}
              />
            }
            contentContainerStyle={{
              paddingTop: insets.top + spacing.xl,
              paddingHorizontal: spacing.xl,
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
                <HugeiconsIcon
                  icon={Settings01SolidIcon}
                  size={24}
                  color={theme.text}
                />
              </Pressable>
            </View>

            <View style={styles.profileContent}>
              <DefaultProfileImage />
              <ThemedText variant="title" style={styles.name}>
                {profile?.name}
              </ThemedText>
              <View style={styles.profileInfoRow}>
                <Pressable style={styles.countContainer}>
                  <ThemedText weight="bold">
                    {followCounts?.followers ?? 0}
                  </ThemedText>
                  <ThemedText weight="medium" color="secondary">
                    Followers
                  </ThemedText>
                </Pressable>
                <View
                  style={[styles.separator, { backgroundColor: theme.border }]}
                />
                <Pressable style={styles.countContainer}>
                  <ThemedText weight="bold">
                    {followCounts?.following ?? 0}
                  </ThemedText>
                  <ThemedText weight="medium" color="secondary">
                    Following
                  </ThemedText>
                </Pressable>
              </View>

              <Button
                title="Edit Profile"
                onPress={() => router.push("/profile/customize")}
                styles={styles.editProfileButton}
              />

              {user?.id && (
                <View style={styles.blocksContainer}>
                  <ProfileBlockList
                    layout={profileLayout}
                    userId={user.id}
                    isOwnProfile={true}
                  />
                </View>
              )}
            </View>

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
                style={{ marginHorizontal: -spacing.xl }}
                centerTabs={true}
                pages={[
                  <View
                    key="library"
                    style={{ flex: 1, paddingTop: spacing.xl }}
                  >
                    {mediaLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" />
                        <Text
                          style={{
                            color: theme.secondaryText,
                            marginTop: spacing.sm,
                          }}
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
                        data={libraryItems}
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
                        <ThemedText color="secondary">
                          Nothing tracked yet
                        </ThemedText>
                      </View>
                    )}
                  </View>,
                  <View
                    key="reviews"
                    style={{ flex: 1, paddingTop: spacing.xl }}
                  >
                    {!reviewsDeferred && sortedReviews.length > 0 && (
                      <Pressable
                        onPress={() => setSortMenuVisible(true)}
                        style={styles.sortButton}
                        hitSlop={8}
                      >
                        <HugeiconsIcon
                          icon={ArrowUpDownIcon}
                          size={16}
                          color={theme.secondaryText}
                          strokeWidth={2}
                        />
                        <ThemedText
                          variant="subhead"
                          weight="medium"
                          color="secondary"
                        >
                          {sortLabels[reviewSort]}
                        </ThemedText>
                      </Pressable>
                    )}
                    {reviewsLoading || reviewsDeferred ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" />
                        <Text
                          style={{
                            color: theme.secondaryText,
                            marginTop: spacing.sm,
                          }}
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
                        <ThemedText color="secondary">
                          No reviews yet
                        </ThemedText>
                      </View>
                    )}
                  </View>,
                  <View
                    key="collections"
                    style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.lg }}
                  >
                    {collectionsLoading || collectionsDeferred ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" />
                        <Text
                          style={{
                            color: theme.secondaryText,
                            marginTop: spacing.sm,
                          }}
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
                    ) : (
                      <>
                        <AddCollection
                          title="Add Collection"
                          onPress={() => {
                            router.push("/collection/form");
                          }}
                        />
                        {unrankedCollections.length > 0 ? (
                          unrankedCollections.map((collection) => (
                            <CollectionCard
                              key={collection.id}
                              id={collection.id}
                              title={collection.name}
                              ranked={false}
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
                            <ThemedText color="secondary">
                              No collections yet
                            </ThemedText>
                          </View>
                        )}
                      </>
                    )}
                  </View>,
                  <View
                    key="ranked"
                    style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.lg }}
                  >
                    {collectionsLoading || rankedDeferred ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" />
                        <Text
                          style={{
                            color: theme.secondaryText,
                            marginTop: spacing.sm,
                          }}
                        >
                          Loading rankings...
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
                          Failed to load rankings
                        </Text>
                      </View>
                    ) : (
                      <>
                        <AddCollection
                          title="Add Ranking"
                          onPress={() => {
                            router.push("/collection/form");
                          }}
                        />
                        {rankedCollections.length > 0 ? (
                          rankedCollections.map((collection) => (
                            <CollectionCard
                              key={collection.id}
                              id={collection.id}
                              title={collection.name}
                              ranked={true}
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
                            <ThemedText color="secondary">
                              No ranked collections yet
                            </ThemedText>
                          </View>
                        )}
                      </>
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
    </ProfileEditModeContext.Provider>
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
  container: {
    flex: 1,
  },

  name: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  errorText: {
    ...type.body,
    color: "red",
    marginBottom: spacing.xl,
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
    gap: spacing.xs,
  },
  separator: {
    width: 1,
    height: 30,
  },
  editProfileButton: {
    marginTop: spacing.xxl,
  },
  blocksContainer: {
    width: "100%",
    marginTop: spacing.xxxl,
  },
  profileContent: {
    width: "100%",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.huge,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.huge,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.huge,
  },
  reviewCardContainer: {
    marginBottom: spacing.xxxl,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginRight: spacing.huge,
    marginBottom: spacing.lg,
  },
});
