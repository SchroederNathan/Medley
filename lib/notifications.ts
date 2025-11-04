import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./utils";

type RegisterResult = {
  token: string | null;
  error?: string;
};

export async function registerForPushNotificationsAsync(): Promise<RegisterResult> {
  try {
    if (!Device.isDevice) {
      return {
        token: null,
        error: "Push notifications require a physical device",
      };
    }

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      } catch (error) {
        console.warn("Failed to set notification channel:", error);
      }
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return { token: null, error: "Notification permissions not granted" };
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      return { token: null, error: "EAS project ID not found" };
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: tokenData.data };
  } catch (e: any) {
    return {
      token: null,
      error: e?.message ?? "Failed to register for push notifications",
    };
  }
}

export async function syncPushTokenToSupabase(options: {
  userId: string;
  token: string;
}): Promise<void> {
  const { userId, token } = options;

  try {
    // Store token in profiles.expo_push_token for the push edge function to use
    // The push function reads from this column when sending notifications
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", userId);

    if (error) {
      console.warn("Failed to sync push token to Supabase:", error);
    }
  } catch (e) {
    // Intentionally swallow; push is best-effort
    console.warn("Error syncing push token:", e);
  }
}

export function setDefaultNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Send a push notification to a user
 * This inserts a record into the notifications table, which triggers
 * the webhook that calls the push edge function to send the notification
 */
export async function sendPushNotification(options: {
  userId: string;
  body: string;
}): Promise<void> {
  const { userId, body } = options;

  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      body: body,
    });

    if (error) {
      console.error("Failed to send push notification:", error);
      throw error;
    }
  } catch (e) {
    console.error("Error sending push notification:", e);
    throw e;
  }
}
