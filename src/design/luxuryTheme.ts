export const LuxuryTheme = {
  // Screen-specific gradient themes - Black, Silver, Gold variations
  gradients: {
    daily: {
      // Morning gold - luxurious and warm
      colors: [
        ['#0A0A0A', '#1C1C1C', '#2A2A2A'], // Deep black base
        ['#1C1C1C', '#FFD700', '#1C1C1C'], // Gold accent pulse
        ['#2A2A2A', '#C0C0C0', '#0A0A0A'], // Silver shimmer
      ],
    },
    progress: {
      // Platinum progress - sleek and professional
      colors: [
        ['#000000', '#1A1A1A', '#2D2D2D'], // Pure black gradient
        ['#1A1A1A', '#E5E4E2', '#1A1A1A'], // Platinum shine
        ['#2D2D2D', '#FFD700', '#000000'], // Gold highlight
      ],
    },
    social: {
      // Rose gold social - warm metallics
      colors: [
        ['#0D0D0D', '#1F1F1F', '#0D0D0D'], // Charcoal base
        ['#1F1F1F', '#B76E79', '#1F1F1F'], // Rose gold accent
        ['#0D0D0D', '#FFD700', '#0D0D0D'], // Gold shimmer
      ],
    },
    profile: {
      // Obsidian depth - mysterious and premium
      colors: [
        ['#000000', '#0A0A0A', '#141414'], // True black depth
        ['#0A0A0A', '#C0C0C0', '#0A0A0A'], // Silver accent
        ['#141414', '#FFD700', '#000000'], // Gold trim
      ],
    },
  },

  // Luxury color palette
  colors: {
    primary: {
      gold: '#E7B43A',           // Brand Gold (reserved for wins/streaks)
      champagne: '#F7E7CE',      // Champagne Gold
      silver: '#C0C0C0',         // Pure Silver
      platinum: '#E5E4E2',       // Platinum
      gunmetal: '#2C3539',       // Gunmetal Gray
      obsidian: '#0A0A0A',       // Deep Black
      pearl: '#F8F8F8',          // Pearl White
      roseGold: '#B76E79',       // Rose Gold
    },
    
    // Glass effects with metallic tints
    glass: {
      gold: 'rgba(231, 180, 58, 0.08)',
      silver: 'rgba(192, 192, 192, 0.08)',
      platinum: 'rgba(229, 228, 226, 0.08)',
      obsidian: 'rgba(10, 10, 10, 0.3)',
      pearl: 'rgba(248, 248, 248, 0.05)',
    },

    // Metallic glows
    glow: {
      gold: 'rgba(231, 180, 58, 0.3)',
      goldPulse: 'rgba(231, 180, 58, 0.5)', // For animated glow
      silver: 'rgba(192, 192, 192, 0.3)',
      platinum: 'rgba(229, 228, 226, 0.4)',
      warm: 'rgba(231, 180, 58, 0.2)',
      cool: 'rgba(192, 192, 192, 0.2)',
    },

    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E4E2',
      tertiary: '#A7B0B7',      // Muted tertiary
      muted: '#808080',
      gold: '#E7B43A',
      silver: '#C0C0C0',
    },

    // Background shades - Enhanced depth
    background: {
      primary: '#0B0F12',        // Darker base
      secondary: '#12171C',      // Card background
      tertiary: '#141414',
      card: '#12171C',           // Lighter cards
      hover: 'rgba(231, 180, 58, 0.05)',
      radialStart: '#0B0F12',
      radialEnd: '#000000',
      cardBorder: 'rgba(31, 39, 48, 0.24)', // #1F2730 at 24%
    },

    // Surface gradients for cards
    surface: {
      cardTop: '#13181D',        // Slightly darker top
      cardBottom: '#12171C',     // Original card color bottom
    },

    // Interactive states
    interactive: {
      hover: 'rgba(231, 180, 58, 0.1)',
      active: 'rgba(231, 180, 58, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.02)',
      border: 'rgba(192, 192, 192, 0.1)',
    },

    // Semantic category colors
    semantic: {
      category: {
        fitness: '#22C55E',        // Green for fitness
        mindfulness: '#60A5FA',    // Blue for mindfulness
        productivity: '#A78BFA',   // Purple for productivity
      },
    },
  },

  // Motion tokens
  motion: {
    springScale: {
      duration: 120,
      damping: 15,
      stiffness: 300,
    },
    slowPulseDuration: 2000,
    glowPulse: {
      duration: 2000,
      easing: 'ease-in-out',
    },
    pulseSlow: {
      duration: 2000,
      easing: 'ease-in-out',
      intensity: 0.3, // Low intensity for subtle effect
    },
    tapPop: {
      duration: 120,
      scale: { from: 0.92, to: 1.0 },
      damping: 20,
      stiffness: 400,
    },
    checkmark: {
      duration: 120,
      scale: { from: 0.9, to: 1.0 },
    },
  },

  // Visual effects
  effects: {
    ringSweepHighlight: {
      duration: 800,
      easing: 'ease-out',
      delay: 200,
    },
  },

  // Spacing tokens
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    cardPadding: 16,
    headerGap: 14, // Increased from 12
    lineHeight: {
      body: 22, // Increased from 20
      title: 24,
    },
  },

  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    glow: {
      shadowColor: '#E7B43A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
  },

  // Component-specific styles
  components: {
    card: {
      background: '#12171C',
      border: 'rgba(31, 39, 48, 0.24)',
      shadow: {
        color: '#000000',
        opacity: 0.15,
        radius: 8,
        offset: { width: 0, height: 4 },
      },
    },
    
    button: {
      primary: {
        background: ['#E7B43A', '#F7E7CE'],
        text: '#000000',
      },
      secondary: {
        background: 'rgba(192, 192, 192, 0.1)',
        border: 'rgba(192, 192, 192, 0.2)',
        text: '#FFFFFF',
      },
      luxury: {
        background: 'rgba(231, 180, 58, 0.1)',
        border: 'rgba(231, 180, 58, 0.3)',
        text: '#E7B43A',
      },
    },

    tab: {
      active: {
        background: 'rgba(231, 180, 58, 0.1)',
        border: 'rgba(231, 180, 58, 0.3)',
        text: '#E7B43A',
      },
      inactive: {
        background: 'rgba(255, 255, 255, 0.02)',
        border: 'rgba(192, 192, 192, 0.08)',
        text: '#C0C0C0',
      },
    },

    accent: {
      gold: {
        light: 'rgba(231, 180, 58, 0.15)',
        medium: 'rgba(231, 180, 58, 0.3)',
        strong: 'rgba(231, 180, 58, 0.5)',
      },
      silver: {
        light: 'rgba(192, 192, 192, 0.15)',
        medium: 'rgba(192, 192, 192, 0.3)',
        strong: 'rgba(192, 192, 192, 0.5)',
      },
    },
  },

  // Gradient presets
  gradientPresets: {
    goldShine: ['#E7B43A', '#F7E7CE', '#E7B43A'],
    silverShine: ['#C0C0C0', '#E5E4E2', '#C0C0C0'],
    blackFade: ['#0B0F12', '#12171C', '#0B0F12'],
    luxuryMix: ['#E7B43A', '#C0C0C0', '#E7B43A'],
    obsidianDepth: ['#0B0F12', '#12171C', '#1A1F24'],
    radialGradient: ['#0B0F12', '#000000'],
  },
};