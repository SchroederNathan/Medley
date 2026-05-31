import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Sortable, { type SortableGridRenderItem } from "react-native-sortables";
import { ThemeContext } from "../../../contexts/theme-context";
import { useFavourites } from "../../../hooks/use-favourites";
import { useSetFavourites } from "../../../hooks/mutations";
import { fontFamily } from "../../../lib/fonts";
import type { ProfileBlockProps } from "../../../lib/profile-blocks/types";
import { MAX_FAVOURITES } from "../../../services/favouritesService";
import { Media } from "../../../types/media";
import FavouriteCard from "./favourite-card";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 8;
// 5 posters across the padded profile content (20pt padding each side).
const CARD_WIDTH =
  (SCREEN_WIDTH - 40 - GAP * (MAX_FAVOURITES - 1)) / MAX_FAVOURITES;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const FavouritesBlock = ({ userId, isOwnProfile }: ProfileBlockProps) => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const { data: favourites } = useFavourites(userId);
  const setFavourites = useSetFavourites();
  const [isEditing, setIsEditing] = useState(false);

  const items = useMemo(() => favourites ?? [], [favourites]);

  // Edit mode (jiggle + delete badges) only applies to your own, non-empty
  // favourites. Derived so we never reset state in an effect; `removeItem`
  // clears the flag when the last card is deleted.
  const showEdit = isEditing && isOwnProfile && items.length > 0;

  const openDetail = useCallback(
    (id: string) => router.push(`/media-detail?id=${id}`),
    [router]
  );
  const toggleEdit = useCallback(() => setIsEditing((prev) => !prev), []);

  const openAdd = useCallback(() => {
    router.push("/favourites/select?mode=add");
  }, [router]);

  const openReplace = useCallback(
    (index: number) => {
      router.push(`/favourites/select?mode=replace&position=${index + 1}`);
    },
    [router]
  );

  const removeItem = useCallback(
    (media: Media) => {
      const next = items.filter((item) => item.id !== media.id);
      if (next.length === 0) {
        setIsEditing(false);
      }
      setFavourites.mutate(next);
    },
    [items, setFavourites]
  );

  const persistOrder = useCallback(
    (ordered: Media[]) => {
      setFavourites.mutate(ordered);
    },
    [setFavourites]
  );

  // The grid owns the long-press drag. Flipping into edit state here means the
  // very gesture that picked the card up keeps dragging it as the row starts
  // jiggling -- no need to lift and press again.
  const handleDragStart = useCallback(() => {
    if (isOwnProfile) setIsEditing(true);
  }, [isOwnProfile]);

  const renderItem = useCallback<SortableGridRenderItem<Media>>(
    ({ item, index }) => (
      <FavouriteCard
        media={item}
        width="100%"
        height={CARD_HEIGHT}
        isEditing={showEdit}
        rating={item.user_rating ?? undefined}
        onPress={() => (showEdit ? openReplace(index) : openDetail(item.id))}
        onRemove={() => removeItem(item)}
      />
    ),
    [showEdit, openReplace, openDetail, removeItem]
  );

  // On other users' profiles, hide the block entirely when empty.
  if (!isOwnProfile && items.length === 0) {
    return null;
  }

  // "Add" slots fill the rest of the row (own profile only), beside the grid.
  const emptySlots = isOwnProfile
    ? Math.max(0, MAX_FAVOURITES - items.length)
    : 0;

  // Size the grid to exactly the filled cells so the trailing "add" slots line
  // up beside it as a single 5-across row.
  const gridWidth =
    items.length * CARD_WIDTH + Math.max(0, items.length - 1) * GAP;

  const emptySlotNodes = Array.from({ length: emptySlots }).map((_, index) => (
    <TouchableOpacity
      key={`empty-${index}`}
      onPress={openAdd}
      activeOpacity={0.7}
      style={[
        styles.emptySlot,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: theme.buttonBackground,
          borderColor: theme.buttonBorder,
        },
      ]}
    >
      <Plus size={20} color={theme.text} />
    </TouchableOpacity>
  ));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Favourites</Text>
        {isOwnProfile && items.length > 0 && (
          <TouchableOpacity onPress={toggleEdit} hitSlop={8}>
            <Text
              style={[
                styles.editLabel,
                { color: showEdit ? theme.text : theme.secondaryText },
              ]}
            >
              {showEdit ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        {items.length > 0 && (
          <View style={{ width: gridWidth }}>
            <Sortable.Grid
              columns={items.length}
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              columnGap={GAP}
              rowGap={GAP}
              sortEnabled={isOwnProfile}
              onDragStart={handleDragStart}
              onDragEnd={({ data }) => persistOrder(data)}
              hapticsEnabled
              dragActivationDelay={150}
              activeItemScale={1.08}
              activeItemOpacity={1}
              inactiveItemOpacity={1}
              overflow="visible"
            />
          </View>
        )}
        {emptySlotNodes}
      </View>
    </View>
  );
};

export default FavouritesBlock;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.plusJakarta.bold,
  },
  editLabel: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: GAP,
  },
  emptySlot: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
