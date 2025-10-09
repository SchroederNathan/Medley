import React, { useContext } from "react";
import { Text, View } from "react-native";
import { ThemeContext } from "../../../contexts/theme-context";

const CreateCollection = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Text>CreateCollection</Text>
    </View>
  );
};

export default CreateCollection;
