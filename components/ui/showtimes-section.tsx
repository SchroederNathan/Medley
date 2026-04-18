import * as Haptics from "expo-haptics";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemeContext } from "../../contexts/theme-context";
import { useShowtimesForMedia } from "../../hooks/use-showtimes";
import { fontFamily } from "../../lib/fonts";
import { ShowtimeEntry } from "../../services/showtimesService";
import { Media } from "../../types/media";
import { ChevronDown } from "./svg-icons";
import TabPager from "./tab-pager";

type ShowtimesSectionProps = {
  media: Media;
};

type TheaterGroup = {
  theaterId: string;
  theaterName: string;
  times: ShowtimeEntry[];
};

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
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
      parseYmd(ymd)
    );
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
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
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
        theaterId: s.theaterId,
        theaterName: s.theaterName,
        times: [s],
      });
    }
  }
  for (const group of map.values()) {
    group.times.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }
  return Array.from(map.values());
}

type TheaterAccordionItemProps = {
  theater: TheaterGroup;
  expanded: boolean;
  onToggle: () => void;
};

const TheaterAccordionItem: React.FC<TheaterAccordionItemProps> = ({
  theater,
  expanded,
  onToggle,
}) => {
  const { theme } = useContext(ThemeContext);
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: 220 });
  }, [expanded, progress]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(220)}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.theaterHeader,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Text
          style={[styles.theaterName, { color: theme.text }]}
          numberOfLines={1}
        >
          {theater.theaterName}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={theme.secondaryText} />
        </Animated.View>
      </Pressable>
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={[styles.chipRow, styles.chipRowExpanded]}
        >
          {theater.times.map((time, idx) => (
            <View
              key={`${theater.theaterId}-${time.dateTime}-${idx}`}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {formatTime(time.dateTime)}
              </Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

export const ShowtimesSection: React.FC<ShowtimesSectionProps> = ({
  media,
}) => {
  const { theme } = useContext(ThemeContext);
  const [todayYmd, setTodayYmd] = useState(() => todayLocalDate());
  const dateOptions = useMemo(() => buildNextSevenDates(todayYmd), [todayYmd]);
  const [selectedDate, setSelectedDate] = useState(() => dateOptions[0] ?? "");
  const dateTabs = useMemo(
    () => dateOptions.map((ymd) => ({ key: ymd, title: ymd })),
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

  useEffect(() => {
    setSelectedDate((current) => {
      if (current && dateOptions.includes(current)) return current;
      return dateOptions[0] ?? "";
    });
  }, [dateOptions]);

  const { movie, locationStatus, requestLocation, query } =
    useShowtimesForMedia(media, selectedDate, todayYmd);

  const theaters = useMemo(
    () => (movie ? groupByTheater(movie.showtimes) : []),
    [movie]
  );

  const [expandedTheaters, setExpandedTheaters] = useState<Set<string>>(
    new Set()
  );

  const theatersKey = useMemo(
    () => theaters.map((t) => t.theaterId).join("|"),
    [theaters]
  );

  useEffect(() => {
    setExpandedTheaters(new Set(theaters.slice(0, 3).map((t) => t.theaterId)));
  }, [theatersKey]);

  const toggleTheater = (theaterId: string) => {
    setExpandedTheaters((prev) => {
      const next = new Set(prev);
      if (next.has(theaterId)) {
        next.delete(theaterId);
      } else {
        next.add(theaterId);
      }
      return next;
    });
  };

  if (
    (locationStatus === "undetermined" || locationStatus === "denied") &&
    !movie &&
    !query.data
  ) {
    if (locationStatus !== "undetermined") return null;

    return (
      <View style={styles.container}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            requestLocation();
          }}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: theme.text }]}>
            Enable location to see showtimes
          </Text>
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

  return (
    <Animated.View
      style={styles.container}
      layout={LinearTransition.duration(220)}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Showtimes near you
      </Text>
      {dateTabs.length > 0 && (
        <TabPager
          tabs={dateTabs}
          selectedKey={selectedDate}
          onChange={(key) => setSelectedDate(key)}
          style={styles.datePager}
          renderTab={(item, selected, index) => (
            <View style={styles.dateTabContent}>
              <Text
                style={{
                  color: selected ? theme.text : theme.secondaryText,
                  fontFamily: fontFamily.tanker.regular,
                  fontSize: 18,
                  letterSpacing: 0.3,
                }}
              >
                {weekdayLabel(item.key, index)}
              </Text>
              <Text
                style={{
                  color: selected ? theme.text : theme.secondaryText,
                  fontFamily: fontFamily.plusJakarta.semiBold,
                  fontSize: 14,
                  marginTop: 2,
                }}
              >
                {dayNum(item.key)}
              </Text>
            </View>
          )}
        />
      )}

      {query.isLoading && !query.data ? (
        <ActivityIndicator color={theme.secondaryText} />
      ) : null}

      {query.isError ? (
        <Text style={[styles.empty, { color: theme.secondaryText }]}>
          Could not load showtimes. Try again later.
        </Text>
      ) : null}

      {!query.isLoading &&
      !query.isFetching &&
      query.data &&
      (!movie || theaters.length === 0) ? (
        <Text style={[styles.empty, { color: theme.secondaryText }]}>
          No local showtimes for this date.
        </Text>
      ) : null}

      {theaters.length > 0 ? (
        <Animated.View
          style={{ gap: 16 }}
          layout={LinearTransition.duration(220)}
        >
          {theaters.map((theater) => (
            <TheaterAccordionItem
              key={theater.theaterId}
              theater={theater}
              expanded={expandedTheaters.has(theater.theaterId)}
              onToggle={() => toggleTheater(theater.theaterId)}
            />
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  theaterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 12,
  },
  theaterName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipRowExpanded: {
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: {
    fontSize: 13,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  datePager: {
    marginHorizontal: -20,
  },
  dateTabContent: {
    alignItems: "center",
    minWidth: 36,
  },
});

export default ShowtimesSection;
