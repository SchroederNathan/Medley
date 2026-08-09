import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import React, { useCallback, useContext, useEffect } from "react";
import {
  AppStateStatus,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ThemeContext } from "../../contexts/theme-context";
import { useAppState } from "../../hooks/use-app-state";

// A curtain of light draped over the top of the screen, rays rippling as if in
// a slow breeze.
//
// The whole effect is one time-driven shader. `u_t` runs 0..1 on a loop and
// every term that uses it does so at an integer multiple, so u_t = 1 is
// identical to u_t = 0 and the loop is seamless with linear, non-reversing
// repeat.
//
// Each ray is drawn individually (see the ray() calls in main) so it can have
// its own swing speed, swing amplitude and fade cycle. Two earlier approaches
// failed here and are worth not repeating: a single repeating sine across x
// moves every ray in lockstep at one rate, and baking a fixed curve into the
// shader while animating the canvas transform only slides a rigid bend past.
//
// Note for anyone editing this: driving Skia uniforms from a Reanimated shared
// value DOES repaint, but only if the shared value is written with `.set()`.
// React Compiler is enabled, and a plain `sv.value = withRepeat(...)` silently
// never animates, which makes the canvas look frozen and is easy to misread as
// a Skia limitation.
const SKSL = `
uniform float2 u_res;
uniform float  u_t;
uniform float  u_top;    // screen-heights of canvas sitting above the screen
uniform float  u_total;  // full canvas height, in screen-heights

float hash(float2 p) {
  return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
}

// One ray: a soft band that hangs straight DOWN at rest. Its centre swings
// side to side, and the swing reaches further down the ray later (LAG), so the
// ray leans and curves as it moves and straightens as it settles.
//
// There is deliberately no built-in slant — every bit of visible angle comes
// out of the drag, so the rays look tilted because they are moving rather than
// because they were drawn tilted.
//
// Two swing components per ray, at different rates. A single sine oscillates
// at one constant rate; summing two makes the ray visibly speed up and slow
// down. Every ray gets its own pair, so no two move alike.
// ys is measured in SCREEN heights from the screen's top edge, so it is
// negative in the part of the canvas that overhangs above the screen. Every
// vertical constant below is therefore a fraction of the screen, and stays put
// if the canvas geometry changes.
float ray(float x, float ys, float t, float base, float halfWidth,
          float a1, float s1, float p1,
          float a2, float s2, float p2,
          float bobAmp, float bobSpeed, float bobPhase) {
  float TAU = 6.2831853;
  // How far the swing lags per screen-height down the ray. Note this is a delay
  // in TIME, so the resulting phase lag scales with the ray's swing speed —
  // raising the speeds means lowering this to keep the same amount of curve.
  float LAG = 0.33;
  float td = t - ys * LAG;
  float swing = a1 * sin((td * s1 + p1) * TAU)
              + a2 * sin((td * s2 + p2) * TAU);
  float f = 1.0 - smoothstep(0.0, halfWidth, abs(x - (base + swing)));
  // Gentler than squaring: keeps the ray soft-edged so wide rays read as
  // blurred light rather than as bands with a visible boundary. Lower is
  // blurrier.
  f = pow(f, 1.25);

  // Each ray fades out at its own height, and that height drifts up and down,
  // so the ray lengthens and shortens — it bobs. This has to be per-ray: a
  // single fade applied after summing moves every ray together.
  float yy = ys + bobAmp * sin((t * bobSpeed + bobPhase) * TAU);
  float fade = 1.0 - smoothstep(0.04, 0.36, yy);

  return f * fade;
}

// Independent opacity cycle per ray. depth is how far it fades: low values
// just breathe, high values take the ray most of the way out and back.
float breathe(float t, float speed, float phase, float depth) {
  float TAU = 6.2831853;
  return (1.0 - depth) + depth * (0.5 + 0.5 * sin((t * speed + phase) * TAU));
}

half4 main(float2 fragCoord) {
  float TAU = 6.2831853;

  float x = fragCoord.x / u_res.x;
  // Screen-heights below the screen's top edge; negative in the overhang.
  float ys = (fragCoord.y / u_res.y) * u_total - u_top;
  float t = u_t;

  // Six rays across the width, each with its own width, brightness, pair of
  // swing rates, bob and fade cycle. All speeds are whole numbers so every ray
  // returns to its starting state at t = 1 and the loop stays seamless.
  //
  // Every ray fades deep (breathe depth 0.80-0.90, so it drops to 10-20% and
  // comes back) and their fade phases are spread evenly around the loop. That
  // is what makes it read as an aurora: bands surface and dissolve in turn
  // rather than all sitting there at once. It also keeps six rays from washing
  // into one flat glow — only some are near full brightness at any moment,
  // which is why they can be packed closer than the earlier shallow-fade
  // versions allowed.
  float v = 0.0;
  v += ray(x, ys, t, 0.02, 0.26, 0.090, 2.0, 0.00, 0.032, 3.0, 0.20, 0.055, 1.0, 0.00) * breathe(t, 1.0, 0.00, 0.85) * 0.85;
  v += ray(x, ys, t, 0.22, 0.23, 0.072, 3.0, 0.31, 0.038, 2.0, 0.55, 0.066, 1.0, 0.30) * breathe(t, 2.0, 0.17, 0.90) * 0.90;
  v += ray(x, ys, t, 0.42, 0.29, 0.105, 2.0, 0.62, 0.029, 4.0, 0.10, 0.050, 2.0, 0.60) * breathe(t, 1.0, 0.33, 0.80) * 0.82;
  v += ray(x, ys, t, 0.62, 0.24, 0.080, 3.0, 0.14, 0.035, 2.0, 0.80, 0.060, 1.0, 0.85) * breathe(t, 3.0, 0.50, 0.90) * 0.88;
  v += ray(x, ys, t, 0.82, 0.28, 0.096, 2.0, 0.45, 0.032, 3.0, 0.35, 0.055, 2.0, 0.20) * breathe(t, 2.0, 0.67, 0.85) * 0.84;
  v += ray(x, ys, t, 1.00, 0.24, 0.077, 3.0, 0.78, 0.042, 2.0, 0.05, 0.066, 1.0, 0.55) * breathe(t, 1.0, 0.83, 0.88) * 0.86;

  // Soften the canvas's own top edge so pulling the screen down far never
  // reveals a hard cut where the overhang ends.
  v *= smoothstep(-u_top, -u_top + 0.12, ys);

  // Soft-compress rather than clamp. The rays are summed, so wherever several
  // overlap the total ran past 1.0 and clamped flat — a solid patch with no
  // gradient left inside it, which is what made heavy overlaps look like a
  // block of colour. This rolls off asymptotically instead: overlaps still read
  // brighter than a lone ray, but nothing ever reaches a hard ceiling, so the
  // light keeps its internal shape.
  float v2 = v / (1.0 + v);
  float a = clamp(v2 * 0.36, 0.0, 1.0);

  // Grain, matched to the target's noise. Also does the job of dithering:
  // large low-alpha gradients band badly on the #0A0A0A background.
  //
  // Cells are 2 physical pixels, not per-pixel: the target's grain stays
  // visible when the screen is viewed below native resolution, and 1px hash
  // noise averages away under any downscale. 3px cells were tried and read as
  // visibly chunky blocks next to the target. Keep RENDER_SCALE at 1 so the
  // cells stay square.
  //
  // The floor term keeps most of the grain in fully dark areas: alpha clamps
  // at 0 there, so only the positive half of the noise survives, which is
  // exactly the dark-area speckle the target shows. The floor is faded out
  // before both canvas edges — grain past the light would otherwise end in a
  // visible line where the canvas does.
  float g = (1.0 - smoothstep(0.24, 0.43, ys))
          * smoothstep(-u_top, -u_top + 0.12, ys);
  a += (hash(floor(fragCoord / 0.5)) - 0.5) * 0.13 * (0.55 * g + 0.45 * v2);
  a = clamp(a, 0.0, 1.0);

  // Tint drifts slightly across the rays and over time, so the light is not
  // one flat colour. Both ends lean cool on purpose: the target's glow is a
  // steel blue-grey, with blue clearly above red and green at both ends.
  float m = 0.5 + 0.5 * sin((x * 1.3 + t) * TAU);
  float3 tint = mix(float3(0.72, 0.78, 0.92), float3(0.80, 0.83, 0.92), m);

  float3 rgb = tint * a;
  return half4(rgb.r, rgb.g, rgb.b, a);
}
`;

