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
      setTimeout(() => {
        handleMeasurement();
      }, 500); // Wait for sure the target to be mounted
    }
  }, [isTargetMounted]);

  const onTargetLayout = () => {
    if (isTargetMounted === false) {
      setIsTargetMounted(true);
    }
  };

  return { measurement, targetRef, onTargetLayout };
};
