import * as Haptics from "expo-haptics";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../../../contexts/theme-context";
import { fontFamily } from "../../../lib/fonts";
import { TvSeason } from "../../../types/media";
import Sheet from "../sheet";

interface SeasonPickerProps {
  visible: boolean;
  onClose: () => void;
  seasons: TvSeason[];
  selectedSeason: number;
  onSelect: (seasonNumber: number) => void;
}

const SeasonPicker = ({
  visible,
  onClose,
  seasons,
  selectedSeason,
  onSelect,
}: SeasonPickerProps) => {
  const { theme } = useContext(ThemeContext);

  return (
    <Sheet visible={visible} onClose={onClose} title="Seasons">
      <View style={styles.container}>
        {seasons.map((season) => {
          const isActive = season.season_number === selectedSeason;
          return (
            <TouchableOpacity
              key={season.season_number}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(season.season_number);
                onClose();
              }}
              style={[
                styles.row,
                isActive && {
                  backgroundColor: theme.fabButtonBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.seasonName,
                  { color: isActive ? theme.text : theme.secondaryText },
                ]}
              >
                {season.name}
              </Text>
              <Text
                style={[styles.episodeCount, { color: theme.secondaryText }]}
              >
                {season.episode_count} episodes
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Sheet>
  );
};

export default SeasonPicker;

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginVertical: -8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  seasonName: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  episodeCount: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },
});
