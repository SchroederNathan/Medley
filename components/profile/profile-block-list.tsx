import React from "react";
import { StyleSheet, View } from "react-native";
import { getBlockDefinition } from "../../lib/profile-blocks/registry";
import type { ProfileLayout } from "../../lib/profile-blocks/types";

interface ProfileBlockListProps {
  layout: ProfileLayout;
  userId: string;
  isOwnProfile: boolean;
}

/**
 * Renders a user's profile blocks in layout order. Disabled blocks and unknown
 * kinds (e.g. added by a newer client version) are skipped silently.
 */
const ProfileBlockList = ({
  layout,
  userId,
  isOwnProfile,
}: ProfileBlockListProps) => {
  const rendered = layout.blocks
    .filter((block) => block.enabled)
    .map((block) => {
      const definition = getBlockDefinition(block.kind);
      if (!definition) return null;
      const { Component } = definition;
      return (
        <Component
          key={block.id}
          config={block}
          userId={userId}
          isOwnProfile={isOwnProfile}
        />
      );
    })
    .filter(Boolean);

  if (rendered.length === 0) {
    return null;
  }

  return <View style={styles.container}>{rendered}</View>;
};

export default ProfileBlockList;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 28,
  },
});
