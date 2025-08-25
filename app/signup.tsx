import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  UIManager,
} from "react-native";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import { AuthContext } from "../contexts/auth-context";
import { fontFamily } from "../lib/fonts";
import { supabase } from "../lib/utils";
import AuthScreenLayout, {
  AuthScreenLayoutHandle,
} from "../components/ui/auth-screen-layout";
import { useRouter } from "expo-router";

export default function Signup() {
  const authContext = useContext(AuthContext);
  const layoutRef = useRef<AuthScreenLayoutHandle>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentStep, setCurrentStep] = useState<"email" | "password">("email");
  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Animation values (reuse same pattern as login)
  const passwordFieldOpacity = useRef(new Animated.Value(0)).current;
  const passwordFieldTranslateY = useRef(new Animated.Value(-20)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-10)).current;
  const passwordErrorOpacity = useRef(new Animated.Value(0)).current;
  const passwordErrorTranslateY = useRef(new Animated.Value(-10)).current;
  // Animated values only control opacity/translate; layout is handled by LayoutAnimation

  const router = useRouter();

  // Email validation function
  const validateEmail = useCallback((value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }, []);

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

  const showError = useCallback(
    (message: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setEmailError(message);
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
    [errorOpacity, errorTranslateY],
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
    ]).start(() => {
      setEmailError("");
    });
  }, [errorOpacity, errorTranslateY]);

  const showPasswordError = useCallback(
    (message: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPasswordError(message);
      Animated.parallel([
        Animated.timing(passwordErrorOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(passwordErrorTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [passwordErrorOpacity, passwordErrorTranslateY],
  );

  const hidePasswordError = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.parallel([
      Animated.timing(passwordErrorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(passwordErrorTranslateY, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPasswordError("");
    });
  }, [passwordErrorOpacity, passwordErrorTranslateY]);

  const handleContinue = useCallback(() => {
    if (!email.trim()) {
      showError("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }
    if (emailError) hideError();
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

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (emailError) hideError();
    },
    [emailError, hideError],
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (passwordError) hidePasswordError();
    },
    [passwordError, hidePasswordError],
  );

  const handleConfirmPasswordChange = useCallback(
    (text: string) => {
      setConfirmPassword(text);
      if (passwordError) hidePasswordError();
    },
    [passwordError, hidePasswordError],
  );

  async function signUpWithEmail() {
    if (!password || password.length < 6) {
      showPasswordError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showPasswordError("Passwords do not match");
      return;
    }
    hidePasswordError();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);

    if (data.user) {
      //   authContext.logIn();
      authContext.setUserId(data.user.id);
      layoutRef.current?.animateOut(() => router.push("/name"));
    }

    setLoading(false);
  }

  return (
    <AuthScreenLayout ref={layoutRef} title="Sign Up">
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
          <Animated.View
            style={[
              styles.errorContainer,
              {
                opacity: passwordErrorOpacity,
                transform: [{ translateY: passwordErrorTranslateY }],
                marginBottom: passwordError ? 8 : 0,
              },
            ]}
          >
            {passwordError ? (
              <Text style={[styles.errorText, { color: "#ff4444" }]}>
                {passwordError}
              </Text>
            ) : null}
          </Animated.View>
          <Input
            placeholder="Password"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={true}
            style={{ marginBottom: 12 }}
            keyboardType="visible-password"
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="next"
          />
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry={true}
            style={{ marginBottom: 24 }}
            keyboardType="visible-password"
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={signUpWithEmail}
          />
        </Animated.View>
      )}

      <Button
        title={
          currentStep === "email"
            ? "Continue"
            : loading
              ? "Creating Account..."
              : "Create Account"
        }
        onPress={currentStep === "email" ? handleContinue : signUpWithEmail}
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
