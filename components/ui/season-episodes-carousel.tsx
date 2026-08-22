import ArrowDown01Icon from "@hugeicons-pro/core-stroke-standard/ArrowDown01Icon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { motion, radius, spacing, type } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { useSeasonEpisodes } from "../../hooks/use-season-episodes";
import { TvEpisode, TvSeason } from "../../types/media";
import SeasonPicker from "./sheets/season-picker";
import { ThemedText } from "./themed-text";

interface SeasonEpisodesCarouselProps {
  mediaId: string;
  seasons: TvSeason[];
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 120;

const EpisodeCard = ({
  episode,
  theme,
}: {
  episode: TvEpisode;
  theme: any;
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {episode.still_path ? (
          <Image
            source={{ uri: episode.still_path }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={motion.quick}
            style={styles.image}
          />
        ) : (
          <View
            style={[styles.image, { backgroundColor: theme.secondaryText }]}
          />
        )}
      </View>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {episode.name}
      </Text>
      <Text
        style={[styles.subtitle, { color: theme.secondaryText }]}
        numberOfLines={1}
      >
        Episode {episode.episode_number}
      </Text>
    </View>
  );
};

const SeasonEpisodesCarousel = ({
  mediaId,
  seasons,
}: SeasonEpisodesCarouselProps) => {
  const { theme } = useContext(ThemeContext);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showPicker, setShowPicker] = useState(false);

  const { data: episodes, isLoading } = useSeasonEpisodes(
    mediaId,
    selectedSeason
  );

  const currentSeason = seasons.find((s) => s.season_number === selectedSeason);
  const seasonTitle = currentSeason?.name ?? `Season ${selectedSeason}`;

  const renderItem = useCallback(
    ({ item }: { item: TvEpisode }) => (
      <EpisodeCard episode={item} theme={theme} />
    ),
    [theme]
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={styles.titleRow}
      >
        <ThemedText variant="heading">{seasonTitle}</ThemedText>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={20}
          color={theme.text}
          strokeWidth={2}
        />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.secondaryText} />
        </View>
      ) : episodes && episodes.length > 0 ? (
        <FlashList
          data={episodes}
          keyExtractor={(item) => String(item.episode_number)}
          style={{ marginHorizontal: -spacing.xl }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <ThemedText variant="subhead" color="secondary">
          No episodes available
        </ThemedText>
      )}

      <SeasonPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        seasons={seasons}
        selectedSeason={selectedSeason}
        onSelect={setSelectedSeason}
      />
    </View>
  );
};

export default SeasonEpisodesCarousel;

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    marginRight: spacing.lg,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  name: {
    ...type.caption,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...type.caption,
  },
});
