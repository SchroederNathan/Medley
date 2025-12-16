import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useContext, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../components/ui/button";
import { AuthContext } from "../../../contexts/auth-context";
import { ThemeContext } from "../../../contexts/theme-context";
import { queryClient } from "../../../lib/query-client";
const SettingsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const authContext = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [isResetting, setIsResetting] = useState(false);

  const resetTanstackCache = () => {
    Alert.alert(
      "Refresh app data?",
      "This will clear cached data and refetch everything.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refresh",
          style: "destructive",
          onPress: async () => {
            try {
              setIsResetting(true);
              await queryClient.cancelQueries();
              queryClient.clear();
              await AsyncStorage.removeItem("RQ_CACHE");
              await queryClient.invalidateQueries({ type: "all" });
              await queryClient.refetchQueries({ type: "all" });
            } catch (e) {
              console.warn("Failed to reset query cache", e);
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ paddingTop: insets.top + 20 }}>
      <Text style={{ color: theme.text }}>Settings</Text>
      <Button
        title="Logout"
        onPress={() => authContext.logOut()}
        styles={styles.button}
      />
      <Button
        title={isResetting ? "Refreshing..." : "Refresh app data"}
        onPress={resetTanstackCache}
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
