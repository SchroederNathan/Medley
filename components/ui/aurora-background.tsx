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
//
// Every constant below was fitted to a screen recording of the target, not
// chosen by eye. The measurements that pin each one are noted where it is
// defined; the ones worth knowing up front are:
//
//   - the curtain is a plateau above the screen's top edge that falls to
//     nothing by 0.24 screen-heights below it (half brightness at 0.13),
//   - it is violet throughout (blue > red > green), never green or warm,
//   - the rays lean, and the lean always opposes the direction the field is
//     currently drifting — which is why the lean is produced by a time lag
//     down the ray rather than by a baked-in slant,
//   - the target's horizontal spectrum decays smoothly with NO peak at any
//     frequency, so the rays must be irregular — scattered centres and widely
//     varied widths. Anything periodic (evenly spaced rays, or a sine used to
//     add fine detail) shows up as regularly spaced vertical lines.
//
// The measurement that catches that last point is the spectrum cycle by cycle,
// not summed into bands: a single sine can match a band's total energy while
// looking nothing like the target.
const SKSL = `
uniform float2 u_res;
uniform float  u_t;
uniform float  u_top;    // screen-heights of canvas sitting above the screen
uniform float  u_total;  // full canvas height, in screen-heights

// How far the swing lags per screen-height down the ray, in loop-normalised
// time. Measured at 4.0s per screen-height: in the target the rays' lean flips
// sign exactly when the field's drift reverses, and lean/drift-velocity is
// consistently ~4s. LOOP_MS is 14000, hence 4.0/14.0.
const float LAG = 0.2857;

// Vertical falloff. An isolated column in the target is flat above the screen's
// top edge, half-bright at ys = 0.13 and gone by ys = 0.235. The (1 - smoothstep)
// raised to a power is what fits that: the target's falloff is close to linear
// through its middle, and a plain smoothstep is off by 3x as much because it is
// an S-curve. These particular endpoints are wider than the isolated
// measurement because they are fitted to the finished output, after the
// soft-compress below has flattened the bright end.
const float FADE_A = -0.20;
const float FADE_B = 0.22;
const float FADE_P = 0.55;

const float EDGE_P = 1.6;        // ray edge softness
const float BOB_AMP = 0.01;      // per-ray fade-height drift, screen-heights

// How far each ray fades: 0.88 takes it down to 12% and back. Together with
// GAIN this sets how FILLED the curtain looks, and they are the constants to
// re-derive if that ever looks off. The measure is min/mean of the horizontal
// profile — how dark the gaps get relative to the average — read ON SCREEN,
// which matters (see the note on GAIN). The target sits at 0.694 near the top of
// the light; these values land on 0.696.
//
// The tempting alternative is narrowing the rays much further, which deepens the
// gaps and additionally fixes the last few percent of peak contrast — but past
// about 0.30 it puts several times the target's structure at 150-200px, and that
// busy-ness is worse than the contrast is better.
const float BREATHE_DEPTH = 0.88;

// Peak alpha. Fitted against the COMPOSITED result — the aurora over the app's
// #0A0A0A background — not against the light in isolation. That distinction is
// worth 33% of brightness: an earlier version fitted the light over pure black
// (which is what the target sits on), and once the app's background was added
// underneath, the on-screen mean came out at 42.9 against the target's 32.4. Too
// bright, and washed-out gaps, which is exactly what reads as "too filled".
//
// One consequence cannot be fixed here: the target's curtain fades to about
// 7.6/255 at its lower edge, which is below this app's background of 10/255, so
// the bottom of the light can never be as dark as the target's. Matching that
// would mean a pure-black app background.
const float GAIN = 0.2664;
const float PULSE_DEPTH = 0.40;  // global swell; target's bright:dim was 1.60

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
// Independent opacity cycle per ray. depth is how far it fades: low values
// just breathe, high values take the ray most of the way out and back.
//
// Two harmonics, not one: a single sine fades in and out like a metronome.
// The second, faster harmonic makes a ray sometimes linger bright, sometimes
// drop out early, so the fades read as random rather than scheduled. Its rate
// (speed * 2 + 1) stays a whole number, which keeps the loop seamless.
float breathe(float t, float speed, float phase, float depth) {
  float TAU = 6.2831853;
  float w = 0.5 + 0.5 * sin((t * speed + phase) * TAU);
  w = clamp(w + 0.25 * sin((t * (speed * 2.0 + 1.0) + phase * 3.1) * TAU), 0.0, 1.0);
  return (1.0 - depth) + depth * w;
}

// One ray: a soft band that hangs straight DOWN at rest. Its centre swings side
// to side, and because the swing is read at a LAGGED time further down the ray
// (td already carries the lag), the ray leans and curves while it moves and
// straightens as it settles.
//
// There is deliberately no built-in slant — every bit of visible angle comes
// out of the drag. The target confirms this is the right mechanism: its rays
// lean right while the field drifts left and left while it drifts right, which
// a fixed slant cannot do.
//
// Two swing components per ray, at different rates. A single sine oscillates at
// one constant rate; summing two makes the ray visibly speed up and slow down.
// Every ray gets its own pair, so no two move alike.
//
// ys is measured in SCREEN heights from the screen's top edge, so it is
// negative in the part of the canvas that overhangs above the screen. Every
// vertical constant is therefore a fraction of the screen and stays put if the
// canvas geometry changes.
float ray(float x, float ys, float td, float tw, float base, float halfWidth,
          float a1, float s1, float p1,
          float a2, float s2, float p2,
          float bobSpeed, float bobPhase,
          float brSpeed, float brPhase, float weight) {
  float TAU = 6.2831853;
  float swing = a1 * sin((td * s1 + p1) * TAU)
              + a2 * sin((td * s2 + p2) * TAU);
  float f = 1.0 - smoothstep(0.0, halfWidth, abs(x - (base + swing)));
  // Gentler than squaring: keeps the ray soft-edged so wide rays read as
  // blurred light rather than as bands with a visible boundary.
  f = pow(f, EDGE_P);

  // Each ray fades out at its own height, and that height drifts up and down,
  // so the ray lengthens and shortens — it bobs. Kept small: in the target the
  // horizontal contrast is almost the same at every depth, and a large bob
  // makes the lower edge scallop into separate lobes, which the target does not
  // do.
  float yy = ys + BOB_AMP * sin((tw * bobSpeed + bobPhase) * TAU);
  float fade = pow(1.0 - smoothstep(FADE_A, FADE_B, yy), FADE_P);

  return f * fade * breathe(tw, brSpeed, brPhase, BREATHE_DEPTH) * weight;
}

half4 main(float2 fragCoord) {
  float TAU = 6.2831853;

  float x = fragCoord.x / u_res.x;
  // Screen-heights below the screen's top edge; negative in the overhang.
  float ys = (fragCoord.y / u_res.y) * u_total - u_top;
  float t = u_t;

  // Warped clock for all motion. u_t advances at a constant rate; summing two
  // periodic offsets onto it makes the effective playback rate swell between
  // roughly 0.5x and 1.5x, so the whole field surges and lulls instead of
  // drifting at one even speed. Both offset rates are whole numbers, so tw
  // still advances by exactly 1 per loop and the seamless wrap is preserved.
  float tw = t
           + 0.012 * sin((t * 3.0 + 0.37) * TAU)
           + 0.006 * sin((t * 7.0 + 0.71) * TAU);

  // The lagged clock, shared by every ray so they all lean together. Hoisted out
  // of ray() because it does not vary per ray.
  float td = tw - ys * LAG;

  // Nine rays, heavily overlapping — each is 0.17-0.44 wide while their centres
  // average 0.15 apart, so every ray overlaps three or four neighbours. That
  // overlap is what keeps the curtain shallow: the target's horizontal profile
  // only ever varies between 0.69x and 1.37x its own mean, and rays narrow
  // enough to stand apart cannot be that even.
  //
  // The centres are deliberately NOT on an even lattice. Evenly spaced rays put
  // all their energy at the lattice frequency and its harmonics, and that shows
  // up as regularly spaced vertical lines — the target's horizontal spectrum
  // instead decays smoothly with no peak anywhere. Scattering the centres (and
  // varying the widths widely) smears the lattice into that smooth continuum.
  // It is also why nine: with the centres scattered this far, eight no longer
  // span the width and leave a gap at one edge.
  //
  // Their fade phases are spread around the loop, so bands surface and dissolve
  // in turn rather than all sitting there at once (see BREATHE_DEPTH). All
  // speeds are whole numbers, so every ray returns to its starting state at
  // t = 1.
  float v = 0.0;
  v += ray(x, ys, td, tw, 0.000, 0.300, 0.0665, 3.0, 0.00, 0.0266, 2.0, 0.20, 1.0, 0.00, 1.0, 0.00, 0.85);
  v += ray(x, ys, td, tw, 0.336, 0.210, 0.0546, 3.0, 0.37, 0.0315, 2.0, 0.62, 2.0, 0.35, 2.0, 0.17, 0.90);
  v += ray(x, ys, td, tw, 0.165, 0.435, 0.0735, 3.0, 0.68, 0.0224, 4.0, 0.15, 1.0, 0.70, 1.0, 0.33, 0.86);
  v += ray(x, ys, td, tw, 0.543, 0.255, 0.0595, 3.0, 0.15, 0.0287, 2.0, 0.85, 2.0, 0.10, 3.0, 0.50, 0.88);
  v += ray(x, ys, td, tw, 0.366, 0.375, 0.0630, 3.0, 0.52, 0.0252, 2.0, 0.40, 1.0, 0.45, 2.0, 0.67, 0.84);
  v += ray(x, ys, td, tw, 0.804, 0.165, 0.0504, 3.0, 0.83, 0.0336, 4.0, 0.70, 2.0, 0.80, 1.0, 0.83, 0.89);
  v += ray(x, ys, td, tw, 0.816, 0.345, 0.0700, 3.0, 0.26, 0.0238, 2.0, 0.05, 1.0, 0.20, 2.0, 0.42, 0.87);
  v += ray(x, ys, td, tw, 1.263, 0.225, 0.0574, 3.0, 0.60, 0.0301, 2.0, 0.95, 2.0, 0.55, 3.0, 0.92, 0.85);
  v += ray(x, ys, td, tw, 1.035, 0.405, 0.0616, 3.0, 0.44, 0.0259, 4.0, 0.28, 1.0, 0.90, 2.0, 0.08, 0.86);

  // Soften the canvas's own top edge so pulling the screen down far never
  // reveals a hard cut where the overhang ends.
  v *= smoothstep(-u_top, -u_top + 0.12, ys);

  // Global swell. In the target, over seven seconds with the pull held still,
  // the whole curtain brightened and dimmed by a factor of 1.60 — a slow
  // breath over the entire field, on top of the per-ray fades.
  v *= 1.0 + PULSE_DEPTH * sin(t * TAU);

  // Soft-compress rather than clamp. The rays are summed, so wherever several
  // overlap the total ran past 1.0 and clamped flat — a solid patch with no
  // gradient left inside it, which is what made heavy overlaps look like a
  // block of colour. This rolls off asymptotically instead: overlaps still read
  // brighter than a lone ray, but nothing ever reaches a hard ceiling, so the
  // light keeps its internal shape.
  float v2 = v / (1.0 + v);

  // No separate fine-detail term here on purpose. The target does carry more
  // structure at 150-300px wavelengths than an even row of rays produces, and
  // adding sine striation to supply it does match that band's total energy — but
  // a sine puts all of it at one frequency, which reads as regularly spaced
  // vertical lines, and the target's spectrum has no peak at any frequency. The
  // structure comes from the rays being irregular, not from a texture laid over
  // them, so it is produced by the scattered centres and varied widths above.
  float a = clamp(v2 * GAIN, 0.0, 1.0);

  // Grain, matched to the target's noise. Also does the job of dithering:
  // large low-alpha gradients band badly on a near-black background.
  //
  // Cells are 2 physical pixels, not per-pixel: the target's grain stays
  // visible when the screen is viewed below native resolution, and 1px hash
  // noise averages away under any downscale. 3px cells were tried and read as
  // visibly chunky blocks next to the target. Keep RENDER_SCALE at 1 so the
  // cells stay square.
  //
  // 0.055 is calibrated, not guessed: the target's grain measures 2.1/255 of
  // high-frequency residual, and re-encoding our own frames through the same
  // h264 path a screen recording uses (which eats about a fifth of it) puts
  // 0.055 at 2.15. The 0.13 this replaces measured 6.1 — nearly 3x too coarse.
  //
  // The floor term keeps most of the grain in fully dark areas: alpha clamps
  // at 0 there, so only the positive half of the noise survives, which is
  // exactly the dark-area speckle the target shows. The floor is faded out
  // before both canvas edges — grain past the light would otherwise end in a
  // visible line where the canvas does.
  float g = (1.0 - smoothstep(0.11, 0.28, ys))
          * smoothstep(-u_top, -u_top + 0.12, ys);
  a += (hash(floor(fragCoord / 0.5)) - 0.5) * 0.055 * (0.55 * g + 0.45 * v2);
  a = clamp(a, 0.0, 1.0);

  // The light is violet, and it is violet everywhere. Measured across the
  // target's whole width, blue always leads red by 1.9-4.6/255 and green always
  // trails red by about 1/255 — so blue > red > green, a desaturated periwinkle,
  // with no green-leaning or warm rays anywhere. (An earlier version mixed blue
  // against yellow-green, which is why it read cooler in some columns and
  // warmer in others.) The mix ends are the strong and weak ends of that same
  // violet, so what varies across the width is how much cast the light carries,
  // not its hue. x * 1.5 puts about one and a half cycles across the width, to
  // match how far apart the target's most and least violet columns sit; the t
  // term keeps them slowly trading places (integer rate, loop stays seamless).
  float m = 0.5 + 0.5 * sin((x * 1.5 + t) * TAU);
  float3 tint = mix(float3(0.840, 0.810, 1.000), float3(0.930, 0.905, 1.000), m);

  float3 rgb = tint * a;
  return half4(rgb.r, rgb.g, rgb.b, a);
}
`;

