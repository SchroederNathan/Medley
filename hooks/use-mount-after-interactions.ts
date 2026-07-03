import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

/**
 * Returns false for the mounting render and flips to true once the first
 * frame has painted and any running interactions/animations have settled.
 *
 * Use to defer mounting heavy offscreen content (e.g. hidden pager pages)
 * so the initial commit of a screen stays small and navigation doesn't hang.
 */
export function useMountAfterInteractions(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  return ready;
}
