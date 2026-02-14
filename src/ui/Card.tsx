import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { DesignTokens, ElevationKey } from '../design/designTokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient';
  padding?: keyof typeof DesignTokens.spacing;
  borderRadius?: keyof typeof DesignTokens.borderRadius;
  elevation?: ElevationKey;
  style?: ViewStyle;
  animated?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'xl',
  elevation = 'low',
  style,
  animated = true,
  pressable = false,
  onPress,
}) => {
  const scaleAnimation = useSharedValue(1);

  const handlePressIn = () => {
    if (pressable) {
      scaleAnimation.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: DesignTokens.glassMorphism.medium.backgroundColor,
          borderWidth: DesignTokens.glassMorphism.medium.borderWidth,
          borderColor: DesignTokens.glassMorphism.medium.borderColor,
          hasBlur: true,
          blurIntensity: DesignTokens.glassMorphism.medium.blurIntensity,
        };
      
      case 'elevated':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          ...DesignTokens.elevation[elevation],
          shadowColor: '#000000',
        };
      
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          hasGradient: true,
        };
      
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const cardStyle = [
    styles.card,
    {
      padding: DesignTokens.spacing[padding],
      borderRadius: DesignTokens.borderRadius[borderRadius],
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
      ...('shadowOpacity' in variantStyles ? {
        shadowOpacity: variantStyles.shadowOpacity,
        shadowRadius: variantStyles.shadowRadius,
        shadowOffset: variantStyles.shadowOffset,
        elevation: variantStyles.elevation,
        shadowColor: variantStyles.shadowColor,
      } : {}),
    },
    style,
  ];

  const CardComponent = animated ? Animated.View : View;
  const cardProps = animated ? { 
    entering: FadeIn.duration(300),
    style: [cardStyle, animatedStyle] 
  } : { 
    style: cardStyle 
  };

  const handlePress = () => {
    if (pressable && onPress) {
      onPress();
    }
  };

  return (
    <CardComponent
      {...cardProps}
      {...(pressable ? {
        onTouchStart: handlePressIn,
        onTouchEnd: handlePressOut,
        onPress: handlePress,
      } : {})}
    >
      {variantStyles.hasBlur && (
        <BlurView
          intensity={variantStyles.blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      {variantStyles.hasGradient && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});