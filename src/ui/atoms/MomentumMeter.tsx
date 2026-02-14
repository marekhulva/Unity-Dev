import React from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MomentumMeterProps {
  value: number; // 0-100
  size?: number;
  variant?: 'ring' | 'bar';
  showLabel?: boolean;
  trend?: 'up' | 'down' | 'stable';
  disableAnimation?: boolean;
}

/**
 * MomentumMeter - Compact visual representation of momentum
 * Replaces raw numbers with accessible visual meters
 */
export const MomentumMeter: React.FC<MomentumMeterProps> = ({
  value,
  size = 40,
  variant = 'ring',
  showLabel = false,
  trend,
  disableAnimation = false,
}) => {
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    if (disableAnimation) {
      progress.value = value;
    } else {
      progress.value = withSpring(value, {
        damping: 15,
        stiffness: 100,
      });
    }
  }, [value, disableAnimation]);

  const getColor = () => {
    if (value >= 80) return LuxuryTheme.colors.primary.gold;
    if (value >= 50) return LuxuryTheme.colors.primary.silver;
    return LuxuryTheme.colors.text.tertiary;
  };

  if (variant === 'ring') {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: interpolate(
        progress.value,
        [0, 100],
        [circumference, 0]
      ),
    }));

    return (
      <View 
        style={[styles.ringContainer, { width: size, height: size }]}
        accessible={true}
        accessibilityLabel={`Momentum ${value} percent`}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: value, min: 0, max: 100 }}
      >
        <Svg width={size} height={size}>
          {/* Background ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={3}
            fill="none"
          />
          {/* Progress ring */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={3}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {showLabel && (
          <View style={styles.ringLabel}>
            <Text style={[styles.ringValue, { color: getColor() }]}>
              {Math.round(value)}
            </Text>
            {trend && (
              <Text style={styles.trendIndicator}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // Bar variant
  const animatedWidth = useAnimatedProps(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View 
      style={styles.barContainer}
      accessible={true}
      accessibilityLabel={`Momentum ${value} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: value, min: 0, max: 100 }}
    >
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, animatedWidth]}>
          <LinearGradient
            colors={[getColor(), LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
      
      {showLabel && (
        <View style={styles.barLabel}>
          <Text style={[styles.barValue, { color: getColor() }]}>
            {Math.round(value)}%
          </Text>
          {trend && (
            <Text style={[styles.trendIndicator, { marginLeft: 4 }]}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Ring styles
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Bar styles
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Shared
  trendIndicator: {
    fontSize: 10,
    color: LuxuryTheme.colors.text.tertiary,
  },
});