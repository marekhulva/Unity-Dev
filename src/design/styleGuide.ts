// Style Guide for Luxury Consistency
// Provides standardized styling patterns across the entire app

import { LuxuryTheme } from './luxuryTheme';
import { DesignTokens } from './designTokens';

export const StyleGuide = {
  // COMMON COMPONENT STYLES
  components: {
    // Card styles
    card: {
      base: {
        borderRadius: DesignTokens.borderRadius.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden' as const,
      },
      elevated: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        ...DesignTokens.elevation.medium,
        shadowColor: '#000000',
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      },
      premium: {
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderColor: 'rgba(255, 215, 0, 0.2)',
        shadowColor: LuxuryTheme.colors.primary.gold,
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    },

    // Button styles
    button: {
      primary: {
        borderRadius: DesignTokens.borderRadius.lg,
        paddingHorizontal: DesignTokens.spacing.lg,
        paddingVertical: DesignTokens.spacing.md,
        minHeight: 44,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        flexDirection: 'row' as const,
      },
      secondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      luxury: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    },

    // Input styles
    input: {
      base: {
        borderRadius: DesignTokens.borderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: DesignTokens.spacing.md,
        paddingVertical: DesignTokens.spacing.sm,
        fontSize: DesignTokens.typography.sizes.md,
        color: LuxuryTheme.colors.text.primary,
        minHeight: 44,
      },
      focused: {
        borderColor: LuxuryTheme.colors.primary.gold,
        backgroundColor: 'rgba(255, 215, 0, 0.03)',
        shadowColor: LuxuryTheme.colors.primary.gold,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      error: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
      },
    },

    // Badge styles
    badge: {
      base: {
        borderRadius: DesignTokens.borderRadius.full,
        paddingHorizontal: DesignTokens.spacing.sm,
        paddingVertical: 4,
        alignSelf: 'flex-start' as const,
      },
      success: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
      },
      warning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
      },
      error: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
      },
      gold: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
      },
    },

    // Modal styles
    modal: {
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        paddingHorizontal: DesignTokens.spacing.lg,
      },
      content: {
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        borderRadius: DesignTokens.borderRadius.xxl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: DesignTokens.spacing.xl,
        maxWidth: 400,
        width: '100%',
        ...DesignTokens.elevation.high,
        shadowColor: '#000000',
      },
      header: {
        marginBottom: DesignTokens.spacing.lg,
        paddingBottom: DesignTokens.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },

  // TYPOGRAPHY PATTERNS
  typography: {
    // Headers
    h1: {
      fontSize: DesignTokens.typography.sizes.xxxxl,
      fontWeight: DesignTokens.typography.weights.bold,
      color: LuxuryTheme.colors.text.primary,
      lineHeight: DesignTokens.typography.sizes.xxxxl * 1.2,
      letterSpacing: DesignTokens.typography.letterSpacing.tight,
    },
    h2: {
      fontSize: DesignTokens.typography.sizes.xxxl,
      fontWeight: DesignTokens.typography.weights.semibold,
      color: LuxuryTheme.colors.text.primary,
      lineHeight: DesignTokens.typography.sizes.xxxl * 1.3,
      letterSpacing: DesignTokens.typography.letterSpacing.normal,
    },
    h3: {
      fontSize: DesignTokens.typography.sizes.xxl,
      fontWeight: DesignTokens.typography.weights.semibold,
      color: LuxuryTheme.colors.text.primary,
      lineHeight: DesignTokens.typography.sizes.xxl * 1.4,
      letterSpacing: DesignTokens.typography.letterSpacing.normal,
    },

    // Body text
    body: {
      fontSize: DesignTokens.typography.sizes.md,
      fontWeight: DesignTokens.typography.weights.regular,
      color: LuxuryTheme.colors.text.secondary,
      lineHeight: DesignTokens.typography.sizes.md * 1.5,
      letterSpacing: DesignTokens.typography.letterSpacing.normal,
    },
    bodyLarge: {
      fontSize: DesignTokens.typography.sizes.lg,
      fontWeight: DesignTokens.typography.weights.regular,
      color: LuxuryTheme.colors.text.secondary,
      lineHeight: DesignTokens.typography.sizes.lg * 1.5,
      letterSpacing: DesignTokens.typography.letterSpacing.normal,
    },
    bodySmall: {
      fontSize: DesignTokens.typography.sizes.sm,
      fontWeight: DesignTokens.typography.weights.regular,
      color: LuxuryTheme.colors.text.tertiary,
      lineHeight: DesignTokens.typography.sizes.sm * 1.4,
      letterSpacing: DesignTokens.typography.letterSpacing.wide,
    },

    // Special text
    caption: {
      fontSize: DesignTokens.typography.sizes.xs,
      fontWeight: DesignTokens.typography.weights.medium,
      color: LuxuryTheme.colors.text.muted,
      lineHeight: DesignTokens.typography.sizes.xs * 1.3,
      letterSpacing: DesignTokens.typography.letterSpacing.wider,
      textTransform: 'uppercase' as const,
    },
    label: {
      fontSize: DesignTokens.typography.sizes.sm,
      fontWeight: DesignTokens.typography.weights.semibold,
      color: LuxuryTheme.colors.text.secondary,
      lineHeight: DesignTokens.typography.sizes.sm * 1.2,
      letterSpacing: DesignTokens.typography.letterSpacing.wide,
    },
    button: {
      fontSize: DesignTokens.typography.sizes.md,
      fontWeight: DesignTokens.typography.weights.semibold,
      letterSpacing: DesignTokens.typography.letterSpacing.wide,
      textAlign: 'center' as const,
    },
    link: {
      fontSize: DesignTokens.typography.sizes.md,
      fontWeight: DesignTokens.typography.weights.medium,
      color: LuxuryTheme.colors.primary.gold,
      textDecorationLine: 'underline' as const,
    },
  },

  // LAYOUT PATTERNS
  layout: {
    // Screen containers
    screen: {
      flex: 1,
      backgroundColor: LuxuryTheme.colors.background.primary,
      paddingHorizontal: DesignTokens.spacing.lg,
    },
    safeScreen: {
      flex: 1,
      backgroundColor: LuxuryTheme.colors.background.primary,
      paddingTop: 44, // Status bar height
      paddingHorizontal: DesignTokens.spacing.lg,
    },

    // Section containers
    section: {
      marginBottom: DesignTokens.spacing.xl,
    },
    sectionHeader: {
      marginBottom: DesignTokens.spacing.md,
    },

    // List items
    listItem: {
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    listItemLast: {
      borderBottomWidth: 0,
    },

    // Form layouts
    formGroup: {
      marginBottom: DesignTokens.spacing.lg,
    },
    formRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: DesignTokens.spacing.md,
    },
    formActions: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      gap: DesignTokens.spacing.md,
      marginTop: DesignTokens.spacing.xl,
    },
  },

  // EFFECTS AND GRADIENTS
  effects: {
    // Glass morphism
    glass: {
      light: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      medium: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      dark: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    },

    // Glow effects
    glow: {
      gold: {
        shadowColor: LuxuryTheme.colors.primary.gold,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      silver: {
        shadowColor: LuxuryTheme.colors.primary.silver,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      subtle: {
        shadowColor: '#FFFFFF',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    },

    // Gradient combinations
    gradients: {
      gold: [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne],
      silver: [LuxuryTheme.colors.primary.silver, LuxuryTheme.colors.primary.platinum],
      dark: ['rgba(0, 0, 0, 0.9)', 'rgba(20, 20, 20, 0.9)'],
      luxury: [
        'rgba(255, 215, 0, 0.1)',
        'rgba(192, 192, 192, 0.05)',
        'rgba(255, 215, 0, 0.1)'
      ],
    },
  },

  // INTERACTION STATES
  states: {
    // Interactive elements
    interactive: {
      default: {
        opacity: 1,
        transform: [{ scale: 1 }],
      },
      pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
      },
      disabled: {
        opacity: 0.4,
      },
      focused: {
        borderColor: LuxuryTheme.colors.primary.gold,
        shadowColor: LuxuryTheme.colors.primary.gold,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    },

    // Status states
    status: {
      success: {
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
      warning: {
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
      },
      error: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
      info: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
    },
  },
} as const;

// UTILITY FUNCTIONS
export const StyleUtils = {
  // Combine styles safely
  combine: (...styles: any[]) => {
    return Object.assign({}, ...styles.filter(Boolean));
  },

  // Apply responsive sizing
  responsive: (base: number, factor: number = 1.2) => ({
    small: base * 0.8,
    medium: base,
    large: base * factor,
  }),

  // Create consistent spacing
  spacing: (multiplier: number = 1) => DesignTokens.spacing.md * multiplier,

  // Create status-based styles
  statusStyle: (status: 'success' | 'warning' | 'error' | 'info' | 'default') => {
    if (status === 'default') return {};
    return StyleGuide.states.status[status];
  },

  // Create elevation shadow
  elevation: (level: keyof typeof DesignTokens.elevation) => DesignTokens.elevation[level],

  // Create consistent border radius
  borderRadius: (size: keyof typeof DesignTokens.borderRadius) => ({
    borderRadius: DesignTokens.borderRadius[size],
  }),
};