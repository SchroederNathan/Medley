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
import { AuthContext } from "../contexts/auth-context";
import { fontFamily } from "../lib/fonts";

export default function NameScreen() {
  const authContext = useContext(AuthContext);
  const layoutRef = useRef<AuthScreenLayoutHandle>(null);
  const [firstName, setFirstName] = useState<string>("");
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
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorTranslateY, {
          toValue: 0,
          duration: 200,
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
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(errorTranslateY, {
        toValue: -10,
        duration: 200,
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
            marginBottom: error ? 8 : 0,
          },
        ]}
      >
        {error ? (
          <Text style={[styles.errorText, { color: "#ff4444" }]}>{error}</Text>
        ) : null}
      </Animated.View>
      <Input
        placeholder="Your first name"
        value={firstName}
        onChangeText={onChangeFirstName}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={onContinue}
        style={{ marginBottom: 24 }}
      />

      <Button title="Continue" onPress={onContinue} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.regular,
    opacity: 0.8,
    paddingHorizontal: 4,
  },
});
