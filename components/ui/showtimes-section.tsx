import ArrowDown01Icon from "@hugeicons-pro/core-stroke-standard/ArrowDown01Icon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { radius, spacing } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { useShowtimesForMovie } from "../../hooks/use-showtimes";
import { fontFamily } from "../../lib/fonts";
import { ShowtimeEntry } from "../../services/showtimesService";
import { Media } from "../../types/media";
import { ThemedText } from "./themed-text";

type ShowtimesSectionProps = {
  media: Media;
};

type TheaterGroup = {
  theaterId: string;
  theaterName: string;
  distance: number | null;
  times: ShowtimeEntry[];
};

type DateTab = {
  key: string;
  weekday: string;
  dayNumber: string;
};

type TabLayout = {
  x: number;
  width: number;
};

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function todayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function buildNextSevenDates(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysYmd(start, i));
}

function msUntilNextLocalMidnight(): number {
  const next = new Date();
  next.setHours(24, 0, 1, 0);
  return Math.max(1000, next.getTime() - Date.now());
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function weekdayLabel(ymd: string, index: number): string {
  if (index === 0) return "Today";
  try {
    return weekdayFormatter.format(parseYmd(ymd));
  } catch {
    return "";
  }
}

function dayNum(ymd: string): string {
  return String(parseYmd(ymd).getDate());
}

function formatTime(dateTime: string): string {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) return dateTime;

  try {
    return timeFormatter.format(parsed);
  } catch {
    return dateTime;
  }
}

function groupByTheater(showtimes: ShowtimeEntry[]): TheaterGroup[] {
  const map = new Map<string, TheaterGroup>();
  for (const s of showtimes) {
    const existing = map.get(s.theaterId);
    if (existing) {
      existing.times.push(s);
    } else {
      map.set(s.theaterId, {
        distance: s.distance,
        theaterId: s.theaterId,
        theaterName: s.theaterName,
        times: [s],
      });
    }
  }
  for (const group of map.values()) {
    group.times.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }
  // Sort theaters by distance (closest first); theaters without a known
  // distance fall to the bottom and are alphabetized among themselves.
  return Array.from(map.values()).sort((a, b) => {
    if (a.distance == null && b.distance == null)
      return a.theaterName.localeCompare(b.theaterName);
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });
}

type TheaterAccordionItemProps = {
  theater: TheaterGroup;
  expanded: boolean;
  onToggle: () => void;
  themeStyles: ReturnType<typeof createThemeStyles>;
};

