/**
 * Luxury Color Palette - Premium Black/Gold/Silver Theme
 * Easily reversible via feature flag: ui.social.luxuryTheme
 */

export const LuxuryColors = {
  // Primary Palette
  black: {
    pure: '#000000',           // Pure black for backgrounds
    soft: '#0A0A0A',           // Soft black
    medium: '#1A1A1A',         // Medium black for cards
  },
  
  gold: {
    primary: '#FFD700',        // Refined luminous gold (less brown)
    secondary: '#F4C430',      // Alternative gold
    accent: '#E7B43A',         // Original brand gold (fallback)
  },
  
  silver: {
    bright: '#E5E5E5',         // Bright silver for primary text
    medium: '#C0C0C0',         // Medium silver 
    text: '#A0A0A0',           // Secondary text silver
    dark: '#808080',           // Muted silver
    border: '#404040',         // Dark silver for borders
    divider: '#606060',        // Dividers
  },
  
  // Glows and Effects
  glow: {
    gold: 'rgba(255, 215, 0, 0.3)',        // Gold glow
    goldStrong: 'rgba(255, 215, 0, 0.5)',  // Strong gold glow
    goldSubtle: 'rgba(255, 215, 0, 0.15)', // Subtle gold glow
    silver: 'rgba(192, 192, 192, 0.2)',    // Silver glow
  },
  
  // Card Gradients
  gradients: {
    card: ['#1A1A1A', '#0A0A0A'],          // Card depth gradient
    cardHover: ['#1A1A1A', '#0F0F0F'],     // Hover state
    blackFade: ['#0A0A0A', '#000000'],     // Pure black fade
  },
  
  // Interactive States
  interactive: {
    default: '#C0C0C0',        // Silver default
    hover: '#FFD700',          // Gold on hover
    active: '#F4C430',         // Active gold
    disabled: '#404040',       // Dark silver disabled
  },
  
  // Borders
  borders: {
    default: 'rgba(64, 64, 64, 1)',        // Dark silver border
    hover: 'rgba(255, 215, 0, 0.3)',       // Gold glow border
    active: 'rgba(255, 215, 0, 0.5)',      // Strong gold border
    subtle: 'rgba(64, 64, 64, 0.5)',       // Subtle border
  },
  
  // Typography
  text: {
    primary: '#E5E5E5',        // Bright silver
    secondary: '#C0C0C0',      // Medium silver
    tertiary: '#808080',       // Dark silver
    muted: '#606060',          // Very muted
    gold: '#FFD700',           // Gold accent text
  },
  
  // Backgrounds
  background: {
    primary: '#000000',        // Pure black
    secondary: '#0A0A0A',      // Soft black
    card: '#1A1A1A',          // Card background
    elevated: '#0F0F0F',      // Slightly elevated
  },
};

/**
 * Get color based on feature flag
 * Falls back to original theme if luxury theme is disabled
 */
export const getThemedColor = (
  luxuryColor: string,
  defaultColor: string,
  isLuxuryEnabled: boolean
): string => {
  return isLuxuryEnabled ? luxuryColor : defaultColor;
};