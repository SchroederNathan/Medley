import React, { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Input from "../../../components/ui/input";
import { ThemeContext } from "../../../contexts/theme-context";
import { fontFamily } from "../../../lib/fonts";
import Button from "../../../components/ui/button";

const CreateCollection = () => {
  const { theme } = useContext(ThemeContext);
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <View style={styles.container}>
      {/* Header */}
      <View>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          New Collection
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Input
            placeholder="Collection Name"
            value={collectionName}
            onChangeText={setCollectionName}
          />
          <Input
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            minHeight={200}
            maxHeight={300}
          />
        </View>
      </View>
      <Button title="Create Collection" onPress={() => {}} styles={styles.button} />
    </View>
  );
};

export default CreateCollection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 72,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 24,
    textAlign: "center",
    paddingVertical: 24,
    fontFamily: fontFamily.tanker.regular,
  },
  inputContainer: {
    gap: 12,
  },
  button: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 20,
  },
});
