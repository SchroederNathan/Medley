import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";

export function useOnlineManager() {
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      onlineManager.setOnline(state.isConnected ?? true);
    });
  }, []);
}
