// Page Transition Manager
// Provides smooth, luxury page transitions throughout the app

import { FadeIn, FadeOut, SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { AnimationSequences } from '../design/animations';

export const PageTransitions = {
  // BASIC TRANSITIONS
  fade: {
    entering: FadeIn.duration(400),
    exiting: FadeOut.duration(300),
  },

  slide: {
    // Right to left (forward navigation)
    forward: {
      entering: SlideInRight.duration(400),
      exiting: SlideOutLeft.duration(300),
    },
    // Left to right (back navigation)
    back: {
      entering: SlideInLeft.duration(400),
      exiting: SlideOutRight.duration(300),
    },
  },

  zoom: {
    entering: ZoomIn.duration(400),
    exiting: ZoomOut.duration(300),
  },

  // LUXURY TRANSITIONS
  luxury: {
    // Smooth luxury slide with subtle scale
    slide: {
      entering: SlideInRight.duration(500).springify().damping(15),
      exiting: SlideOutLeft.duration(400).springify().damping(20),
    },
    
    // Elegant fade with scale
    fade: {
      entering: FadeIn.duration(600).springify(),
      exiting: FadeOut.duration(400),
    },
    
    // Premium modal presentation
    modal: {
      entering: ZoomIn.duration(500).springify().damping(15),
      exiting: ZoomOut.duration(350).springify().damping(20),
    },
  },

  // SCREEN-SPECIFIC TRANSITIONS
  screens: {
    // Tab navigation
    tabs: {
      entering: FadeIn.duration(300),
      exiting: FadeOut.duration(200),
    },

    // Daily screen
    daily: {
      entering: SlideInRight.duration(400).springify(),
      exiting: SlideOutLeft.duration(300),
    },

    // Progress screen
    progress: {
      entering: FadeIn.duration(500).springify(),
      exiting: FadeOut.duration(300),
    },

    // Social screen
    social: {
      entering: SlideInRight.duration(450).springify(),
      exiting: SlideOutLeft.duration(350),
    },

    // Profile screen
    profile: {
      entering: ZoomIn.duration(400).springify(),
      exiting: ZoomOut.duration(300),
    },

    // Onboarding flow
    onboarding: {
      entering: SlideInRight.duration(500).springify().damping(18),
      exiting: SlideOutLeft.duration(400).springify().damping(20),
    },
  },

  // MODAL TRANSITIONS
  modals: {
    // Standard modal
    standard: {
      entering: FadeIn.duration(300),
      exiting: FadeOut.duration(250),
    },

    // Bottom sheet style
    bottomSheet: {
      entering: SlideInRight.duration(400).springify(),
      exiting: SlideOutRight.duration(300),
    },

    // Full screen modal
    fullScreen: {
      entering: ZoomIn.duration(500).springify().damping(15),
      exiting: ZoomOut.duration(350),
    },

    // Luxury presentation
    luxury: {
      entering: FadeIn.duration(600).springify().delay(100),
      exiting: FadeOut.duration(400),
    },
  },

  // COMPONENT TRANSITIONS
  components: {
    // List items
    listItem: {
      entering: FadeIn.duration(300),
      exiting: FadeOut.duration(200),
    },

    // Cards
    card: {
      entering: FadeIn.duration(400).springify(),
      exiting: FadeOut.duration(250),
    },

    // Buttons
    button: {
      entering: FadeIn.duration(200),
      exiting: FadeOut.duration(150),
    },

    // Overlays
    overlay: {
      entering: FadeIn.duration(250),
      exiting: FadeOut.duration(200),
    },
  },

  // STAGGERED TRANSITIONS
  staggered: {
    // Staggered list animation
    list: (index: number, baseDelay: number = 100) => ({
      entering: FadeIn.delay(index * baseDelay).duration(300).springify(),
      exiting: FadeOut.duration(200),
    }),

    // Staggered card grid
    grid: (index: number, columns: number = 2, baseDelay: number = 80) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const delay = (row * baseDelay) + (col * baseDelay * 0.5);
      
      return {
        entering: FadeIn.delay(delay).duration(400).springify(),
        exiting: FadeOut.duration(250),
      };
    },

    // Staggered onboarding steps
    onboardingSteps: (step: number) => ({
      entering: SlideInRight.delay(step * 150).duration(500).springify().damping(18),
      exiting: SlideOutLeft.duration(300),
    }),
  },
};

// TRANSITION PRESETS FOR DIFFERENT NAVIGATION PATTERNS
export const NavigationTransitions = {
  // Stack navigation
  stack: {
    // iOS-style push/pop
    ios: {
      gestureDirection: 'horizontal' as const,
      transitionSpec: {
        open: {
          animation: 'spring' as const,
          config: {
            stiffness: 1000,
            damping: 500,
            mass: 3,
            overshootClamping: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          },
        },
        close: {
          animation: 'spring' as const,
          config: {
            stiffness: 1000,
            damping: 500,
            mass: 3,
            overshootClamping: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          },
        },
      },
      cardStyleInterpolator: ({ current, layouts }: any) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        };
      },
    },

    // Luxury custom transition
    luxury: {
      gestureDirection: 'horizontal' as const,
      transitionSpec: {
        open: {
          animation: 'spring' as const,
          config: {
            stiffness: 800,
            damping: 40,
            mass: 1,
          },
        },
        close: {
          animation: 'spring' as const,
          config: {
            stiffness: 800,
            damping: 40,
            mass: 1,
          },
        },
      },
      cardStyleInterpolator: ({ current, layouts }: any) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
              {
                scale: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
            opacity: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        };
      },
    },
  },

  // Tab navigation
  tab: {
    // Smooth fade between tabs
    fade: {
      lazy: true,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        borderTopWidth: 1,
      },
      sceneAnimationEnabled: true,
      sceneAnimationType: 'opacity' as const,
    },

    // Scale transition
    scale: {
      lazy: true,
      sceneAnimationEnabled: true,
      sceneAnimationType: 'shifting' as const,
    },
  },
};

// TRANSITION UTILITIES
export const TransitionUtils = {
  // Create a custom transition based on direction
  createDirectionalTransition: (direction: 'up' | 'down' | 'left' | 'right', duration: number = 400) => {
    const slideMap = {
      up: { entering: SlideInRight, exiting: SlideOutLeft },
      down: { entering: SlideInLeft, exiting: SlideOutRight },
      left: { entering: SlideInLeft, exiting: SlideOutRight },
      right: { entering: SlideInRight, exiting: SlideOutLeft },
    };

    const { entering, exiting } = slideMap[direction];
    
    return {
      entering: entering.duration(duration).springify(),
      exiting: exiting.duration(duration * 0.8),
    };
  },

  // Create a staggered entrance for multiple elements
  createStaggeredEntrance: (elements: number, baseDelay: number = 100) => {
    return Array.from({ length: elements }, (_, index) => 
      FadeIn.delay(index * baseDelay).duration(300).springify()
    );
  },

  // Create a sequential exit for multiple elements
  createSequentialExit: (elements: number, baseDelay: number = 50) => {
    return Array.from({ length: elements }, (_, index) => 
      FadeOut.delay(index * baseDelay).duration(200)
    );
  },

  // Create a luxury entrance with scale and fade
  createLuxuryEntrance: (delay: number = 0) => 
    FadeIn.delay(delay).duration(600).springify().damping(15),

  // Create a premium modal transition
  createModalTransition: (type: 'present' | 'dismiss') => {
    if (type === 'present') {
      return ZoomIn.duration(500).springify().damping(15);
    }
    return ZoomOut.duration(350).springify().damping(20);
  },
};