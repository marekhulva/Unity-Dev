import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutRectangle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../design/luxuryTheme';
import { DesignTokens } from '../design/designTokens';
import * as Haptics from 'expo-haptics';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  theme?: 'dark' | 'light' | 'gold';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  theme = 'dark',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);
  
  const scaleAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(0);
  const translateAnimation = useSharedValue(0);

  const showTooltip = () => {
    if (disabled) return;
    
    setIsVisible(true);
    Haptics.selectionAsync();
    
    scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacityAnimation.value = withTiming(1, { duration: 200 });
    translateAnimation.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  const hideTooltip = () => {
    scaleAnimation.value = withTiming(0, { duration: 150 });
    opacityAnimation.value = withTiming(0, { duration: 150 });
    translateAnimation.value = withTiming(getInitialTranslate(), { duration: 150 });
    
    setTimeout(() => setIsVisible(false), 150);
  };

  const getInitialTranslate = () => {
    switch (position) {
      case 'top': return -10;
      case 'bottom': return 10;
      case 'left': return -10;
      case 'right': return 10;
      default: return -10;
    }
  };

  const getTooltipPosition = () => {
    if (!triggerLayout) return {};

    const spacing = 8;
    
    switch (position) {
      case 'top':
        return {
          bottom: triggerLayout.height + spacing,
          left: triggerLayout.width / 2,
          transform: [{ translateX: -50 }],
        };
      case 'bottom':
        return {
          top: triggerLayout.height + spacing,
          left: triggerLayout.width / 2,
          transform: [{ translateX: -50 }],
        };
      case 'left':
        return {
          right: triggerLayout.width + spacing,
          top: triggerLayout.height / 2,
          transform: [{ translateY: -50 }],
        };
      case 'right':
        return {
          left: triggerLayout.width + spacing,
          top: triggerLayout.height / 2,
          transform: [{ translateY: -50 }],
        };
      default:
        return {};
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'light':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          textColor: '#000000',
          gradient: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 248, 248, 0.95)'],
        };
      case 'gold':
        return {
          backgroundColor: 'rgba(255, 215, 0, 0.9)',
          borderColor: 'rgba(255, 215, 0, 0.3)',
          textColor: '#000000',
          gradient: [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne],
        };
      default:
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          textColor: '#FFFFFF',
          gradient: ['rgba(0, 0, 0, 0.9)', 'rgba(20, 20, 20, 0.9)'],
        };
    }
  };

  const tooltipStyle = useAnimatedStyle(() => {
    const translateKey = position === 'left' || position === 'right' ? 'translateX' : 'translateY';
    
    return {
      opacity: opacityAnimation.value,
      transform: [
        { scale: interpolate(scaleAnimation.value, [0, 1], [0.8, 1]) },
        { [translateKey]: translateAnimation.value },
      ],
    };
  });

  const themeStyles = getThemeStyles();

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        onLayout={(event) => setTriggerLayout(event.nativeEvent.layout)}
        style={styles.trigger}
      >
        {children}
      </Pressable>

      {isVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.tooltip,
            {
              backgroundColor: themeStyles.backgroundColor,
              borderColor: themeStyles.borderColor,
              ...getTooltipPosition(),
            },
            tooltipStyle,
          ]}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          
          <LinearGradient
            colors={themeStyles.gradient}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Arrow/Pointer */}
          <View style={[styles.arrow, styles[`arrow${position.charAt(0).toUpperCase() + position.slice(1)}` as keyof typeof styles]]}>
            <LinearGradient
              colors={themeStyles.gradient}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          <Text style={[styles.text, { color: themeStyles.textColor }]}>
            {content}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    // Trigger area styles
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    maxWidth: 200,
    zIndex: 1000,
    overflow: 'hidden',
    ...DesignTokens.elevation.medium,
  },
  text: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.sizes.sm * 1.4,
    letterSpacing: DesignTokens.typography.letterSpacing.wide,
  },
  arrow: {
    position: 'absolute',
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: 'inherit',
    overflow: 'hidden',
  },
  arrowTop: {
    top: -4,
    left: '50%',
    marginLeft: -4,
  },
  arrowBottom: {
    bottom: -4,
    left: '50%',
    marginLeft: -4,
  },
  arrowLeft: {
    left: -4,
    top: '50%',
    marginTop: -4,
  },
  arrowRight: {
    right: -4,
    top: '50%',
    marginTop: -4,
  },
});