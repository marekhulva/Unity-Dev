/**
 * Feature flags for controlled rollout of visual changes
 * All flags default to false for safety
 */

interface FeatureFlags {
  ui: {
    social: {
      v1: boolean; // New visual system for social feed
      v2: boolean; // Enhanced V2 visuals (development only)
      fixedCarousel: boolean; // Use fixed position carousel instead of scrolling
      luxuryTheme: boolean; // Luxury black/gold/silver color scheme
    };
  };
}

const FLAGS: FeatureFlags = {
  ui: {
    social: {
      v1: true, // Enable new social visuals (can be toggled for testing)
      v2: true, // V2 enhancements (enabled for better interaction feedback)
      // v2: __DEV__ ? true : false, // V2 enhancements (enabled in development only)
      fixedCarousel: true, // Enable fixed position carousel (set to false to use scrolling)
      luxuryTheme: false, // Enable luxury black/gold/silver theme (set to false to use default)
    },
  },
};

export const isFeatureEnabled = (path: string): boolean => {
  const keys = path.split('.');
  let current: any = FLAGS;
  
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  
  return current === true;
};

export const getFeatureFlags = (): FeatureFlags => FLAGS;

// Helper for social v1 features
export const useSocialV1 = () => isFeatureEnabled('ui.social.v1');

// Helper for social v2 features
export const useSocialV2 = () => isFeatureEnabled('ui.social.v2');