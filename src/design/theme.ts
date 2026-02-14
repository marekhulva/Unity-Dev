import { colors, radii, spacing, typography } from './tokens';

export const theme = {
  colors: {
    bg: colors.black, // Pure black base
    fg: colors.white,
    muted: colors.silver500,
    line: colors.silver800,
    glassBorder: 'rgba(255,255,255,0.06)',
    glassFill: 'rgba(0,0,0,0.4)', // Dark glass
    glassTint: 'rgba(255,255,255,0.02)',
    glow: colors.shine,
    // Neon glows for different action types
    glowGoal: colors.neonBlue,
    glowPerformance: colors.neonGreen,
    glowCommitment: colors.neonPurple,
    glowStreak: colors.neonYellow,
    // Dim glows for borders
    glowGoalDim: colors.neonBlueDim,
    glowPerformanceDim: colors.neonGreenDim,
    glowCommitmentDim: colors.neonPurpleDim,
    // Status
    success: colors.green, 
    warn: colors.yellow, 
    danger: colors.red,
  },
  radii, spacing, typography,
};
export type Theme = typeof theme;