import { useRouter } from "expo-router";
import { BookOpen, Clapperboard, Gamepad2 } from "lucide-react-native";
import React, { useContext, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import AuthScreenLayout, {
  AuthScreenLayoutHandle,
} from "../components/ui/auth-screen-layout";
import Button from "../components/ui/button";
import RadioCard from "../components/ui/radio-card";
import { AuthContext } from "../contexts/auth-context";

type Preference = "Movies" | "Games" | "Books";

export default function MediaPreferences() {
  const [selected, setSelected] = useState<Preference[]>([]);
  const authContext = useContext(AuthContext);
  const router = useRouter();
  const layoutRef = useRef<AuthScreenLayoutHandle>(null);
  const items = useMemo(
    () => [
      {
        key: "Movies" as Preference,
        title: "Movies",
        icon: <Clapperboard color="#fff" size={32} strokeWidth={1.5} />,
      },
      {
        key: "Games" as Preference,
        title: "Games",
        icon: <Gamepad2 color="#fff" size={32} strokeWidth={1.5} />,
      },
      {
        key: "Books" as Preference,
        title: "Books",
        icon: <BookOpen color="#fff" size={32} strokeWidth={1.5} />,
      },
    ],

    [],
  );

  const toggle = (key: Preference) => {
    setSelected((prev) => {
      const has = prev.includes(key);
      if (has) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, key];
    });
  };

  const onContinue = async () => {
    if (selected.length === 0) {
      Alert.alert("Select at least one");
      return;
    }

    try {
      await authContext.completeOnboarding(selected);
      layoutRef.current?.animateOut(() => router.push("/"));
    } catch (error) {
      console.error("Error completing onboarding:", error);
      Alert.alert("Error", "Failed to complete setup. Please try again.");
    }
  };

  return (
    <AuthScreenLayout ref={layoutRef} title="What interests you?">
      {items.map((item, idx) => (
        <RadioCard
          key={item.key}
          title={item.title}
          icon={item.icon}
          selected={selected.includes(item.key)}
          onPress={() => toggle(item.key)}
          style={{ marginBottom: idx === items.length - 1 ? 24 : 12 }}
        />
      ))}

      <Button title="Next" onPress={onContinue} styles={{ marginTop: 8 }} />
    </AuthScreenLayout>
  );
}
