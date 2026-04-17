import * as Haptics from "expo-haptics";
import React, { useContext, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ThemeContext } from "../../contexts/theme-context";
import { useShowtimesForMedia } from "../../hooks/use-showtimes";
import { fontFamily } from "../../lib/fonts";
import { ShowtimeEntry } from "../../services/showtimesService";
import { Media } from "../../types/media";

type ShowtimesSectionProps = {
  media: Media;
};

type TheaterGroup = {
  theaterId: string;
  theaterName: string;
  times: ShowtimeEntry[];
};

function formatTime(dateTime: string): string {
  // TMS returns theater-local time like "2026-04-17T18:40" (no TZ). Treat as local.
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
  // Keep chronological ordering within each theater
  for (const group of map.values()) {
    group.times.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }
  return Array.from(map.values());
}

export const ShowtimesSection: React.FC<ShowtimesSectionProps> = ({
  media,
}) => {
  const { theme } = useContext(ThemeContext);
  const { movie, locationStatus, requestLocation, query } =
    useShowtimesForMedia(media);

  const theaters = useMemo(
    () => (movie ? groupByTheater(movie.showtimes) : []),
    [movie]
  );

  // Prompt to enable location when we can still ask for permission
  if (
    (locationStatus === "undetermined" || locationStatus === "denied") &&
    !movie
  ) {
    // Only show the prompt when permission can still be requested.
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

  if (query.isLoading && !movie) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>
          Showtimes near you
        </Text>
        <ActivityIndicator color={theme.secondaryText} />
      </View>
    );
  }

  if (!movie || theaters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        Showtimes near you
      </Text>
      <View style={{ gap: 20 }}>
        {theaters.map((theater) => (
          <View key={theater.theaterId}>
            <Text
              style={[styles.theaterName, { color: theme.text }]}
              numberOfLines={1}
            >
              {theater.theaterName}
            </Text>
            <View style={styles.chipRow}>
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
                        fontVariant: ["tabular-nums"],
                      },
                    ]}
                  >
                    {formatTime(time.dateTime)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
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
  theaterName: {
    fontSize: 15,
    fontFamily: fontFamily.plusJakarta.semiBold,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
});

export default ShowtimesSection;
