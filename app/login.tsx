import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert, Animated, LayoutAnimation, Platform, StyleSheet, Text, UIManager } from "react-native";
import AuthScreenLayout from "../components/ui/auth-screen-layout";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import { AuthContext } from "../contexts/auth-context";
import { fontFamily } from "../lib/fonts";
import { supabase } from "../lib/utils";

export default function Login() {
  const authContext = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [currentStep, setCurrentStep] = useState<"email" | "password">("email");
  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const router = useRouter();

  // Animation values
  const passwordFieldOpacity = useRef(new Animated.Value(0)).current;
  const passwordFieldTranslateY = useRef(new Animated.Value(-20)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-10)).current;

  async function signInWithEmail() {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    if (data.user) {
      //   authContext.logIn();
      authContext.setUserId(data.user.id);
      router.push("/name");
    }

    setLoading(false);
  }

  // Email validation function
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Animate in password field
  const animatePasswordField = useCallback(() => {
    setShowPassword(true);
    Animated.parallel([
      Animated.timing(passwordFieldOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(passwordFieldTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [passwordFieldOpacity, passwordFieldTranslateY]);

  // Show error animation
  const showError = useCallback(
    (errorMessage: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setEmailError(errorMessage);
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

  // Hide error animation
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
    ]).start(() => {
      setEmailError("");
    });
  }, [errorOpacity, errorTranslateY]);

  // Handle continue button press
  const handleContinue = useCallback(() => {
    if (!email.trim()) {
      showError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }

    // Hide any existing error
    if (emailError) {
      hideError();
    }

    // Move to password step
    setCurrentStep("password");
    animatePasswordField();
  }, [
    email,
    emailError,
    showError,
    validateEmail,
    hideError,
    animatePasswordField,
  ]);

  // Handle email change with optimized performance
  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (emailError) {
        hideError();
      }
    },
    [emailError, hideError]
  );

  return (
    <AuthScreenLayout title="Sign In">
      <Animated.View
        style={[
          styles.errorContainer,
          {
            opacity: errorOpacity,
            transform: [{ translateY: errorTranslateY }],
            marginBottom: emailError ? 8 : 0,
          },
        ]}
      >
        {emailError ? (
          <Text style={[styles.errorText, { color: "#ff4444" }]}>
            {emailError}
          </Text>
        ) : null}
      </Animated.View>

      <Input
        placeholder="email@address.com"
        value={email}
        onChangeText={handleEmailChange}
        style={{ marginBottom: 12 }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={currentStep === "email" ? handleContinue : undefined}
      />

      {showPassword && (
        <Animated.View
          style={[
            styles.passwordFieldContainer,
            {
              opacity: passwordFieldOpacity,
              transform: [{ translateY: passwordFieldTranslateY }],
            },
          ]}
        >
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            style={{ marginBottom: 24 }}
            keyboardType="visible-password"
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={signInWithEmail}
          />
        </Animated.View>
      )}

      <Button
        title={
          currentStep === "email"
            ? "Continue"
            : loading
              ? "Signing In..."
              : "Sign In"
        }
        onPress={currentStep === "email" ? handleContinue : signInWithEmail}
      />
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
  passwordFieldContainer: {
    position: "relative",
  },
});
