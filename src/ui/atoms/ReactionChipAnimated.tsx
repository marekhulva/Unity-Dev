import React from 'react';
import { Pressable, Text, StyleSheet, AccessibilityInfo, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { useSocialV2 } from '../../utils/featureFlags';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ReactionChipAnimatedProps {
  emoji: string;
  count?: number;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disableAnimation?: boolean;
}

/**
 * ReactionChipAnimated - Animated reaction chip with tap pop effect
 * 0.92 → 1.0 spring scale on tap, no layout shift
 */
export const ReactionChipAnimated: React.FC<ReactionChipAnimatedProps> = ({
  emoji,
  count,
  active = false,
  onPress,
  style,
  textStyle,
  disableAnimation = false,
}) => {
  const scale = useSharedValue(1);
  const v2Enabled = useSocialV2();
  const [reduceMotion, setReduceMotion] = React.useState(false);
  
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const handlePressIn = () => {
    if (!disableAnimation && !reduceMotion && v2Enabled) {
      scale.value = withTiming(LuxuryTheme.motion.tapPop.scale.from, {
        duration: 50,
      });
    }
  };

  const handlePressOut = () => {
    if (!disableAnimation && !reduceMotion && v2Enabled) {
      scale.value = withSpring(LuxuryTheme.motion.tapPop.scale.to, {
        damping: LuxuryTheme.motion.tapPop.damping,
        stiffness: LuxuryTheme.motion.tapPop.stiffness,
      });
    }
  };

  const handlePress = () => {
    if (!disableAnimation && !reduceMotion && v2Enabled) {
      // Quick pop animation
      scale.value = withSequence(
        withTiming(LuxuryTheme.motion.tapPop.scale.from, { duration: 50 }),
        withSpring(LuxuryTheme.motion.tapPop.scale.to, {
          damping: LuxuryTheme.motion.tapPop.damping,
          stiffness: LuxuryTheme.motion.tapPop.stiffness,
        })
      );
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        active && styles.chipActive,
        animatedStyle,
        style,
      ]}
      accessible={true}
      accessibilityLabel={`React with ${emoji}${count ? `, ${count} reactions` : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.emoji, textStyle]}>{emoji}</Text>
      {count !== undefined && count > 0 && (
        <Text style={[styles.count, active && styles.countActive, textStyle]}>
          {count}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(231,180,58,0.1)',
    borderColor: 'rgba(231,180,58,0.2)',
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    fontWeight: '600',
  },
  countActive: {
    color: LuxuryTheme.colors.primary.gold,
  },
});