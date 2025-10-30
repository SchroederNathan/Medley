import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import { AuthContext } from "../../../contexts/auth-context";
import { ThemeContext } from "../../../contexts/theme-context";
const SettingsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const authContext = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 20 }}>
      <Text style={{ color: theme.text }}>Settings</Text>
      <Button
        title="Logout"
        onPress={() => authContext.logOut()}
        styles={styles.button}
      />
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
  },
});