const SHADER = Skia.RuntimeEffect.Make(SKSL);

// Canvas geometry, in screen-heights. The aurora is anchored at the top of the
// screen and continues OVERHANG above it — that hidden part is what a
// pull-to-refresh drags into view. BELOW only has to reach past the point the
// light fades out at, so there is no reason to shade the rest of the screen.
const OVERHANG = 0.35;
const BELOW = 0.45;
const CANVAS_H = OVERHANG + BELOW;

// Full resolution. The rays themselves are low-frequency enough to shade at
// half scale, but the grain is not: scaling up smooths it into mush. Cost is
// acceptable because the canvas only covers the top CANVAS_H of the screen and
// the shader is a handful of sines per fragment.
const RENDER_SCALE = 1;

// One loop of the whole pattern. Every per-ray speed is a whole-number
// multiple of it, which is what keeps the loop seamless, so this scales the
// whole effect's pace at once.
//
// To change only one kind of motion, edit the per-ray speeds instead: the
// swing speeds (2-4 here) drive the horizontal panning, the bob speeds (1-2)
// drive the vertical drift. They have to stay whole numbers.
const LOOP_MS = 19000;

type AuroraBackgroundProps = {
  /** Master opacity, for screens that stage the aurora in. Defaults to 1. */
  intensity?: number;
  /**
   * A scroll view's contentOffset.y. When it goes negative (the user drags
   * past the top) the aurora follows the drag, revealing the part that
   * overhangs above the screen. Omit on screens that do not scroll.
   */
  scrollOffset?: SharedValue<number> | null;
};

