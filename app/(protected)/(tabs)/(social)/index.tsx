import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../../../components/ui/themed-text";
import { spacing } from "../../../../constants/theme";

const SocialScreen = () => {
  return (
    <View style={styles.container}>
      <ThemedText variant="title">Social</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SocialScreen;
