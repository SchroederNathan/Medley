import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { AuthContext } from "../../contexts/auth-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useAddToLibrary } from "../../hooks/mutations";
import { fontFamily } from "../../lib/fonts";
import { UserMediaStatus } from "../../services/userMediaService";

interface StatusButtonProps {
  title: string;
  icon?: React.ReactNode;
  mediaId: string;
  mediaType: "movie" | "tv_show" | "book" | "game";
  variant?: "primary" | "secondary";
  styles?: ViewStyle;
  onStatusSaved?: (status: UserMediaStatus) => void;
  initiallyOpen?: boolean;
}

const StatusButton = ({
  title,
  icon,
  mediaId,
  mediaType,
  variant = "primary",
  styles: additionalStyles,
  onStatusSaved,
  initiallyOpen = false,
}: StatusButtonProps) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const addToLibraryMutation = useAddToLibrary();

  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [savingStatus, setSavingStatus] = useState<UserMediaStatus | null>(
    null
  );
  const isSaving = addToLibraryMutation.isPending;

  // Use secondary colors for secondary variant, primary colors for primary variant
  const buttonBackground =
    variant === "secondary"
      ? theme.secondaryButtonBackground
      : theme.buttonBackground;
  const buttonBorder =
    variant === "secondary" ? theme.secondaryButtonBorder : theme.buttonBorder;

  const statusOptions: { key: UserMediaStatus; label: string }[] =
    useMemo(() => {
      const verbByType: Record<typeof mediaType, string> = {
        movie: "Watch",
        tv_show: "Watch",
        book: "Read",
        game: "Play",
      };
      const inProgressByType: Record<typeof mediaType, UserMediaStatus> = {
        movie: "watching",
        tv_show: "watching",
        book: "reading",
        game: "playing",
      };
      const completedLabelByType: Record<typeof mediaType, string> = {
        movie: "Seen",
        tv_show: "Seen",
        book: "Completed",
        game: "Completed",
      };

      const wantLabel = `Want to ${verbByType[mediaType]}`;
      const inProgress = inProgressByType[mediaType];
      const completedLabel = completedLabelByType[mediaType];

      return [
        { key: "want", label: wantLabel },
        {
          key: inProgress,
          label: verbByType[mediaType].endsWith("e")
            ? `${verbByType[mediaType]}ing`.replace("e", "ing")
            : `${verbByType[mediaType]}ing`,
        },
        { key: "completed", label: completedLabel },
      ];
    }, [mediaType]);

  const onToggleOpen = useCallback(() => {
    Haptics.selectionAsync();
    setIsOpen((prev) => !prev);
  }, []);

  const onPressStatus = useCallback(
    (status: UserMediaStatus) => {
      if (!user?.id || isSaving) return;
      setSavingStatus(status);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      addToLibraryMutation.mutate(
        { mediaId, status },
        {
          onSuccess: () => {
            onStatusSaved?.(status);
            setIsOpen(false);
            setSavingStatus(null);
          },
          onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Failed to save user media status", err);
            setSavingStatus(null);
          },
        }
      );
    },
    [mediaId, onStatusSaved, user?.id, isSaving, addToLibraryMutation]
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: buttonBorder },
        additionalStyles,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      layout={Layout.duration(220).easing(Easing.out(Easing.cubic))}
    >
      <TouchableOpacity onPressIn={onToggleOpen} activeOpacity={0.9}>
        <BlurView
          intensity={20}
          tint="default"
          style={[styles.header, { backgroundColor: buttonBackground }]}
        >
          {icon && icon}
          <Text
            style={[
              styles.buttonText,
              {
                color: variant === "secondary" ? theme.background : theme.text,
              },
            ]}
          >
            {title}
          </Text>
        </BlurView>
      </TouchableOpacity>

      {isOpen && (
        <Animated.View
          style={[
            styles.dropdownContainer,
            { backgroundColor: buttonBackground },
          ]}
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(120)}
          layout={Layout.duration(220).easing(Easing.out(Easing.cubic))}
        >
          <View style={styles.dropdownContent}>
            {statusOptions.map(({ key, label }, index) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionRow,
                  { borderColor: theme.secondaryButtonBorder },
                  index > 0 ? { marginTop: 8 } : null,
                  savingStatus === key && { opacity: 0.6 },
                ]}
                onPressIn={() => onPressStatus(key)}
                disabled={!!isSaving}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default StatusButton;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",

    fontFamily: fontFamily.plusJakarta.semiBold,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  dropdownContainer: {
    width: "100%",
  },
  dropdownContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  optionText: {
    fontSize: 14,
    fontFamily: fontFamily.plusJakarta.medium,
  },
});
