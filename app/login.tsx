import React, { useContext, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import { AuthContext } from "../contexts/auth-context";
import { ThemeContext } from "../contexts/theme-context";
import { supabase } from "../lib/utils";

export default function Login() {
  const authContext = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    if (!session)
      Alert.alert("Please check your inbox for email verification!");
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          placeholder="email@address.com"
          value={email}
          onChangeText={setEmail}
          otherProps={{
            autoCapitalize: "none",
            keyboardType: "email-address",
          }}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          otherProps={{
            keyboardType: "visible-password",
            autoCapitalize: "none",
          }}
        />
      </View>
      <Button title="Get Started" onPress={signInWithEmail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    flex: 1,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },

  button: {
    padding: 12,
    borderRadius: 5,
  },
});
