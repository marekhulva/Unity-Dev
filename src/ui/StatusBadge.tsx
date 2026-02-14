import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { LuxuryTheme } from '../design/luxuryTheme';
import { DesignTokens } from '../design/designTokens';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  text: string;
  icon?: LucideIcon;
  size?: 'small' | 'medium' | 'large';
  variant?: 'solid' | 'outlined' | 'glass' | 'gradient';
  animated?: boolean;
  pulsing?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  icon: IconComponent,
  size = 'medium',
  variant = 'solid',
  animated = true,
  pulsing = false,
}) => {
  const pulseAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (pulsing) {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [pulsing]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulsing 
      ? interpolate(pulseAnimation.value, [0, 1], [0.7, 1])
      : 1,
    transform: [
      { 
        scale: pulsing 
          ? interpolate(pulseAnimation.value, [0, 1], [0.98, 1.02])
          : 1 
      }
    ],
  }));

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          colors: {
            solid: '#22C55E',
            gradient: ['#22C55E', '#16A34A'],
            text: '#FFFFFF',
            background: 'rgba(34, 197, 94, 0.1)',
            border: 'rgba(34, 197, 94, 0.3)',
          },
          glowColor: 'rgba(34, 197, 94, 0.3)',
        };
      case 'warning':
        return {
          colors: {
            solid: '#F59E0B',
            gradient: ['#F59E0B', '#D97706'],
            text: '#000000',
            background: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.3)',
          },
          glowColor: 'rgba(245, 158, 11, 0.3)',
        };
      case 'error':
        return {
          colors: {
            solid: '#EF4444',
            gradient: ['#EF4444', '#DC2626'],
            text: '#FFFFFF',
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)',
          },
          glowColor: 'rgba(239, 68, 68, 0.3)',
        };
      case 'info':
        return {
          colors: {
            solid: '#3B82F6',
            gradient: ['#3B82F6', '#2563EB'],
            text: '#FFFFFF',
            background: 'rgba(59, 130, 246, 0.1)',
            border: 'rgba(59, 130, 246, 0.3)',
          },
          glowColor: 'rgba(59, 130, 246, 0.3)',
        };
      default:
        return {
          colors: {
            solid: '#6B7280',
            gradient: ['#6B7280', '#4B5563'],
            text: '#FFFFFF',
            background: 'rgba(107, 114, 128, 0.1)',
            border: 'rgba(107, 114, 128, 0.3)',
          },
          glowColor: 'rgba(107, 114, 128, 0.3)',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 24,
          paddingHorizontal: 8,
          fontSize: DesignTokens.typography.sizes.xs,
          iconSize: 12,
          borderRadius: DesignTokens.borderRadius.md,
        };
      case 'large':
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: DesignTokens.typography.sizes.md,
          iconSize: 20,
          borderRadius: DesignTokens.borderRadius.lg,
        };
      default:
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: DesignTokens.typography.sizes.sm,
          iconSize: 16,
          borderRadius: DesignTokens.borderRadius.md,
        };
    }
  };

  const getVariantStyles = () => {
    const statusConfig = getStatusConfig();
    
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: statusConfig.colors.border,
          textColor: statusConfig.colors.solid,
          hasGradient: false,
          hasBlur: false,
        };
      case 'glass':
        return {
          backgroundColor: statusConfig.colors.background,
          borderWidth: 1,
          borderColor: statusConfig.colors.border,
          textColor: statusConfig.colors.solid,
          hasGradient: false,
          hasBlur: true,
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          textColor: statusConfig.colors.text,
          hasGradient: true,
          gradientColors: statusConfig.colors.gradient,
          hasBlur: false,
        };
      default:
        return {
          backgroundColor: statusConfig.colors.solid,
          borderWidth: 0,
          textColor: statusConfig.colors.text,
          hasGradient: false,
          hasBlur: false,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();
  const variantStyles = getVariantStyles();

  const BadgeComponent = animated ? Animated.View : View;
  const badgeProps = animated ? {
    entering: FadeIn.duration(300),
    style: [styles.badge, pulseStyle],
  } : {
    style: styles.badge,
  };

  return (
    <BadgeComponent {...badgeProps}>
      <View
        style={[
          styles.container,
          {
            height: sizeConfig.height,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            backgroundColor: variantStyles.backgroundColor,
            borderWidth: variantStyles.borderWidth,
            borderColor: variantStyles.borderColor,
            borderRadius: sizeConfig.borderRadius,
          },
        ]}
      >
        {variantStyles.hasBlur && (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        )}

        {variantStyles.hasGradient && (
          <LinearGradient
            colors={variantStyles.gradientColors!}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Glow effect for pulsing badges */}
        {pulsing && (
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: statusConfig.glowColor,
                borderRadius: sizeConfig.borderRadius,
              },
              pulseStyle,
            ]}
          />
        )}

        <View style={styles.content}>
          {IconComponent && (
            <IconComponent
              size={sizeConfig.iconSize}
              color={variantStyles.textColor}
              style={styles.icon}
            />
          )}
          
          <Text
            style={[
              styles.text,
              {
                color: variantStyles.textColor,
                fontSize: sizeConfig.fontSize,
              },
            ]}
          >
            {text}
          </Text>
        </View>
      </View>
    </BadgeComponent>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    marginRight: 0,
  },
  text: {
    fontWeight: DesignTokens.typography.weights.semibold,
    letterSpacing: DesignTokens.typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    zIndex: -1,
  },
});