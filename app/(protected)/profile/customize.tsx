import { useRouter } from "expo-router";
import { GripVertical, Plus } from "lucide-react-native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { ThemeContext } from "../../../contexts/theme-context";
import { useUpdateProfileLayout } from "../../../hooks/mutations";
import { useProfileLayout } from "../../../hooks/use-profile-layout";
import { fontFamily } from "../../../lib/fonts";
import {
  ALL_BLOCK_KINDS,
  getBlockDefinition,
} from "../../../lib/profile-blocks/registry";
import type {
  ProfileBlockConfig,
  ProfileBlockKind,
} from "../../../lib/profile-blocks/types";

const ProfileCustomize = () => {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const layout = useProfileLayout();
  const updateLayout = useUpdateProfileLayout();

  const [blocks, setBlocks] = useState<ProfileBlockConfig[]>(layout.blocks);

  const missingKinds = useMemo(
    () =>
      ALL_BLOCK_KINDS.filter((kind) => !blocks.some((b) => b.kind === kind)),
    [blocks]
  );

  const toggleEnabled = useCallback((id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  }, []);

  const addBlock = useCallback((kind: ProfileBlockKind) => {
    // Each kind appears at most once, so the kind doubles as the instance id.
    setBlocks((prev) => [...prev, { id: kind, kind, enabled: true }]);
  }, []);

  const handleSave = () => {
    updateLayout.mutate(
      { version: 1, blocks },
      {
        onSuccess: () => router.back(),
        onError: (error) => {
          Alert.alert(
            "Error",
            error instanceof Error
              ? error.message
              : "Failed to save layout. Please try again."
          );
        },
      }
    );
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ProfileBlockConfig>) => {
      const definition = getBlockDefinition(item.kind);
      return (
        <ScaleDecorator>
          <View
            style={[
              styles.row,
              { backgroundColor: theme.card, opacity: isActive ? 0.8 : 1 },
            ]}
          >
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              hitSlop={8}
            >
              <GripVertical color={theme.secondaryText} />
            </TouchableOpacity>
            <Text style={[styles.rowTitle, { color: theme.text }]}>
              {definition?.title ?? item.kind}
            </Text>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleEnabled(item.id)}
            />
          </View>
        </ScaleDecorator>
      );
    },
    [theme, toggleEnabled]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>
        Customize Profile
      </Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
        Drag to reorder. Toggle blocks on or off.
      </Text>

      <DraggableFlatList
        data={blocks}
        onDragEnd={({ data }) => setBlocks(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          missingKinds.length > 0 ? (
            <View style={styles.addSection}>
              <Text style={[styles.addHeading, { color: theme.secondaryText }]}>
                Add a block
              </Text>
              {missingKinds.map((kind) => (
                <TouchableOpacity
                  key={kind}
                  onPress={() => addBlock(kind)}
                  style={[styles.addRow, { borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={theme.text} />
                  <Text style={[styles.rowTitle, { color: theme.text }]}>
                    {getBlockDefinition(kind)?.title ?? kind}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={updateLayout.isPending ? "Saving..." : "Save"}
          onPress={handleSave}
          variant="secondary"
          disabled={updateLayout.isPending}
        />
      </View>
    </View>
  );
};

export default ProfileCustomize;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.tanker.regular,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  addSection: {
    marginTop: 24,
    gap: 12,
  },
  addHeading: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.medium,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    paddingTop: 12,
  },
});
