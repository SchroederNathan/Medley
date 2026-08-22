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
import { radius, spacing, type } from "../../constants/theme";
import { AuthContext } from "../../contexts/auth-context";
import { ThemeContext } from "../../contexts/theme-context";
import { useAddToLibrary } from "../../hooks/mutations";
import { UserMediaStatus } from "../../services/userMediaService";
import { ThemedText } from "./themed-text";

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
      : theme.primaryButtonBackground;
  const buttonBorder =
    variant === "secondary"
      ? theme.secondaryButtonBorder
      : theme.primaryButtonBorder;
  const buttonText =
    variant === "secondary"
      ? theme.secondaryButtonText
      : theme.primaryButtonText;

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
          <Text style={[styles.buttonText, { color: buttonText }]}>
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
                  {
                    borderColor:
                      theme.mode === "dark"
                        ? theme.secondaryButtonBorder
                        : theme.buttonBorder,
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.04)",
                  },
                  index > 0 ? { marginTop: spacing.sm } : null,
                  savingStatus === key && { opacity: 0.6 },
                ]}
                onPressIn={() => onPressStatus(key)}
                disabled={!!isSaving}
              >
                <ThemedText variant="subhead" weight="medium">
                  {label}
                </ThemedText>
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
    borderRadius: radius.lg,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  buttonText: {
    ...type.headline,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxxl,
  },
  dropdownContainer: {
    width: "100%",
  },
  dropdownContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  optionRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
