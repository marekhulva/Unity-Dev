import { withSpring, withTiming, withSequence, withDelay, withRepeat, Easing } from 'react-native-reanimated';
import { DesignTokens } from './designTokens';

// SPRING CONFIGURATIONS
export const SpringPresets = {
  gentle: { damping: 20, stiffness: 90 },
  bouncy: { damping: 15, stiffness: 150 },
  snappy: { damping: 25, stiffness: 200 },
  smooth: { damping: 30, stiffness: 100 },
  wobbly: { damping: 10, stiffness: 120 },
} as const;

// TIMING CONFIGURATIONS
export const TimingPresets = {
  fast: { duration: DesignTokens.animation.duration.fast, easing: Easing.out(Easing.cubic) },
  normal: { duration: DesignTokens.animation.duration.normal, easing: Easing.out(Easing.quad) },
  slow: { duration: DesignTokens.animation.duration.slow, easing: Easing.out(Easing.ease) },
  linear: { duration: DesignTokens.animation.duration.normal, easing: Easing.linear },
  elastic: { duration: DesignTokens.animation.duration.slower, easing: Easing.elastic(1.2) },
} as const;

// COMMON ANIMATION PATTERNS
export const AnimationPatterns = {
  // SCALE ANIMATIONS
  scaleIn: (value: number = 1) => withSpring(value, SpringPresets.bouncy),
  scaleOut: () => withSpring(0, SpringPresets.smooth),
  pulse: (from: number = 1, to: number = 1.05) => 
    withRepeat(
      withSequence(
        withSpring(to, SpringPresets.gentle),
        withSpring(from, SpringPresets.gentle)
      ),
      -1,
      true
    ),

  // FADE ANIMATIONS
  fadeIn: (duration: number = DesignTokens.animation.duration.normal) =>
    withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
  fadeOut: (duration: number = DesignTokens.animation.duration.normal) =>
    withTiming(0, { duration, easing: Easing.in(Easing.ease) }),
  
  // SLIDE ANIMATIONS
  slideUp: (distance: number = 20) =>
    withSpring(-distance, SpringPresets.snappy),
  slideDown: (distance: number = 20) =>
    withSpring(distance, SpringPresets.snappy),
  slideLeft: (distance: number = 20) =>
    withSpring(-distance, SpringPresets.snappy),
  slideRight: (distance: number = 20) =>
    withSpring(distance, SpringPresets.snappy),

  // ROTATION ANIMATIONS
  rotate360: (duration: number = 2000) =>
    withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1
    ),
  wobble: () =>
    withRepeat(
      withSequence(
        withTiming(-3, { duration: 100 }),
        withTiming(3, { duration: 100 }),
        withTiming(-3, { duration: 100 }),
        withTiming(0, { duration: 100 })
      ),
      -1,
      true
    ),

  // SPECIAL EFFECTS
  shimmer: () =>
    withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.ease }),
        withTiming(0.3, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    ),
  
  breathe: (from: number = 0.95, to: number = 1.05) =>
    withRepeat(
      withSequence(
        withTiming(to, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(from, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ),

  float: (distance: number = 8) =>
    withRepeat(
      withSequence(
        withTiming(-distance, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(distance, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ),

  // INTERACTION ANIMATIONS
  pressIn: () => withSpring(0.96, SpringPresets.snappy),
  pressOut: () => withSpring(1, SpringPresets.bouncy),
  
  // LOADING ANIMATIONS
  loadingDots: (delay: number = 0) =>
    withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      )
    ),

  // ENTRANCE ANIMATIONS
  slideInFromBottom: (distance: number = 50, delay: number = 0) =>
    withDelay(
      delay,
      withSpring(0, {
        ...SpringPresets.bouncy,
        initialVelocity: distance,
      })
    ),

  slideInFromTop: (distance: number = -50, delay: number = 0) =>
    withDelay(
      delay,
      withSpring(0, {
        ...SpringPresets.bouncy,
        initialVelocity: Math.abs(distance),
      })
    ),

  slideInFromLeft: (distance: number = -100, delay: number = 0) =>
    withDelay(
      delay,
      withSpring(0, {
        ...SpringPresets.snappy,
        initialVelocity: Math.abs(distance),
      })
    ),

  slideInFromRight: (distance: number = 100, delay: number = 0) =>
    withDelay(
      delay,
      withSpring(0, {
        ...SpringPresets.snappy,
        initialVelocity: distance,
      })
    ),

  // SUCCESS/ERROR ANIMATIONS
  successPulse: () =>
    withSequence(
      withSpring(1.1, SpringPresets.bouncy),
      withSpring(1, SpringPresets.gentle)
    ),

  errorShake: () =>
    withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    ),

  // STAGGERED ANIMATIONS
  staggeredFadeIn: (index: number, baseDelay: number = 100) =>
    withDelay(
      index * baseDelay,
      withTiming(1, TimingPresets.normal)
    ),

  staggeredSlideIn: (index: number, baseDelay: number = 100, distance: number = 20) =>
    withDelay(
      index * baseDelay,
      withSpring(0, {
        ...SpringPresets.bouncy,
        initialVelocity: distance,
      })
    ),
} as const;

// ANIMATION SEQUENCES
export const AnimationSequences = {
  // Card entrance sequence
  cardEntrance: (delay: number = 0) => ({
    scale: withDelay(delay, AnimationPatterns.scaleIn()),
    opacity: withDelay(delay + 50, AnimationPatterns.fadeIn()),
    translateY: withDelay(delay, AnimationPatterns.slideInFromBottom(30)),
  }),

  // Modal entrance sequence
  modalEntrance: () => ({
    scale: withSequence(
      withSpring(1.05, SpringPresets.bouncy),
      withSpring(1, SpringPresets.gentle)
    ),
    opacity: AnimationPatterns.fadeIn(DesignTokens.animation.duration.fast),
  }),

  // Success feedback sequence
  successFeedback: () => ({
    scale: withSequence(
      withSpring(1.2, SpringPresets.bouncy),
      withSpring(1, SpringPresets.gentle)
    ),
    rotate: withSequence(
      withTiming(5, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    ),
  }),

  // Loading sequence
  loadingSequence: () => ({
    scale: AnimationPatterns.breathe(0.95, 1.05),
    opacity: AnimationPatterns.shimmer(),
  }),

  // Attention seeking sequence
  attentionSeeker: () => ({
    scale: withRepeat(
      withSequence(
        withSpring(1.05, SpringPresets.bouncy),
        withSpring(1, SpringPresets.gentle)
      ),
      3,
      false
    ),
    rotate: withRepeat(
      withSequence(
        withTiming(2, { duration: 100 }),
        withTiming(-2, { duration: 100 }),
        withTiming(0, { duration: 100 })
      ),
      3,
      false
    ),
  }),

  // Luxury sequences
  luxuryEntrance: (delay: number = 0) => ({
    scale: withDelay(delay, withSequence(
      withSpring(0.95, SpringPresets.gentle),
      withSpring(1.02, SpringPresets.bouncy),
      withSpring(1, SpringPresets.smooth)
    )),
    opacity: withDelay(delay, AnimationPatterns.fadeIn(600)),
    translateY: withDelay(delay, AnimationPatterns.slideInFromBottom(20)),
  }),

  goldShimmer: () => ({
    translateX: withRepeat(
      withSequence(
        withTiming(-50, { duration: 0 }),
        withTiming(350, { duration: 1500, easing: Easing.ease })
      ),
      -1,
      false
    ),
    opacity: withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.8, { duration: 750, easing: Easing.ease }),
        withTiming(0, { duration: 750, easing: Easing.ease })
      ),
      -1,
      false
    ),
  }),

  premiumHover: () => ({
    scale: withSpring(1.02, SpringPresets.gentle),
    shadowOpacity: withTiming(0.2, { duration: 200 }),
    shadowRadius: withTiming(12, { duration: 200 }),
  }),
} as const;

// HELPER FUNCTIONS
export const createStaggeredAnimation = (
  items: any[],
  animationFn: (index: number) => any,
  baseDelay: number = 100
) => {
  return items.map((_, index) => animationFn(index * baseDelay));
};

export const createDelayedAnimation = (
  animation: any,
  delay: number
) => withDelay(delay, animation);

// TYPE EXPORTS
export type SpringPresetKey = keyof typeof SpringPresets;
export type TimingPresetKey = keyof typeof TimingPresets;