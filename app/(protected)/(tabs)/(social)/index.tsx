import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontFamily } from "../../../../lib/fonts";
import { ThemeContext } from "../../../../contexts/theme-context";

const SocialScreen = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Social</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.plusJakarta.bold,
  },
});

export default SocialScreen;
