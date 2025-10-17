import { GripVertical } from "lucide-react-native";
import React, { useContext } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { ThemeContext } from "../../contexts/theme-context";
import { fontFamily } from "../../lib/fonts";
import { Media } from "../../types/media";

interface CollectionItemProps {
  item: Media;
  index: number;
  isRanked: boolean;
  isDraggable?: boolean;
  drag?: () => void;
  isActive?: boolean;
}

const CollectionItem = ({
  item,
  index,
  isRanked,
  isDraggable = false,
  drag,
  isActive = false,
}: CollectionItemProps) => {
  const { theme } = useContext(ThemeContext);

  // Determine what to show on the left side based on rank
  const renderRankIndicator = () => {
    if (!isRanked) return null;

    const rank = index + 1;

    switch (rank) {
      case 1:
        return (
          <Image
            source={require("../../assets/badges/gold-badge.png")}
            style={{ width: 40, height: 40 }}
          />
        );
      case 2:
        return (
          <Image
            source={require("../../assets/badges/silver-badge.png")}
            style={{ width: 40, height: 40 }}
          />
        );
      case 3:
        return (
          <Image
            source={require("../../assets/badges/bronze-badge.png")}
            style={{ width: 40, height: 40 }}
          />
        );
      default:
        return (
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              fontFamily: fontFamily.plusJakarta.bold,
              color: theme.secondaryText,
              minWidth: 24,
              textAlign: "center",
            }}
          >
            {rank}
          </Text>
        );
    }
  };

  const itemContent = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        borderRadius: 16,
      }}
    >
      {/* Left side: Badge/Number for ranked collections */}
      {isRanked && (
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          {renderRankIndicator()}
        </View>
      )}

      <Image
        source={{ uri: item.poster_url }}
        style={{
          width: 80,
          height: 120,
          borderRadius: 4,
          marginRight: 12,
        }}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: fontFamily.plusJakarta.bold,
            color: theme.text,
            marginBottom: 4,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fontFamily.plusJakarta.regular,
            color: theme.secondaryText,
          }}
        >
          {item.year}
        </Text>
      </View>

      {/* Right side: GripVertical only for draggable items */}
      {isDraggable && <GripVertical color={theme.text} />}
    </View>
  );

  if (isDraggable && drag) {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          activeOpacity={0.7}
        >
          {itemContent}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }

  return itemContent;
};

export default CollectionItem;
