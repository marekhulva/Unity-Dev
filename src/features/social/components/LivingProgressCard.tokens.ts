import { Dimensions } from 'react-native';

// Step A: Reference device (390dp) - NO SCALING YET
const BASE_WIDTH = 390;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Scale factor = 1 for Step A (will add safe scaling in Step B)
const SCALE = 1;

// Helper - currently just returns value (no scaling in Step A)
const scale = (value: number): number => value;

export const LivingProgressCardTokens = {
  // Card - HTML values 1:1 in dp
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  // Header - HTML values 1:1
  header: {
    marginBottom: 12,
    gap: 12,
  },

  // Avatar - HTML values 1:1
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },

  // User Info - HTML values 1:1
  userInfo: {
    gap: 2,
    username: {
      fontSize: 18,
      lineHeight: 22, // 18 * 1.2 rounded
      fontWeight: 'bold' as const,
      color: '#fff',
    },
    metadata: {
      fontSize: 14,
      lineHeight: 17, // 14 * 1.2 rounded
      color: '#888',
    },
    highlight: {
      color: '#E7B43A',
      fontWeight: '600' as const,
    },
  },

  // Progress Ring - HTML values 1:1
  progressRing: {
    normal: {
      size: 52,
      radius: 21,
      strokeWidth: 5,
    },
    perfectDay: {
      size: 56,
      radius: 23,
      strokeWidth: 5,
    },
    percentage: {
      fontSize: 15,
      fontWeight: 'bold' as const,
      color: '#fff',
    },
    strokeColor: {
      background: 'rgba(255, 255, 255, 0.15)',
      progress: '#E7B43A',
    },
    // Breathing room for visual alignment with header
    containerMargin: {
      top: -2,
      right: 4,
    },
  },

  // Perfect Day - HTML values 1:1
  perfectDay: {
    topLineHeight: 2,
    goldColor: '#E7B43A',
    glowOpacity: 0.15,
    glowSize: 64,
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
  },

  // Section Label (COMPLETED) - HTML values 1:1
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    color: '#E7B43A',
    marginBottom: 4,
    marginLeft: 2,
  },

  // Actions Row - HTML values 1:1
  actionsRow: {
    gap: 10,
    marginBottom: 10,
  },

  // Action Tile - HTML values 1:1
  actionTile: {
    height: 44,
    minWidth: 110,
    maxWidth: 160,
    borderRadius: 14,
    gap: 8,
    paddingHorizontal: 12,
    paddingHorizontalNewest: 11, // Adjusted for 2px border
    borderWidth: 1,
    borderWidthNewest: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: {
      normal: 'rgba(255, 255, 255, 0.04)',
      completed: 'rgba(255, 255, 255, 0.06)',
      newest: 'rgba(231, 180, 58, 0.08)',
      overflow: 'rgba(231, 180, 58, 0.06)',
    },
    icon: {
      fontSize: 20,
    },
    label: {
      fontSize: 16,
      fontSizeMore: 14,
      fontWeight: '500' as const,
      fontWeightNewest: '600' as const,
      lineHeight: 16,
      color: {
        normal: '#777',
        completed: '#ccc',
        newest: '#E7B43A',
        upcoming: '#999',
      },
    },
  },

  // Footer - HTML values 1:1
  footer: {
    fontSize: 13,
    color: '#666',
    countColor: '#888',
  },

  // Mesh overlay - HTML values 1:1
  mesh: {
    opacity: 0.01,
    patternSize: 4,
    strokeWidth: 2,
  },

  // Debug outlines - set enabled to true during development only
  // IMPORTANT: Must be false for production builds
  debug: {
    enabled: __DEV__ && false, // Change to true to enable debug borders
    colors: {
      card: 'red',
      header: 'blue',
      sectionLabel: 'cyan',
      actionsRow: 'green',
      footer: 'yellow',
      ring: 'magenta',
    },
  },
};

// Export for debug logging
export const SCALE_FACTOR = SCALE;
export const BASE_DESIGN_WIDTH = BASE_WIDTH;
export const CURRENT_SCREEN_WIDTH = SCREEN_WIDTH;