const SHADER = Skia.RuntimeEffect.Make(SKSL);

// Canvas geometry, in screen-heights. The aurora is anchored at the top of the
// screen and continues OVERHANG above it — that hidden part is what a
// pull-to-refresh drags into view. BELOW only has to reach past the point the
// light fades out at, so there is no reason to shade the rest of the screen.
//
// The split changed but the total did not, so this costs no more to shade than
// before. In the target, a pull revealed 0.22 screen-heights of overhang with
// the light still at full plateau brightness at the very top of it, so 0.35 of
// overhang was too little — the canvas's own top fade was inside the range a
// normal pull reveals. 0.50 keeps it out of sight for pulls up to 0.38.
// BELOW only needs to clear the light (gone by ys = 0.24 including the bob) and
// the grain floor (faded out by 0.28).
const OVERHANG = 0.5;
const BELOW = 0.3;
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
// 14s is not arbitrary. The target's field swings side to side with a period of
// about 4.6s, which is this divided by 3 — hence every ray's primary swing
// speed is 3. Changing LOOP_MS rescales that swing, and LAG in the shader is
// expressed in loop-normalised time, so it has to be rescaled to match
// (LAG = 4.0 / LOOP_seconds).
//
// To change only one kind of motion, edit the per-ray speeds instead: the
// primary swing speed (3) sets the side-to-side period, the secondary (2 and 4)
// makes rays speed up and slow down, and the bob speeds (1-2) drive the
// vertical drift. They have to stay whole numbers.
//
// On top of this constant rate, the shader's tw warp makes the perceived
// speed swell and settle within the loop, so the drift is not metronomic.
const LOOP_MS = 14000;

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