const TheaterAccordionItem: React.FC<TheaterAccordionItemProps> = ({
  theater,
  expanded,
  onToggle,
  themeStyles,
}) => {
  return (
    <View style={styles.theaterCard}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.theaterHeader,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[styles.theaterName, themeStyles.primaryText]}
          numberOfLines={1}
        >
          {theater.theaterName}
        </Text>
        <View
          style={expanded ? styles.chevronExpanded : styles.chevronCollapsed}
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={18}
            color={themeStyles.secondaryText.color}
            strokeWidth={2}
          />
        </View>
      </Pressable>
      {expanded ? (
        <View style={[styles.chipRow, styles.chipRowExpanded]}>
          {theater.times.map((time) => (
            <View
              key={`${theater.theaterId}-${time.dateTime}-${time.bargain ? "b" : "n"}`}
              style={[styles.timeChip, themeStyles.timeChip]}
            >
              <ThemedText variant="footnote" weight="medium">
                {formatTime(time.dateTime)}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

function createThemeStyles(theme: {
  background?: string;
  card: string;
  border: string;
  text: string;
  secondaryText: string;
}) {
  return {
    chipSelectedDayText: {
      color: theme.text,
    },
    chipUnselectedDayText: {
      color: theme.text,
    },
    pill: {
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    primaryText: {
      color: theme.text,
    },
    secondaryText: {
      color: theme.secondaryText,
    },
    tabIndicator: {
      backgroundColor: theme.text,
    },
    timeChip: {
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
  };
}

export const ShowtimesSection: React.FC<ShowtimesSectionProps> = ({
  media,
}) => {
  const { theme } = useContext(ThemeContext);
  const themeStyles = useMemo(() => createThemeStyles(theme), [theme]);
  const [todayYmd, setTodayYmd] = useState(() => todayLocalDate());
  const dateOptions = useMemo(() => buildNextSevenDates(todayYmd), [todayYmd]);
  const [selectedDate, setSelectedDate] = useState(() => dateOptions[0] ?? "");

  const dateTabs = useMemo<DateTab[]>(
    () =>
      dateOptions.map((ymd, index) => ({
        dayNumber: dayNum(ymd),
        key: ymd,
        weekday: weekdayLabel(ymd, index),
      })),
    [dateOptions]
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = () => {
      timeoutId = setTimeout(() => {
        setTodayYmd(todayLocalDate());
        scheduleRefresh();
      }, msUntilNextLocalMidnight());
    };

    scheduleRefresh();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
  const activeDate =
    selectedDate && dateOptions.includes(selectedDate)
      ? selectedDate
      : (dateOptions[0] ?? "");

  const { movie, locationStatus, requestLocation, query } =
    useShowtimesForMovie(media, activeDate);

  const theaters = useMemo(
    () => (movie ? groupByTheater(movie.showtimes) : []),
    [movie]
  );

  const [theaterOverrides, setTheaterOverrides] = useState<
    Record<string, boolean | undefined>
  >(() => ({}));
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>(
    () => ({})
  );
  const activeTabLayout = tabLayouts[activeDate];

  const indicatorStyle = useAnimatedStyle(() => ({
    left: withTiming(activeTabLayout?.x ?? 0, { duration: 220 }),
    opacity: withTiming(activeTabLayout ? 1 : 0, { duration: 180 }),
    width: withTiming(activeTabLayout?.width ?? 0, { duration: 220 }),
  }));

  const toggleTheater = (theaterId: string) => {
    setTheaterOverrides((prev) => {
      const defaultExpanded = theaters
        .slice(0, 3)
        .some((theater) => theater.theaterId === theaterId);
      return {
        ...prev,
        [theaterId]: !(prev[theaterId] ?? defaultExpanded),
      };
    });
  };

  const needsLocationPrompt =
    (locationStatus === "undetermined" ||
      locationStatus === "denied" ||
      locationStatus === "unavailable") &&
    !movie &&
    !query.data;

  if (needsLocationPrompt) {
    const pillCopy =
      locationStatus === "undetermined"
        ? "Enable location to see showtimes"
        : locationStatus === "denied"
          ? "Location denied — open Settings to enable"
          : "Turn on Location Services for showtimes";
    const onPillPress = () => {
      Haptics.selectionAsync();
      if (locationStatus === "undetermined") {
        requestLocation();
      } else {
        Linking.openSettings();
      }
    };

    return (
      <View style={styles.container}>
        <Pressable
          onPress={onPillPress}
          style={({ pressed }) => [
            styles.pill,
            themeStyles.pill,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText variant="footnote" weight="semiBold">
            {pillCopy}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  const showHeader =
    locationStatus === "granted" ||
    !!movie ||
    query.isFetching ||
    query.isLoading;

  if (!showHeader && locationStatus !== "pending") {
    return null;
  }

  const handleDateTabLayout = (key: string) => (event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const existing = prev[key];
      if (existing && existing.width === width && existing.x === x) {
        return prev;
      }
      return {
        ...prev,
        [key]: { width, x },
      };
    });
  };

  return (
    <View style={styles.container}>
      <ThemedText variant="heading" style={styles.title}>
        Showtimes near you
      </ThemedText>

      {dateTabs.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateTabRow}
        >
          <View style={styles.dateTabsTrack}>
            {dateTabs.map((tab) => {
              const selected = tab.key === activeDate;
              return (
                <Pressable
                  key={tab.key}
                  onLayout={handleDateTabLayout(tab.key)}
                  onPress={() => setSelectedDate(tab.key)}
                  style={styles.dateTab}
                >
                  <Text
                    style={[
                      styles.dateTabDayText,
                      selected
                        ? themeStyles.chipSelectedDayText
                        : themeStyles.chipUnselectedDayText,
                    ]}
                  >
                    {tab.weekday}
                  </Text>
                  <ThemedText
                    variant="subhead"
                    weight="semiBold"
                    style={styles.dateTabNumberText}
                  >
                    {tab.dayNumber}
                  </ThemedText>
                </Pressable>
              );
            })}
            <Animated.View
              style={[
                styles.dateTabIndicator,
                themeStyles.tabIndicator,
                indicatorStyle,
              ]}
            />
          </View>
        </ScrollView>
      ) : null}

      {query.isLoading && !query.data ? (
        <ActivityIndicator color={theme.secondaryText} />
      ) : null}

      {query.isError ? (
        <ThemedText variant="subhead" weight="medium" color="secondary">
          Could not load showtimes. Try again later.
        </ThemedText>
      ) : null}

      {!query.isLoading &&
      !query.isFetching &&
      query.data &&
      (!movie || theaters.length === 0) ? (
        <ThemedText variant="subhead" weight="medium" color="secondary">
          No local showtimes for this date.
        </ThemedText>
      ) : null}

      {theaters.length > 0 ? (
        <View style={styles.theaterList}>
          {theaters.map((theater) => (
            <TheaterAccordionItem
              key={theater.theaterId}
              theater={theater}
              expanded={
                theaterOverrides[theater.theaterId] ??
                theaters
                  .slice(0, 3)
                  .some((item) => item.theaterId === theater.theaterId)
              }
              onToggle={() => toggleTheater(theater.theaterId)}
              themeStyles={themeStyles}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  chevronCollapsed: {
    transform: [{ rotate: "0deg" }],
  },
  chevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  container: {
    gap: spacing.md,
  },
  dateTab: {
    alignItems: "center",
    minWidth: 84,
    paddingHorizontal: 10,
    paddingBottom: spacing.sm,
    position: "relative",
  },
  dateTabDayText: {
    fontFamily: fontFamily.tanker.regular,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  dateTabIndicator: {
    borderRadius: 2.5,
    bottom: 0,
    height: 2.5,
    left: 0,
    opacity: 0,
    position: "absolute",
  },
  dateTabNumberText: {
    marginTop: spacing.xxs,
  },
  dateTabRow: {
    paddingHorizontal: spacing.xxs,
  },
  dateTabsTrack: {
    gap: spacing.xxxl,
    paddingBottom: spacing.xxs,
    position: "relative",
    flexDirection: "row",
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  theaterCard: {
    gap: spacing.xxs,
  },
  theaterHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  theaterList: {
    gap: spacing.lg,
  },
  theaterName: {
    flex: 1,
    fontFamily: fontFamily.plusJakarta.semiBold,
    fontSize: 15,
  },
  timeChip: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chipRowExpanded: {
    marginTop: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
});

export default ShowtimesSection;
