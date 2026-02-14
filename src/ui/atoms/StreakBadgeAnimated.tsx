import React from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { useSocialV2 } from '../../utils/featureFlags';

interface StreakBadgeAnimatedProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  glowEffect?: boolean;
  milestone?: boolean; // For special milestones (7, 30, 100 days)
  disableAnimation?: boolean;
}

/**
 * StreakBadgeAnimated - Animated streak badge with pulsing gold glow
 * Reserved for wins and streaks only per brand gold discipline
 */
export const StreakBadgeAnimated: React.FC<StreakBadgeAnimatedProps> = ({
  value,
  size = 'md',
  animated = true,
  glowEffect = true,
  milestone = false,
  disableAnimation = false,
}) => {
  const glowAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const v2Enabled = useSocialV2();
  
  // Check for reduce motion preference
  const [reduceMotion, setReduceMotion] = React.useState(false);
  
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  React.useEffect(() => {
    if (animated && !disableAnimation && !reduceMotion) {
      // V2: Softer pulsing with lower intensity
      const duration = v2Enabled 
        ? LuxuryTheme.motion.pulseSlow.duration 
        : LuxuryTheme.motion.glowPulse.duration;
      
      glowAnim.value = withRepeat(
        withTiming(1, { 
          duration, 
          easing: Easing.inOut(Easing.ease) 
        }),
        -1,
        true
      );
      
      // Milestone celebration animation
      if (milestone) {
        scaleAnim.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
      }
    }
  }, [animated, disableAnimation, reduceMotion, milestone]);

  const glowStyle = useAnimatedStyle(() => {
    // V2: Lower intensity glow
    const minOpacity = v2Enabled ? 0.2 : 0.3;
    const maxOpacity = v2Enabled ? 0.4 : 0.6;
    const minRadius = v2Enabled ? 6 : 8;
    const maxRadius = v2Enabled ? 12 : 16;
    
    return {
      shadowOpacity: interpolate(glowAnim.value, [0, 1], [minOpacity, maxOpacity]),
      shadowRadius: interpolate(glowAnim.value, [0, 1], [minRadius, maxRadius]),
    };
  });

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const isMilestone = [7, 30, 100, 365].includes(value);
  const sizes = {
    sm: { padding: 4, fontSize: 11, iconSize: 12 },
    md: { padding: 6, fontSize: 13, iconSize: 14 },
    lg: { padding: 8, fontSize: 15, iconSize: 16 },
  };
  const sizeStyle = sizes[size];

  return (
    <Animated.View 
      style={[
        styles.container,
        scaleStyle,
        glowEffect && !reduceMotion && [glowStyle, { shadowColor: LuxuryTheme.colors.primary.gold }],
      ]}
      accessible={true}
      accessibilityLabel={`${value} day streak`}
      accessibilityRole="text"
    >
      <LinearGradient
        colors={
          isMilestone 
            ? LuxuryTheme.gradientPresets.goldShine 
            : [LuxuryTheme.colors.glass.gold, 'rgba(231, 180, 58, 0.15)']
        }
        style={[
          styles.badge,
          { 
            paddingHorizontal: sizeStyle.padding * 2,
            paddingVertical: sizeStyle.padding,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Flame 
            size={sizeStyle.iconSize} 
            color={LuxuryTheme.colors.primary.gold} 
          />
          <Text style={[
            styles.text, 
            { fontSize: sizeStyle.fontSize },
            isMilestone && styles.milestoneText
          ]}>
            {value}
          </Text>
          {isMilestone && (
            <Text style={styles.milestone}>✨</Text>
          )}
        </View>
        
        {/* Inner glow for depth */}
        {glowEffect && !reduceMotion && (
          <Animated.View 
            style={[styles.innerGlow, glowStyle]} 
            pointerEvents="none"
          />
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.3)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontWeight: '700',
    color: LuxuryTheme.colors.primary.gold,
  },
  milestoneText: {
    fontWeight: '900',
  },
  milestone: {
    fontSize: 10,
  },
  innerGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    backgroundColor: LuxuryTheme.colors.primary.gold,
    borderRadius: 10,
    opacity: 0.2,
  },
});