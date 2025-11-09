import { useEffect, useState } from "react";
import {
  measure,
  MeasuredDimensions,
  runOnUI,
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";

// Hook to measure the position and dimensions of a target component
// Used to animate from the original profile image position to expanded view
export const useTargetMeasurement = () => {
  const [isTargetMounted, setIsTargetMounted] = useState(false);
  const targetRef = useAnimatedRef();

  const measurement = useSharedValue<MeasuredDimensions | null>(null);

  const handleMeasurement = () => {
    runOnUI(() => {
      const result = measure(targetRef);
      if (result === null) {
        return;
      }
      measurement.value = result;
    })();
  };

  useEffect(() => {
    if (isTargetMounted) {
      // Measure immediately and also after a short delay to ensure accurate positioning
      handleMeasurement();
      const timeout = setTimeout(() => {
        handleMeasurement();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isTargetMounted]);

  const onTargetLayout = () => {
    // Measure on every layout change to track position accurately
    if (isTargetMounted) {
      // Use requestAnimationFrame to ensure measurement happens after layout
      requestAnimationFrame(() => {
        handleMeasurement();
      });
    } else {
      setIsTargetMounted(true);
    }
  };

  return { measurement, targetRef, onTargetLayout, handleMeasurement };
};
