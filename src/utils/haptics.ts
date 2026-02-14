// Enhanced Haptic Feedback System
// Provides contextual haptic feedback throughout the app

import * as Haptics from 'expo-haptics';

export const HapticManager = {
  // SUCCESS FEEDBACK
  success: {
    light: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    medium: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
    },
    celebration: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
    },
  },

  // ERROR FEEDBACK
  error: {
    light: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    shake: async () => {
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    },
    strong: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
    },
  },

  // WARNING FEEDBACK
  warning: {
    gentle: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    attention: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
    },
  },

  // INTERACTION FEEDBACK
  interaction: {
    tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    longPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    selection: () => Haptics.selectionAsync(),
    
    // Luxury interactions
    luxuryTap: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 50);
    },
    premiumPress: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
    },
  },

  // NAVIGATION FEEDBACK
  navigation: {
    pageChange: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    tabSwitch: () => Haptics.selectionAsync(),
    modalOpen: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    modalClose: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    drawerOpen: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
    },
  },

  // PROGRESS FEEDBACK
  progress: {
    step: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    milestone: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    },
    complete: async () => {
      // Victory pattern
      const pattern = [
        { intensity: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { intensity: Haptics.ImpactFeedbackStyle.Medium, delay: 100 },
        { intensity: Haptics.ImpactFeedbackStyle.Light, delay: 150 },
        { intensity: Haptics.ImpactFeedbackStyle.Medium, delay: 250 },
        { intensity: Haptics.ImpactFeedbackStyle.Heavy, delay: 300 },
      ];
      
      for (const { intensity, delay } of pattern) {
        setTimeout(() => Haptics.impactAsync(intensity), delay);
      }
    },
  },

  // CONTEXTUAL FEEDBACK
  context: {
    // Goal-related
    goalCreated: () => HapticManager.success.medium(),
    goalCompleted: () => HapticManager.progress.complete(),
    goalDeleted: () => HapticManager.error.light(),
    
    // Action-related
    actionCompleted: () => HapticManager.success.light(),
    streakExtended: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 160);
    },
    
    // Social-related
    postLiked: () => HapticManager.interaction.luxuryTap(),
    commentAdded: () => HapticManager.interaction.tap(),
    sharePost: () => HapticManager.interaction.press(),
    
    // Onboarding-related
    stepComplete: () => HapticManager.progress.step(),
    onboardingComplete: () => HapticManager.progress.complete(),
    
    // Form-related
    inputFocus: () => HapticManager.interaction.selection(),
    formSubmit: () => HapticManager.interaction.press(),
    formError: () => HapticManager.error.shake(),
    
    // Data-related
    dataLoaded: () => HapticManager.interaction.tap(),
    dataRefreshed: () => HapticManager.interaction.luxuryTap(),
    syncComplete: () => HapticManager.success.light(),
  },

  // CUSTOM PATTERNS
  patterns: {
    // Heartbeat pattern for likes/reactions
    heartbeat: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    },
    
    // Escalating pattern for building excitement
    escalate: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
    },
    
    // Gentle cascade for luxury feel
    luxuryCascade: async () => {
      const delays = [0, 80, 120, 200];
      const intensities = [
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light,
      ];
      
      delays.forEach((delay, index) => {
        setTimeout(() => Haptics.impactAsync(intensities[index]), delay);
      });
    },
    
    // Notification burst
    notificationBurst: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 250);
    },
  },

  // UTILITY FUNCTIONS
  utils: {
    // Conditional haptic based on setting
    conditionalHaptic: (hapticFn: () => void, enabled: boolean = true) => {
      if (enabled) {
        hapticFn();
      }
    },
    
    // Delayed haptic
    delayed: (hapticFn: () => void, delay: number) => {
      setTimeout(hapticFn, delay);
    },
    
    // Repeated haptic pattern
    repeat: async (hapticFn: () => void, count: number, interval: number) => {
      for (let i = 0; i < count; i++) {
        hapticFn();
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
    },
  },
};

// HAPTIC HOOK
export const useHaptics = () => {
  return {
    // Quick access to common patterns
    tap: HapticManager.interaction.tap,
    press: HapticManager.interaction.press,
    success: HapticManager.success.light,
    error: HapticManager.error.light,
    selection: HapticManager.interaction.selection,
    
    // Access to full manager
    haptics: HapticManager,
    
    // Contextual helpers
    onSuccess: HapticManager.success.medium,
    onError: HapticManager.error.shake,
    onComplete: HapticManager.progress.complete,
    onInteraction: HapticManager.interaction.luxuryTap,
  };
};