import React, { useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../../../../contexts/auth-context";

const DiscoverScreen = () => {
  const authContext = useContext(AuthContext);

  return (
    <View>
      <TouchableOpacity onPress={() => authContext.logOut()}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DiscoverScreen;