type AuroraProps = AuroraBackgroundProps & { background: string };

const Aurora = ({ intensity = 1, background, scrollOffset }: AuroraProps) => {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const boxWidth = width;
  const boxHeight = height * CANVAS_H;
  const canvasWidth = boxWidth * RENDER_SCALE;
  const canvasHeight = boxHeight * RENDER_SCALE;

  // Screens without a scroll view pass nothing; this keeps the hook count and
  // the worklet's dependencies stable either way.
  const noScroll = useSharedValue(0);
  const scroll = scrollOffset ?? noScroll;

  const t = useSharedValue(0);

  // React Compiler is enabled, so shared values must go through get()/set();
  // assigning `.value` here leaves the animation silently never running, and
  // the canvas then looks like Skia is refusing to repaint.
  const startDrift = useCallback(() => {
    // Linear and non-reversing: the pattern is periodic in u_t, so it flows
    // continuously instead of easing back and forth.
    t.set(
      withRepeat(
        withTiming(1, { duration: LOOP_MS, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [t]);

  const stopDrift = useCallback(() => cancelAnimation(t), [t]);

  useEffect(() => {
    // Reduce Motion still gets the curtain, just held still. That is what the
    // SVG this replaced always looked like.
    if (reducedMotion) return;
    startDrift();
  }, [reducedMotion, startDrift]);

  // Unmount only. Never cancel before assigning a replacement animation: the
  // cancel is a scheduled self-assign on the UI thread and can land after the
  // new animation has started, freezing the drift. (This is also why the effect
  // can look dead after a Fast Refresh — reload rather than trusting it.)
  useEffect(() => stopDrift, [stopDrift]);

  const onAppStateChange = useCallback(
    (status: AppStateStatus) => {
      if (reducedMotion) return;
      if (status === "active") {
        startDrift();
      } else {
        // A full-width shader should not keep repainting behind a backgrounded
        // app.
        stopDrift();
      }
    },
    [reducedMotion, startDrift, stopDrift]
  );

  useAppState(onAppStateChange);

  const uniforms = useDerivedValue(
    () => ({
      u_res: [canvasWidth, canvasHeight],
      u_t: t.get(),
      u_top: OVERHANG,
      u_total: CANVAS_H,
    }),
    [t, canvasWidth, canvasHeight]
  );

  // Follow an overscroll drag only. contentOffset.y goes negative when the
  // user pulls past the top, and matching it 1:1 drags the overhang into view;
  // normal downward scrolling (positive offset) leaves the aurora put.
  const followStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.min(0, scroll.get()) }],
  }));

  if (!SHADER) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: background, opacity: intensity },
      ]}
    >
      {/* Pulled up by OVERHANG so that much of the aurora sits above the
          screen, ready to be dragged into view. Centring the undersized canvas
          inside a box of the true size means the scale-up expands about the
          box's centre and lands exactly on its bounds, which avoids the
          translate-vs-scale ordering footgun. */}
      <Animated.View
        style={[
          styles.box,
          {
            width: boxWidth,
            height: boxHeight,
            top: -height * OVERHANG,
          },
          followStyle,
        ]}
      >
        <Canvas
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: [{ scale: 1 / RENDER_SCALE }],
          }}
        >
          <Fill>
            <Shader source={SHADER} uniforms={uniforms} />
          </Fill>
        </Canvas>
      </Animated.View>
    </View>
  );
};

export const AuroraBackground = ({
  intensity,
  scrollOffset,
}: AuroraBackgroundProps) => {
  const { theme } = useContext(ThemeContext);

  // Light mode gets nothing: a pale curtain on #FFFFFF is invisible and a dark
  // one reads as a smudge. Gating here keeps the shader and its animation from
  // mounting at all.
  if (theme.mode !== "dark") return null;

  // The aurora paints the base colour itself. Screens layered on top of it are
  // transparent (the tab stacks set contentStyle to transparent), so if this
  // did not paint, whatever the navigator defaults to would show through.
  return (
    <Aurora
      intensity={intensity}
      background={theme.background}
      scrollOffset={scrollOffset}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    // Top-anchored: the canvas only covers the upper part of the screen.
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  box: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
