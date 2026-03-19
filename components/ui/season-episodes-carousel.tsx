import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { ChevronDown } from "lucide-react-native";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeContext } from "../../contexts/theme-context";
import { useSeasonEpisodes } from "../../hooks/use-season-episodes";
import { fontFamily } from "../../lib/fonts";
import { TvEpisode, TvSeason } from "../../types/media";
import SeasonPicker from "./sheets/season-picker";

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
            transition={200}
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
        <Text style={[styles.title, { color: theme.text }]}>{seasonTitle}</Text>
        <ChevronDown size={20} color={theme.text} />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.secondaryText} />
        </View>
      ) : episodes && episodes.length > 0 ? (
        <FlashList
          data={episodes}
          keyExtractor={(item) => String(item.episode_number)}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          No episodes available
        </Text>
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
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  loadingContainer: {
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  name: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },
});
