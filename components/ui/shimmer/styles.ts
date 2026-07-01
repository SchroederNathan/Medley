import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  containerDebug: {
    borderWidth: 1,
    borderColor: "green",
    overflow: "visible",
  },
  trackDebug: {
    height: 1,
    backgroundColor: "green",
  },
  translateContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rotateContainer: {
    minWidth: 1,
    overflow: "hidden",
  },
  overlayDebug: {
    borderWidth: 1,
    borderColor: "lime",
  },
  maskSizer: {
    opacity: 0,
  },
});
