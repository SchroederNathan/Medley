import * as Haptics from "expo-haptics";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { spacing, type } from "../../../constants/theme";
import { ThemeContext } from "../../../contexts/theme-context";
import { fontFamily } from "../../../lib/fonts";
import { TvSeason } from "../../../types/media";
import Sheet from "../sheet";
import { ThemedText } from "../themed-text";

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
              <ThemedText variant="subhead" color="secondary">
                {season.episode_count} episodes
              </ThemedText>
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
    gap: spacing.xs,
    marginVertical: -spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  seasonName: {
    ...type.body,
    fontFamily: fontFamily.plusJakarta.medium,
  },
});
