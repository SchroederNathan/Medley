import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useState } from "react";
import { Image } from "react-native";
import BootSplash from "react-native-bootsplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { NotificationsProvider } from "../components/providers/notifications-provider";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthContext, AuthProvider } from "../contexts/auth-context";
import {
  ContentReadyContext,
  ContentReadyProvider,
} from "../contexts/content-ready-context";
import { OverlayProvider } from "../contexts/overlay-context";
import { ThemeContext, ThemeProvider } from "../contexts/theme-context";
import { ToastProvider } from "../contexts/toast-context";
import { useAppFonts } from "../lib/fonts";

Sentry.init({
  dsn: "https://077c17121b5dbfc5cecd4ec763173e88@o4510162802049024.ingest.us.sentry.io/4510162816073728",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const RootLayout = () => {
  const { fontsLoaded, fontError } = useAppFonts();

  // Don't render anything while fonts are loading or if there's an error
  // The splash screen will remain visible until fonts are loaded and auth is ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContainer />
    </ThemeProvider>
  );
};

const AppContainer = () => {
  return (
    <QueryProvider>
      <AuthProviderWithSplash />
    </QueryProvider>
  );
};

const AuthProviderWithSplash = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <AuthProvider>
      <ContentReadyProvider>
        <SplashController>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <OverlayProvider>
                <ToastProvider>
                  <NotificationsProvider>
                    <StatusBar style="auto" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: theme.background },
                      }}
                    >
                      <Stack.Screen
                        name="(protected)"
                        options={{
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="onboarding"
                        options={{
                          animation: "none",
                        }}
                      />
                      <Stack.Screen
                        name="login"
                        options={{
                          animation: "none",
                        }}
                      />
                      <Stack.Screen
                        name="name"
                        options={{
                          animation: "none",
                        }}
                      />
                      <Stack.Screen
                        name="media-preferences"
                        options={{
                          animation: "none",
                        }}
                      />
                      <Stack.Screen
                        name="signup"
                        options={{
                          animation: "none",
                        }}
                      />
                    </Stack>
                  </NotificationsProvider>
                </ToastProvider>
              </OverlayProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SplashController>
      </ContentReadyProvider>
    </AuthProvider>
  );
};

// Separate animated splash component following react-native-bootsplash docs pattern
const AnimatedBootSplash = ({
  onAnimationEnd,
  ready,
}: {
  onAnimationEnd: () => void;
  ready: boolean;
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../assets/bootsplash/manifest.json"),
    logo: require("../assets/bootsplash/logo.png"),
    statusBarTranslucent: false,
    navigationBarTranslucent: false,
    ready: ready, // This triggers animate() when true

    animate: () => {
      // Hide the native splash immediately, we'll drive the JS animation
      BootSplash.hide({ fade: false });

      // Fade out the background first
      opacity.value = withTiming(0, {
        duration: 500,
      });

      // Then move the logo up and off-screen with a slow start, then accel
      translateY.value = withDelay(
        120,
        withTiming(
          -800,
          {
            duration: 500,
            easing: Easing.in(Easing.cubic), // start slow, then take off
          },
          () => {
            // Once the logo animation completes, remove the splash
            runOnJS(onAnimationEnd)();
          }
        )
      );
    },
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      {...container}
      style={[
        container.style,
        animatedContainerStyle,
        {
          // Ensure we fade the visible background
          backgroundColor: "#0A0A0A",
        },
      ]}
    >
      <Animated.View style={animatedLogoStyle}>
        <Image {...logo} style={[logo.style, { width: 240, height: 240 }]} />
      </Animated.View>
    </Animated.View>
  );
};

const SplashController = ({ children }: { children: React.ReactNode }) => {
  const { isReady, isLoggedIn } = useContext(AuthContext);
  const { isContentReady } = useContext(ContentReadyContext);
  const [splashVisible, setSplashVisible] = useState(true);

  // Determine if we should hide splash - this triggers the animation
  const shouldHideSplash = isReady && (!isLoggedIn || isContentReady);

  return (
    <>
      {children}
      {splashVisible && (
        <AnimatedBootSplash
          ready={shouldHideSplash}
          onAnimationEnd={() => {
            setSplashVisible(false);
          }}
        />
      )}
    </>
  );
};

export default Sentry.wrap(RootLayout);
