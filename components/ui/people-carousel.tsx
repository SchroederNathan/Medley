import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useContext } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  measure,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { useZoomAnimation } from "../../contexts/zoom-animation-context";
import { fontFamily } from "../../lib/fonts";

export type PeopleCarouselItem = {
  id: string;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
};

const placeholderPeople = Array.from({ length: 10 }, (_, i) => ({
  id: `placeholder-${i}`,
  name: `Person ${i + 1}`,
  subtitle: `Role ${i + 1}`,
}));

const PeopleCarouselCardInner = ({
  item,
  theme,
}: {
  item: PeopleCarouselItem;
  theme: any;
}) => {
  const imageRef = useAnimatedRef<View>();
  const { width: screenWidth } = useWindowDimensions();
  const {
    setMeasurement,
    open,
    zoomState,
    activeSourceId,
    setActiveOverlayInfo,
  } = useZoomAnimation();

  const handlePress = () => {
    if (!item.imageUrl) return;
    setActiveOverlayInfo({
      imageUri: item.imageUrl,
      title: item.name,
      subtitle: item.subtitle ?? undefined,
    });
    const imageUrl = item.imageUrl;
    const itemId = item.id;
    const targetSize = screenWidth * 0.65;

    runOnUI(() => {
      "worklet";
      const result = measure(imageRef);
      if (result === null) return;
      setMeasurement(result);

      open({
        targetWidth: targetSize,
        targetHeight: targetSize,
        imageUri: imageUrl,
        sourceId: itemId,
        borderRadius: targetSize / 2,
      });
    })();
  };

  const rImageStyle = useAnimatedStyle(() => ({
    opacity:
      zoomState.value === "open" && activeSourceId.value === item.id ? 0 : 1,
  }));

  return (
    <Pressable onPress={handlePress} disabled={!item.imageUrl}>
      <View style={styles.item}>
        <Animated.View ref={imageRef} style={[styles.image, rImageStyle]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              contentFit="cover"
              style={styles.image}
            />
          ) : (
            <View
              style={[styles.image, { backgroundColor: theme.secondaryText }]}
            />
          )}
        </Animated.View>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.secondaryText }]}
          numberOfLines={2}
        >
          {item.subtitle ?? ""}
        </Text>
      </View>
    </Pressable>
  );
};

const PeopleCarouselCard = React.memo(PeopleCarouselCardInner);

const PeopleCarousel = ({
  people,
  title,
  style,
  showPlaceholder = false,
}: {
  people?: PeopleCarouselItem[];
  title: string;
  style?: StyleProp<ViewStyle>;
  showPlaceholder?: boolean;
}) => {
  const { theme } = useContext(ThemeContext);
  const data = people?.length
    ? people
    : showPlaceholder
      ? placeholderPeople
      : [];
  const renderItem = useCallback(
    ({ item }: { item: PeopleCarouselItem }) => (
      <PeopleCarouselCard item={item} theme={theme} />
    ),
    [theme]
  );

  if (!data.length) {
    return null;
  }

  return (
    <View style={style}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default PeopleCarousel;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
    marginBottom: 16,
  },
  item: {
    alignItems: "center",
    marginRight: 16,
    width: 104,
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  name: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.plusJakarta.medium,
    textAlign: "center",
  },
});
