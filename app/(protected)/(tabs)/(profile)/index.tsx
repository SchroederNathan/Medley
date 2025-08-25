import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import Button from "../../../../components/ui/button";
import { AuthContext } from "../../../../contexts/auth-context";

const ProfileScreen = () => {
  const authContext = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Button
        title="Logout"
        onPress={() => authContext.logOut()}
        styles={styles.button}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: "100%",
  },
});
