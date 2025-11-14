import { Image } from "expo-image";
import { GripVertical, X } from "lucide-react-native";
import React, { useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
  onRemove?: () => void;
}

const CollectionItem = ({
  item,
  index,
  isRanked,
  isDraggable = false,
  drag,
  isActive = false,
  onRemove,
}: CollectionItemProps) => {
  const { theme } = useContext(ThemeContext);

  // Determine what to show on the left side based on rank
  const renderRankIndicator = () => {
    if (!isRanked) return null;

    const rank = index + 1;

    switch (rank) {
      case 1:
        return (
          <View
            style={{
              position: "relative",
              width: 40,
              height: 40,
              overflow: "visible",
            }}
          >
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../assets/badges/gold-badge.png")}
              style={{
                position: "absolute",
                width: 48,
                height: 48,
                top: -4,
                left: -4,
                tintColor: theme.background,
              }}
            />
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../assets/badges/gold-badge.png")}
              style={{
                width: 40,
                height: 40,
              }}
            />
          </View>
        );
      case 2:
        return (
          <View
            style={{
              position: "relative",
              width: 40,
              height: 40,
              overflow: "visible",
            }}
          >
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../assets/badges/silver-badge.png")}
              style={{
                position: "absolute",
                width: 48,
                height: 48,
                top: -4,
                left: -4,
                tintColor: theme.background,
              }}
            />
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../assets/badges/silver-badge.png")}
              style={{
                width: 40,
                height: 40,
              }}
            />
          </View>
        );
      case 3:
        return (
          <View
            style={{
              position: "relative",
              width: 40,
              height: 40,
              overflow: "visible",
            }}
          >
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../assets/badges/bronze-badge.png")}
              style={{
                position: "absolute",
                width: 48,
                height: 48,
                top: -4,
                left: -4,
                tintColor: theme.background,
              }}
            />
            <Image
              cachePolicy="memory-disk"
              transition={200}
              source={require("../../assets/badges/bronze-badge.png")}
              style={{
                width: 40,
                height: 40,
              }}
            />
          </View>
        );
      default:
        return (
          <View
            style={{
              position: "relative",
              width: 32,
              height: 32,
              overflow: "visible",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -4,
                left: -4,
                width: 40,
                height: 40,
                backgroundColor: theme.background,
                borderRadius: 20,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                width: 32,
                height: 32,
                fontWeight: "bold",
                fontFamily: fontFamily.plusJakarta.bold,
                color: theme.secondaryText,
                backgroundColor: theme.buttonBackground,
                borderRadius: 20,
                padding: 4,
                minWidth: 24,
                textAlign: "center",
              }}
            >
              {rank}
            </Text>
          </View>
        );
    }
  };

  const itemContent = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderRadius: 16,
      }}
    >
      {/* Left side: Badge/Number for ranked collections */}
      {isRanked && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: -16,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            zIndex: 1,
          }}
        >
          {renderRankIndicator()}
        </View>
      )}

      <Image
        cachePolicy="memory-disk"
        transition={200}
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

      {/* Right side: Remove button and GripVertical for draggable items */}
      {isDraggable && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {onRemove && (
            // Temp removal UI
            <TouchableOpacity
              onPress={onRemove}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.buttonBackground,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={theme.destructive || theme.text} />
            </TouchableOpacity>
          )}
          <GripVertical color={theme.text} />
        </View>
      )}
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
