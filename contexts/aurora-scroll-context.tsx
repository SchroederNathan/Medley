import { createContext, FC, PropsWithChildren, useContext } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

/**
 * One shared value that any scrolling screen publishes its `contentOffset.y`
 * into, so AuroraBackground can follow an overscroll drag and pull the part of
 * the aurora that sits above the screen into view.
 *
 * Deliberately separate from HomeAnimationContext's `offsetY`: that one also
 * drives the header, filter button and pull-to-search behaviour on home and
 * library, and those components stay mounted while other tabs are active — so
 * writing a third screen's scroll position into it would disturb them.
 */
const AuroraScrollContext = createContext<SharedValue<number> | null>(null);

export const AuroraScrollProvider: FC<PropsWithChildren> = ({ children }) => {
  const offset = useSharedValue(0);

  return (
    <AuroraScrollContext.Provider value={offset}>
      {children}
    </AuroraScrollContext.Provider>
  );
};

/** Null outside the provider — screens beyond the tabs simply don't publish. */
export const useAuroraScroll = () => useContext(AuroraScrollContext);
