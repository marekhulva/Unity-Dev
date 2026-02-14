export const VibrantTheme = {
  // Screen-specific gradient themes
  gradients: {
    daily: {
      // Sunrise theme - warm and energizing
      colors: [
        ['#FF006E', '#FB5607', '#FFBE0B'], // Pink → Orange → Yellow
        ['#FB5607', '#FFBE0B', '#FB8500'], // Orange → Yellow → Amber
        ['#FFBE0B', '#FB8500', '#FF006E'], // Yellow → Amber → Pink
      ],
    },
    progress: {
      // Northern lights - cool and mystical
      colors: [
        ['#00F5FF', '#00D4FF', '#8B5CF6'], // Cyan → Blue → Purple
        ['#00D4FF', '#8B5CF6', '#06FFA5'], // Blue → Purple → Green
        ['#8B5CF6', '#06FFA5', '#00F5FF'], // Purple → Green → Cyan
      ],
    },
    social: {
      // Sunset vibes - social and warm
      colors: [
        ['#FF006E', '#C77DFF', '#7209B7'], // Pink → Lavender → Purple
        ['#C77DFF', '#7209B7', '#560BAD'], // Lavender → Purple → Deep Purple
        ['#7209B7', '#560BAD', '#FF006E'], // Purple → Deep Purple → Pink
      ],
    },
    profile: {
      // Deep space - personal and infinite
      colors: [
        ['#0D1B2A', '#1B263B', '#415A77'], // Deep Blue gradients
        ['#1B263B', '#415A77', '#778DA9'], // Navy → Steel Blue
        ['#415A77', '#778DA9', '#0D1B2A'], // Steel Blue → Gray Blue → Deep
      ],
    },
  },

  // Vibrant accent colors
  colors: {
    primary: {
      electric: '#00D4FF',    // Electric Blue
      neon: '#FF006E',        // Neon Pink
      lime: '#06FFA5',        // Lime Green
      violet: '#8B5CF6',      // Violet
      amber: '#FB8500',       // Amber
      coral: '#FF4365',       // Coral
    },
    
    // Glass effects with color tints
    glass: {
      pink: 'rgba(255, 0, 110, 0.1)',
      blue: 'rgba(0, 212, 255, 0.1)',
      green: 'rgba(6, 255, 165, 0.1)',
      purple: 'rgba(139, 92, 246, 0.1)',
      amber: 'rgba(251, 133, 0, 0.1)',
    },

    // Neon glows
    glow: {
      pink: 'rgba(255, 0, 110, 0.4)',
      blue: 'rgba(0, 212, 255, 0.4)',
      green: 'rgba(6, 255, 165, 0.4)',
      purple: 'rgba(139, 92, 246, 0.4)',
      amber: 'rgba(251, 133, 0, 0.4)',
    },

    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      tertiary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.5)',
    },

    // Interactive states
    interactive: {
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.05)',
    },
  },

  // Component-specific styles
  components: {
    card: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: {
        color: '#FF006E',
        opacity: 0.3,
        radius: 20,
        offset: { width: 0, height: 10 },
      },
    },
    
    button: {
      primary: {
        background: ['#FF006E', '#8B5CF6'],
        text: '#FFFFFF',
      },
      secondary: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.2)',
        text: '#FFFFFF',
      },
    },

    tab: {
      active: {
        background: 'rgba(255, 255, 255, 0.15)',
        border: 'rgba(255, 255, 255, 0.3)',
        text: '#FFFFFF',
      },
      inactive: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
        text: 'rgba(255, 255, 255, 0.7)',
      },
    },
  },

  // Animation configurations
  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      bounce: [0.68, -0.55, 0.265, 1.55],
      smooth: [0.4, 0, 0.2, 1],
    },
  },
};