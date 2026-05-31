import { createContext, useContext } from "react";

/**
 * Tracks which profile block (if any) is currently in inline edit mode.
 * Only one block edits at a time; tapping elsewhere on the profile or scrolling
 * clears it. Blocks read this to derive their own edit state and remain usable
 * standalone (the hook returns null when no provider is present).
 */
export type ProfileEditModeValue = {
  editingBlockId: string | null;
  setEditingBlockId: (id: string | null) => void;
};

export const ProfileEditModeContext =
  createContext<ProfileEditModeValue | null>(null);

export const useProfileEditMode = (): ProfileEditModeValue | null =>
  useContext(ProfileEditModeContext);
