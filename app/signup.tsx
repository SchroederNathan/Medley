import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
} from "react-native-svg";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import { AuthContext } from "../contexts/auth-context";
import { ThemeContext } from "../contexts/theme-context";
import { fontFamily } from "../lib/fonts";
import { supabase } from "../lib/utils";

export default function Signup() {
  const { theme } = useContext(ThemeContext);
  const authContext = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentStep, setCurrentStep] = useState<"email" | "password">("email");

  const router = useRouter();

  // Animation values (reuse same pattern as login)
  const passwordFieldOpacity = useRef(new Animated.Value(0)).current;
  const passwordFieldTranslateY = useRef(new Animated.Value(-20)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-10)).current;
  const passwordErrorOpacity = useRef(new Animated.Value(0)).current;
  const passwordErrorTranslateY = useRef(new Animated.Value(-10)).current;

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

    if (data.user) authContext.logIn();

    setLoading(false);
  }

  return (
    <View style={styles.mainContainer}>
      <Svg
        width="150%"
        height="100%"
        viewBox="0 0 500 550"
        style={styles.spotlightSvg}
      >
        <Defs>
          <Filter
            id="filter0_f_2_34"
            x="-167.2"
            y="-262.2"
            width="700.02"
            height="850.854"
            filterUnits="userSpaceOnUse"
          >
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <FeGaussianBlur
              stdDeviation="61.85"
              result="effect1_foregroundBlur_2_34"
            />
          </Filter>
        </Defs>
        <Path
          d="M-43.5 -81.5L7.5 -138.5L420.12 380.955L280.62 480.954L-43.5 -81.5Z"
          fill="#D4D4D4"
          fillOpacity="0.1"
          filter="url(#filter0_f_2_34)"
        />
      </Svg>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -150 : 0}
        enabled={true}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View style={styles.container}>
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: theme.text }]}>Sign Up</Text>

              <Animated.View
                style={[
                  styles.errorContainer,
                  {
                    opacity: errorOpacity,
                    transform: [{ translateY: errorTranslateY }],
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: "#ff4444" }]}>
                  {emailError}
                </Text>
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
                onSubmitEditing={
                  currentStep === "email" ? handleContinue : undefined
                }
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
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: "#ff4444" }]}>
                      {passwordError}
                    </Text>
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
                onPress={
                  currentStep === "email" ? handleContinue : signUpWithEmail
                }
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} strokeWidth={3} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    marginTop: 60,
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  spotlightSvg: {
    position: "absolute",
    top: -200,
    left: -150,
    width: "150%",
    height: "100%",
    zIndex: 0,
  },
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
  title: {
    fontSize: 32,
    paddingHorizontal: 12,
    marginBottom: 24,
    fontFamily: fontFamily.tanker.regular,
  },
  backButton: {
    position: "absolute",
    top: (Platform.OS === "ios" ? 52 : 40) + 52,
    left: 28,
    zIndex: 1000,
  },
});
