import {
  useDerivedValue,
  type DerivedValue,
  type SharedValue,
} from "react-native-reanimated";

type UseTrackDistanceParams = {
  containerWidth: SharedValue<number>;
  containerHeight: SharedValue<number>;
  trackAngle: number;
};

/**
 * Total distance the overlay must travel to fully traverse the container at a given angle.
 * Equals the projection span of the rectangle onto the track direction:
 *   W·|cos α| + H·|sin α|
 *
 * 0° → W, 90° → H, diagonal → √(W² + H²).
 */
export const useTrackDistance = ({
  containerWidth,
  containerHeight,
  trackAngle,
}: UseTrackDistanceParams): DerivedValue<number> => {
  const trackDistance = useDerivedValue(() => {
    const containerW = containerWidth.get();
    const containerH = containerHeight.get();

    if (containerW <= 0 || containerH <= 0) {
      return 0;
    }

    const angleRad = (trackAngle * Math.PI) / 180;
    return (
      containerW * Math.abs(Math.cos(angleRad)) +
      containerH * Math.abs(Math.sin(angleRad))
    );
  });

  return trackDistance;
};
