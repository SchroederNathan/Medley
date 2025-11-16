import {
  createContext,
  FC,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useRef,
} from "react";
import { Dimensions, TextInput } from "react-native";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Core sizing constants used across header/search transitions
export const SEARCHBAR_HEIGHT = 52;
export const EDIT_HOME_CONTAINER_WIDTH = 65;
export const SETTINGS_CONTAINER_WIDTH = 65;
export const CANCEL_CONTAINER_WIDTH = 75;
const LEFT_PADDING = 16;

// Search field width differs between views
export const SEARCHBAR_FAVORITES_WIDTH =
  Dimensions.get("window").width -
  EDIT_HOME_CONTAINER_WIDTH -
  SETTINGS_CONTAINER_WIDTH;
export const SEARCHBAR_COMMANDS_WIDTH =
  Dimensions.get("window").width - CANCEL_CONTAINER_WIDTH - LEFT_PADDING;

// Negative drag distances drive the "pull to search" reveal
export const TRIGGER_DRAG_DISTANCE = -100;
export const FULL_DRAG_DISTANCE = -200;

type ScreenView = "favorites" | "commands";

type ContextValue = {
  inputRef: RefObject<TextInput | null>;
  screenView: SharedValue<ScreenView>;
  isListDragging: SharedValue<boolean>;
  offsetY: SharedValue<number>;
  blurIntensity: SharedValue<number>;
  onGoToCommands: () => void;
  onGoToFavorites: () => void;
};

const HomeAnimationContext = createContext<ContextValue>({} as ContextValue);

export const HomeAnimationProvider: FC<PropsWithChildren> = ({ children }) => {
  const inputRef = useRef<TextInput>(null);

  // Shared values coordinate animation state across components
  const screenView = useSharedValue<ScreenView>("favorites");
  const offsetY = useSharedValue(0);
  const isListDragging = useSharedValue(false);
  const blurIntensity = useSharedValue(0);

  // Transition into command mode focuses input and increases blur
  const onGoToCommands = useCallback(() => {
    screenView.value = "commands";
    blurIntensity.value = withTiming(100);
    // Delay focus to ensure animation has settled
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Returning to favorites drops blur and defocuses input
  const onGoToFavorites = useCallback(() => {
    screenView.value = "favorites";
    blurIntensity.value = withTiming(0);
    inputRef.current?.blur();
  }, []);

  const value = {
    inputRef,
    screenView,
    isListDragging,
    offsetY,
    blurIntensity,
    onGoToCommands,
    onGoToFavorites,
  };

  return (
    <HomeAnimationContext.Provider value={value}>
      {children}
    </HomeAnimationContext.Provider>
  );
};

export const useHomeAnimation = () => {
  const context = useContext(HomeAnimationContext);

  if (!context) {
    throw new Error(
      "useHomeAnimation must be used within an HomeAnimationProvider"
    );
  }

  return context;
};
