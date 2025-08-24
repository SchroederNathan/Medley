import { router } from "expo-router";
import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/ui/button";
import { ThemeContext } from "../contexts/theme-context";
import { fontFamily } from "../lib/fonts";

const GetStarted = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>MEDLEY</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Discover your next favorite thing
      </Text>
      {/* <View style={styles.posterContainer}>POSTERS GO HERE</View> */}

      <View style={styles.actionContainer}>
        <Button
          title="Get Started"
          styles={styles.button}
          onPress={() => router.push("/login")}
        />
        <Text style={[styles.info, { color: theme.text }]}>
          By proceeding to use Medley, you agree to the terms of service and
          privacy policy.
        </Text>
      </View>
    </View>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 96,
    fontFamily: fontFamily.tanker.regular,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  button: {
    width: "100%",
  },
  info: {
    fontSize: 16,
    fontFamily: fontFamily.plusJakarta.regular,
    textAlign: "center",
    marginTop: 16,
  },
  actionContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "absolute",
    bottom: 52,
  },
});
