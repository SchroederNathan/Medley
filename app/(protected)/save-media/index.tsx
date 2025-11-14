import { FlashList } from "@shopify/flash-list";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AddCollection from "../../../components/ui/add-collection";
import CollectionCard from "../../../components/ui/collection-card";
import ModalHeader from "../../../components/ui/modal-header";
import { ThemeContext } from "../../../contexts/theme-context";
import { useToast } from "../../../contexts/toast-context";
import { useUserCollections } from "../../../hooks/use-user-collections";
import { fontFamily } from "../../../lib/fonts";
import Search from "../../../components/ui/search";
import { CollectionService } from "../../../services/collectionService";
import * as Haptics from "expo-haptics";

const SaveMedia = () => {
  const { theme } = useContext(ThemeContext);
  const collectionsQuery = useUserCollections();
  const router = useRouter();
  const { id: mediaId } = useLocalSearchParams();
  const { showToast } = useToast();

  const [addingToCollection, setAddingToCollection] = useState<string | null>(
    null,
  );

  const allCollections = useMemo(
    () => collectionsQuery.data ?? [],
    [collectionsQuery.data],
  );

  const handleAddToCollection = async (collectionId: string) => {
    if (!mediaId) {
      return;
    }

    try {
      setAddingToCollection(collectionId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await CollectionService.addMediaToCollection(
        collectionId,
        mediaId as string,
      );

      // Get collection name for the toast
      const collection = allCollections.find((c: any) => c.id === collectionId);
      const collectionName = collection?.name || "collection";

      // Show toast and navigate back
      router.back();
      setTimeout(() => {
        showToast({
          message: `Saved to ${collectionName}`,
          actionText: "VIEW",
          onActionPress: () => {
            router.push(`/collection/${collectionId}`);
          },
        });
      }, 300);
    } catch (error) {
      console.error("Failed to add media to collection:", error);
      showToast({
        message: "Failed to add media. Please try again.",
      });
    } finally {
      setAddingToCollection(null);
    }
  };

  const renderCollectionItem = ({ item }: { item: any }) => (
    <View style={{ opacity: addingToCollection === item.id ? 0.6 : 1 }}>
      <CollectionCard
        id={item.id}
        mediaItems={
          item.collection_items
            ?.sort((a: any, b: any) => a.position - b.position)
            .map((item: any) => item.media) ?? []
        }
        isLoading={addingToCollection === item.id}
        title={item.name}
        ranked={item.ranked}
        onPress={() => handleAddToCollection(item.id)}
      />
    </View>
  );

  return (
    <>
      <ModalHeader title="Save Media" />
      <View style={styles.content}>
        {collectionsQuery.isLoading ? (
          <Text
            style={{
              color: theme.secondaryText,
              textAlign: "center",
              fontFamily: fontFamily.plusJakarta.regular,
            }}
          >
            Loading…
          </Text>
        ) : collectionsQuery.isError ? (
          <Text
            style={{
              color: theme.text,
              textAlign: "center",
              fontFamily: fontFamily.plusJakarta.regular,
            }}
          >
            Failed to load collections
          </Text>
        ) : (
          <>
            <Search placeholder="Search for collection" style={styles.search} />
            <AddCollection
              title="Create Collection"
              onPress={() => {
                router.push("/collection/form");
              }}
            />
            {allCollections.length === 0 ? (
              <Text
                style={{
                  color: theme.secondaryText,
                  textAlign: "center",
                  marginTop: 40,
                  fontFamily: fontFamily.plusJakarta.regular,
                }}
              >
                No collections yet. Create your first one!
              </Text>
            ) : (
              <FlashList
                data={allCollections}
                renderItem={renderCollectionItem}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                contentContainerStyle={{ paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
    </>
  );
};

export default SaveMedia;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  search: {
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: fontFamily.plusJakarta.medium,
    fontSize: 14,
  },
});
