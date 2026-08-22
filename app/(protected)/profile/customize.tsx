import GripVerticalIcon from "@hugeicons-pro/core-stroke-standard/GripVerticalIcon";
import PlusSignIcon from "@hugeicons-pro/core-stroke-standard/PlusSignIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import Sortable, { type SortableGridRenderItem } from "react-native-sortables";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { ThemedText } from "../../../components/ui/themed-text";
import { radius, spacing } from "../../../constants/theme";
import { ThemeContext } from "../../../contexts/theme-context";
import { useUpdateProfileLayout } from "../../../hooks/mutations";
import { useProfileLayout } from "../../../hooks/use-profile-layout";
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

  const renderItem = useCallback<SortableGridRenderItem<ProfileBlockConfig>>(
    ({ item }) => {
      const definition = getBlockDefinition(item.kind);
      return (
        <View style={[styles.row, { backgroundColor: theme.card }]}>
          {/* Only the grip activates the drag, so the Switch stays tappable. */}
          <Sortable.Handle>
            <HugeiconsIcon
              icon={GripVerticalIcon}
              color={theme.secondaryText}
              strokeWidth={2}
            />
          </Sortable.Handle>
          <ThemedText variant="headline" style={styles.rowTitle}>
            {definition?.title ?? item.kind}
          </ThemedText>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleEnabled(item.id)}
          />
        </View>
      );
    },
    [theme, toggleEnabled]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <ThemedText variant="screenTitle">Customize Profile</ThemedText>
      <ThemedText variant="subhead" color="secondary" style={styles.subtitle}>
        Drag to reorder. Toggle blocks on or off.
      </ThemedText>

      <Sortable.Grid
        columns={1}
        data={blocks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        rowGap={spacing.md}
        customHandle
        sortEnabled={blocks.length > 1}
        onDragEnd={({ data }) => setBlocks(data)}
        hapticsEnabled
        activeItemScale={1.03}
        activeItemOpacity={0.9}
        inactiveItemOpacity={1}
      />

      {missingKinds.length > 0 && (
        <View style={styles.addSection}>
          <ThemedText variant="subhead" weight="medium" color="secondary">
            Add a block
          </ThemedText>
          {missingKinds.map((kind) => (
            <TouchableOpacity
              key={kind}
              onPress={() => addBlock(kind)}
              style={[styles.addRow, { borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                size={20}
                color={theme.text}
                strokeWidth={2}
              />
              <ThemedText variant="headline" style={styles.rowTitle}>
                {getBlockDefinition(kind)?.title ?? kind}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.spacer} />

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
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
    paddingHorizontal: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  rowTitle: {
    flex: 1,
  },
  addSection: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
