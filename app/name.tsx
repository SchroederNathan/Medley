import { useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  UIManager,
} from "react-native";
import AuthScreenLayout, {
  AuthScreenLayoutHandle,
} from "../components/ui/auth-screen-layout";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import { motion, spacing, type } from "../constants/theme";
import { AuthContext } from "../contexts/auth-context";
import { ThemeContext } from "../contexts/theme-context";

export default function NameScreen() {
  const authContext = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const layoutRef = useRef<AuthScreenLayoutHandle>(null);
  // Prefilled with the name Clerk got from Apple/Google, when available.
  const [firstName, setFirstName] = useState<string>(
    authContext.user?.name ?? ""
  );
  const [error, setError] = useState<string>("");
  const router = useRouter();
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-10)).current;

  const showError = useCallback(
    (message: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setError(message);
      Animated.parallel([
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: motion.quick,
          useNativeDriver: true,
        }),
        Animated.timing(errorTranslateY, {
          toValue: 0,
          duration: motion.quick,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [errorOpacity, errorTranslateY]
  );

  const hideError = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.parallel([
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: motion.quick,
        useNativeDriver: true,
      }),
      Animated.timing(errorTranslateY, {
        toValue: -10,
        duration: motion.quick,
        useNativeDriver: true,
      }),
    ]).start(() => setError(""));
  }, [errorOpacity, errorTranslateY]);

  const onContinue = useCallback(() => {
    if (!firstName.trim()) {
      showError("Please enter your first name");
      return;
    }
    if (error) hideError();
    // Navigate to next onboarding step here if needed
    authContext.setUserName(firstName);
    layoutRef.current?.animateOut(() => router.push("/media-preferences"));
  }, [firstName, error, showError, hideError]);

  const onChangeFirstName = useCallback(
    (text: string) => {
      setFirstName(text);
      if (error) hideError();
    },
    [error, hideError]
  );

  return (
    <AuthScreenLayout ref={layoutRef} title="What should we call you?">
      <Animated.View
        style={[
          styles.errorContainer,
          {
            opacity: errorOpacity,
            transform: [{ translateY: errorTranslateY }],
            marginBottom: error ? spacing.sm : 0,
          },
        ]}
      >
        {error ? (
          <Text style={[styles.errorText, { color: theme.destructive }]}>
            {error}
          </Text>
        ) : null}
      </Animated.View>
      <Input
        placeholder="First Name"
        value={firstName}
        onChangeText={onChangeFirstName}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={onContinue}
        style={{ marginBottom: spacing.xxl }}
      />

      <Button title="Continue" onPress={onContinue} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    ...type.subhead,
  },
});
