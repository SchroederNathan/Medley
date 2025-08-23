import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import "react-native-url-polyfill/auto";
import Auth from "./auth";
import { supabase } from "./lib/utils";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <View>
      <Auth />
      {session && session.user && <Text>{session.user.id}</Text>}
    </View>
  );
}
