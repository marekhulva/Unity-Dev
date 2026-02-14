import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { DesignTokens } from '../design/designTokens';
import { LuxuryTheme } from '../design/luxuryTheme';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'small' | 'medium' | 'large';
  theme?: 'gold' | 'silver' | 'white' | 'dark';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  theme = 'gold',
  icon: IconComponent,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = 'medium',
}) => {
  const scaleAnimation = useSharedValue(1);
  const opacityAnimation = useSharedValue(1);

  const handlePressIn = () => {
    scaleAnimation.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback !== 'none') {
      const feedbackType = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticFeedback];
      Haptics.impactAsync(feedbackType);
    }
    
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
    opacity: disabled ? 0.5 : opacityAnimation.value,
  }));

  const getButtonConfig = () => {
    const baseSize = DesignTokens.componentSizes.button[size];
    
    const themeColors = {
      gold: {
        primary: [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne],
        text: '#000000',
      },
      silver: {
        primary: ['#C0C0C0', '#E5E4E2'],
        text: '#000000',
      },
      white: {
        primary: ['#FFFFFF', '#F8F9FA'],
        text: '#000000',
      },
      dark: {
        primary: ['#1A1A1A', '#2D2D2D'],
        text: '#FFFFFF',
      },
    }[theme];

    const variants = {
      primary: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        gradient: themeColors.primary,
        textColor: themeColors.text,
        hasGradient: true,
      },
      secondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textColor: LuxuryTheme.colors.text.primary,
        hasGradient: false,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: themeColors.primary[0],
        textColor: themeColors.primary[0],
        hasGradient: false,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        textColor: themeColors.primary[0],
        hasGradient: false,
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: LuxuryTheme.colors.text.primary,
        hasGradient: false,
        hasBlur: true,
      },
    }[variant];

    return {
      ...baseSize,
      ...variants,
      borderRadius: DesignTokens.borderRadius.lg,
    };
  };

  const config = getButtonConfig();

  const buttonContent = (
    <>
      {config.hasBlur && (
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      {config.hasGradient && (
        <LinearGradient
          colors={config.gradient}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {IconComponent && iconPosition === 'left' && (
        <IconComponent
          size={DesignTokens.componentSizes.icon.md}
          color={config.textColor}
          style={{ marginRight: DesignTokens.spacing.sm }}
        />
      )}

      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: DesignTokens.typography.sizes[size === 'small' ? 'md' : size === 'large' ? 'xl' : 'lg'],
            fontWeight: DesignTokens.typography.weights.semibold,
          },
          textStyle,
        ]}
      >
        {loading ? 'Loading...' : title}
      </Text>

      {IconComponent && iconPosition === 'right' && (
        <IconComponent
          size={DesignTokens.componentSizes.icon.md}
          color={config.textColor}
          style={{ marginLeft: DesignTokens.spacing.sm }}
        />
      )}
    </>
  );

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            height: config.height,
            paddingHorizontal: config.paddingHorizontal,
            backgroundColor: config.backgroundColor,
            borderWidth: config.borderWidth || 0,
            borderColor: config.borderColor,
            borderRadius: config.borderRadius,
          },
          style,
        ]}
      >
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    textAlign: 'center',
    letterSpacing: DesignTokens.typography.letterSpacing.wide,
  },
});