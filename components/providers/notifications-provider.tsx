import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../../contexts/auth-context";
import {
  registerForPushNotificationsAsync,
  setDefaultNotificationHandler,
  syncPushTokenToSupabase,
} from "../../lib/notifications";

type Props = {
  children?: React.ReactNode;
};

export function NotificationsProvider({ children }: Props) {
  const { isLoggedIn, user } = useContext(AuthContext);
  const router = useRouter();
  const routerRef = useRef(router);
  const initializedRef = useRef(false);

  // Keep router ref updated
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Initialize notification handler once
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      setDefaultNotificationHandler();
      initializedRef.current = true;
    } catch (error) {
      console.warn("Failed to set notification handler:", error);
    }
  }, []);

  // Set up notification response listener
  useEffect(() => {
    // TODO: Fix deprecation warning
    let responseSub: Notifications.Subscription | null = null;

    try {
      responseSub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          try {
            const route = response?.notification?.request?.content?.data
              ?.route as string | undefined;
            if (route && routerRef.current) {
              routerRef.current.push(route);
            }
          } catch (error) {
            console.warn("Failed to handle notification response:", error);
          }
        }
      );
    } catch (error) {
      console.warn("Failed to add notification response listener:", error);
    }

    return () => {
      try {
        if (responseSub) {
          responseSub.remove();
        }
      } catch (error) {
        console.warn("Failed to remove notification listener:", error);
      }
    };
  }, []);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      return;
    }
    let cancelled = false;

    const run = async () => {
      try {
        const result = await registerForPushNotificationsAsync();
        if (cancelled) return;

        if (result.token) {
          try {
            await syncPushTokenToSupabase({
              userId: user.id as string,
              token: result.token,
            });
          } catch (error) {
            console.warn("Failed to sync push token:", error);
          }
        } else if (result.error) {
          // Only log if it's not a simulator/device check
          if (!result.error.includes("physical device")) {
            console.warn("Push notification registration:", result.error);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to register for push notifications:", error);
        }
      }
    };

    run();
  }, [isLoggedIn, user?.id]);

  return <>{children}</>;
}
