import { createContext, useContext } from "react";
import type { LayoutRectangle } from "react-native";

/**
 * Tracks which profile block (if any) is currently in inline edit mode.
 * Only one block edits at a time; tapping anywhere outside the block or
 * scrolling clears it. Blocks read this to derive their own edit state and
 * remain usable standalone (the hook returns null when no provider is
 * present).
 */
export type ProfileEditModeValue = {
  editingBlockId: string | null;
  setEditingBlockId: (id: string | null) => void;
  /**
   * Reports the window-coordinate frame of the block currently editing. The
   * screen claims any touch that starts outside this frame (capture phase)
   * and turns it into a dismiss, so taps inside the block — cards, delete
   * badges, the Done button — keep working while everything else cancels
   * edit mode. Pass null when leaving edit mode.
   */
  setEditingBlockFrame: (frame: LayoutRectangle | null) => void;
};

export const ProfileEditModeContext =
  createContext<ProfileEditModeValue | null>(null);

export const useProfileEditMode = (): ProfileEditModeValue | null =>
  useContext(ProfileEditModeContext);
