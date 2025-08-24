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

export default function Login() {
  const authContext = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [currentStep, setCurrentStep] = useState<"email" | "password">("email");

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
    if (data.user) authContext.logIn();

    setLoading(false);
  }

  // async function signUpWithEmail() {
  //   setLoading(true);
  //   const {
  //     data: { session },
  //     error,
  //   } = await supabase.auth.signUp({
  //     email: email,
  //     password: password,
  //   });

  //   if (error) Alert.alert(error.message);
  //   if (!session)
  //     Alert.alert("Please check your inbox for email verification!");
  //   setLoading(false);
  // }

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
    [errorOpacity, errorTranslateY],
  );

  // Hide error animation
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
    [emailError, hideError],
  );

  return (
    <View style={styles.mainContainer}>
      {/* Spotlight SVG - Fixed position, stays behind everything */}
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
              <Text style={[styles.title, { color: theme.text }]}>
                Login or Signup
              </Text>

              {/* Error message with animation */}
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

              {/* Password field with animation */}
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
                onPress={
                  currentStep === "email" ? handleContinue : signInWithEmail
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
    zIndex: 0, // Behind content
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
  button: {
    padding: 12,
    borderRadius: 5,
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
