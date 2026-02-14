// Design System - Centralized Exports
export { DesignTokens } from './designTokens';
export { LuxuryTheme } from './luxuryTheme';
export { StyleGuide, StyleUtils } from './styleGuide';
export { 
  SpringPresets,
  TimingPresets,
  AnimationPatterns,
  AnimationSequences,
  createStaggeredAnimation,
  createDelayedAnimation,
  type SpringPresetKey,
  type TimingPresetKey 
} from './animations';

// Re-export commonly used items for convenience
export const {
  spacing,
  typography,
  borderRadius,
  elevation,
  animation,
  componentSizes,
  glassMorphism
} = DesignTokens;

export const {
  colors,
  gradients,
  components,
  shadow
} = LuxuryTheme;

export const {
  scaleIn,
  fadeIn,
  pulse,
  breathe,
  pressIn,
  pressOut,
  successPulse,
  errorShake
} = AnimationPatterns;