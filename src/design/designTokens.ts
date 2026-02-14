// Design Tokens for Best App
// Ensures consistent spacing, typography, and visual elements across the entire app

export const DesignTokens = {
  // SPACING SYSTEM
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    xxxxxl: 48,
  },

  // TYPOGRAPHY SCALE
  typography: {
    sizes: {
      xs: 11,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
      xxxxl: 28,
      xxxxxl: 32,
      display: 36,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
    letterSpacing: {
      tighter: -0.5,
      tight: -0.25,
      normal: 0,
      wide: 0.25,
      wider: 0.5,
      widest: 1,
    }
  },

  // BORDER RADIUS SCALE
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 24,
    full: 9999,
  },

  // ELEVATION/SHADOW SYSTEM
  elevation: {
    none: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    low: {
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    medium: {
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    high: {
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    highest: {
      shadowOpacity: 0.25,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    }
  },

  // ANIMATION TIMING
  animation: {
    duration: {
      instant: 0,
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
      slowest: 750,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    }
  },

  // CONSISTENT COMPONENT SIZES
  componentSizes: {
    button: {
      small: { height: 32, paddingHorizontal: 16 },
      medium: { height: 44, paddingHorizontal: 20 },
      large: { height: 56, paddingHorizontal: 24 },
    },
    input: {
      small: { height: 36, paddingHorizontal: 12 },
      medium: { height: 44, paddingHorizontal: 16 },
      large: { height: 52, paddingHorizontal: 20 },
    },
    avatar: {
      xs: 24,
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    },
    icon: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    }
  },

  // OPACITY SCALE
  opacity: {
    transparent: 0,
    subtle: 0.05,
    light: 0.1,
    medium: 0.2,
    strong: 0.4,
    heavy: 0.6,
    stronger: 0.8,
    opaque: 1,
  },

  // LAYOUT CONSTANTS
  layout: {
    headerHeight: 64,
    tabBarHeight: 70,
    screenPadding: 16,
    cardPadding: 16,
    sectionSpacing: 24,
    maxContentWidth: 400,
  },

  // GLASS MORPHISM PRESETS
  glassMorphism: {
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      blurIntensity: 20,
    },
    medium: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      blurIntensity: 40,
    },
    dark: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      blurIntensity: 60,
    }
  }
} as const;

// TYPE HELPERS
export type SpacingKey = keyof typeof DesignTokens.spacing;
export type TypographySizeKey = keyof typeof DesignTokens.typography.sizes;
export type BorderRadiusKey = keyof typeof DesignTokens.borderRadius;
export type ElevationKey = keyof typeof DesignTokens.elevation;