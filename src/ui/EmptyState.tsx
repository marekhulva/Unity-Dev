import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { LuxuryTheme } from '../design/luxuryTheme';
import * as Haptics from 'expo-haptics';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  illustration?: 'spark' | 'glow' | 'minimal';
  theme?: 'default' | 'gold' | 'silver';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconComponent,
  title,
  subtitle,
  actionText,
  onAction,
  illustration = 'glow',
  theme = 'default'
}) => {
  const sparkleAnimation = useSharedValue(0);
  const floatAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  React.useEffect(() => {
    // Sparkle animation for icons
    sparkleAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1
    );

    // Floating animation
    floatAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1
    );

    // Glow animation
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.3, { duration: 2500 })
      ),
      -1
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        translateY: interpolate(floatAnimation.value, [0, 1], [0, -8])
      },
      {
        scale: interpolate(sparkleAnimation.value, [0, 1], [1, 1.05])
      }
    ],
    opacity: interpolate(sparkleAnimation.value, [0, 1], [0.7, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnimation.value, [0, 1], [0.3, 0.8]),
    transform: [
      {
        scale: interpolate(glowAnimation.value, [0, 1], [1, 1.2])
      }
    ]
  }));

  const getThemeColors = () => {
    switch (theme) {
      case 'gold':
        return {
          primary: LuxuryTheme.colors.primary.gold,
          secondary: LuxuryTheme.colors.primary.champagne,
          gradient: ['rgba(255, 215, 0, 0.15)', 'rgba(218, 165, 32, 0.08)']
        };
      case 'silver':
        return {
          primary: '#C0C0C0',
          secondary: '#E5E4E2',
          gradient: ['rgba(192, 192, 192, 0.15)', 'rgba(229, 228, 226, 0.08)']
        };
      default:
        return {
          primary: 'rgba(255, 255, 255, 0.8)',
          secondary: 'rgba(255, 255, 255, 0.6)',
          gradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
        };
    }
  };

  const colors = getThemeColors();

  const handleAction = () => {
    if (onAction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAction();
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.container}>
      {/* Background Effects */}
      {illustration === 'glow' && (
        <Animated.View style={[styles.glowEffect, glowStyle]}>
          <LinearGradient
            colors={colors.gradient}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      {/* Icon Container */}
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={[styles.iconContainer, iconStyle]}
      >
        <View style={[styles.iconBackground, { borderColor: colors.primary }]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
            style={StyleSheet.absoluteFillObject}
          />
          <IconComponent 
            size={48} 
            color={colors.primary}
            strokeWidth={1.5}
          />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View 
        entering={FadeInDown.delay(400).springify()}
        style={styles.content}
      >
        <Text style={[styles.title, { color: colors.primary }]}>
          {title}
        </Text>
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      </Animated.View>

      {/* Action Button */}
      {actionText && onAction && (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <Pressable 
            style={styles.actionButton}
            onPress={handleAction}
          >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.05)'
              ]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.actionText}>{actionText}</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Decorative Elements for Spark Illustration */}
      {illustration === 'spark' && (
        <>
          <Animated.View style={[styles.spark, styles.spark1, sparkleAnimation]} />
          <Animated.View style={[styles.spark, styles.spark2, sparkleAnimation]} />
          <Animated.View style={[styles.spark, styles.spark3, sparkleAnimation]} />
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '50%',
    left: '50%',
    marginTop: -100,
    marginLeft: -100,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    minWidth: 140,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    letterSpacing: 0.5,
  },
  // Spark decorations
  spark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
  },
  spark1: {
    top: '30%',
    right: '25%',
  },
  spark2: {
    bottom: '35%',
    left: '20%',
  },
  spark3: {
    top: '25%',
    left: '30%',
  },
});