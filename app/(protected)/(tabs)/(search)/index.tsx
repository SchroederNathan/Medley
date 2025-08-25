import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemeContext } from "../../../../contexts/theme-context";
import { fontFamily } from "../../../../lib/fonts";

const SearchScreen = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Search</Text>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.bold,
  },
});
