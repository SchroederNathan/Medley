import React from "react";
import { StyleSheet, Text, View } from "react-native";

const SocialScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 24,
    color: "#fff",
  },
});

export default SocialScreen;
