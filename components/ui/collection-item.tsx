import Cancel01Icon from "@hugeicons-pro/core-stroke-standard/Cancel01Icon";
import GripVerticalIcon from "@hugeicons-pro/core-stroke-standard/GripVerticalIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import React, { useContext } from "react";
import { TouchableOpacity, View } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { motion, radius, spacing } from "../../constants/theme";
import { ThemeContext } from "../../contexts/theme-context";
import { Media } from "../../types/media";
import { ThemedText } from "./themed-text";

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
              transition={motion.quick}
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
              transition={motion.quick}
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
              transition={motion.quick}
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
              transition={motion.quick}
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
              transition={motion.quick}
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
              transition={motion.quick}
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
                borderRadius: radius.full,
              }}
            />
            <ThemedText
              variant="titleSm"
              color="secondary"
              style={{
                width: 32,
                height: 32,
                backgroundColor: theme.buttonBackground,
                borderRadius: radius.full,
                padding: spacing.xs,
                minWidth: 24,
                textAlign: "center",
              }}
            >
              {rank}
            </ThemedText>
          </View>
        );
    }
  };

  const itemContent = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.lg,
        borderRadius: radius.lg,
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
            marginRight: spacing.md,
            zIndex: 1,
          }}
        >
          {renderRankIndicator()}
        </View>
      )}

      <Image
        cachePolicy="memory-disk"
        transition={motion.quick}
        source={{ uri: item.poster_url }}
        style={{
          width: 80,
          height: 120,
          borderRadius: radius.xs,
          marginRight: spacing.md,
        }}
      />

      <View style={{ flex: 1 }}>
        <ThemedText
          variant="headline"
          weight="bold"
          style={{ marginBottom: spacing.xs }}
        >
          {item.title}
        </ThemedText>
        <ThemedText variant="subhead" color="secondary">
          {item.year}
        </ThemedText>
      </View>

      {/* Right side: Remove button and GripVertical for draggable items */}
      {isDraggable && (
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          {onRemove && (
            // Temp removal UI
            <TouchableOpacity
              onPress={onRemove}
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.full,
                backgroundColor: theme.buttonBackground,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={18}
                color={theme.destructive || theme.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
          <HugeiconsIcon
            icon={GripVerticalIcon}
            color={theme.text}
            strokeWidth={2}
          />
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
