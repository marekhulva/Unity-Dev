import React from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface MomentumRingAnimatedProps {
  value: number; // 0-100
  size?: number;
  showLabel?: boolean;
  trend?: 'up' | 'down' | 'stable';
  disableAnimation?: boolean;
  showSweepHighlight?: boolean;
}

/**
 * MomentumRingAnimated - Enhanced momentum ring with sweep highlight
 * Shows sweep animation when value >= 80%
 */
export const MomentumRingAnimated: React.FC<MomentumRingAnimatedProps> = ({
  value,
  size = 40,
  showLabel = false,
  trend,
  disableAnimation = false,
  showSweepHighlight = true,
}) => {
  const progress = useSharedValue(0);
  const sweepProgress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  React.useEffect(() => {
    if (disableAnimation || reduceMotion) {
      progress.value = value;
    } else {
      progress.value = withSpring(value, {
        damping: 15,
        stiffness: 100,
      });
      
      // Trigger sweep highlight for high values
      if (showSweepHighlight && value >= 80) {
        sweepProgress.value = 0;
        sweepProgress.value = withDelay(
          LuxuryTheme.effects.ringSweepHighlight.delay,
          withTiming(1, {
            duration: LuxuryTheme.effects.ringSweepHighlight.duration,
            easing: Easing.out(Easing.ease),
          })
        );
      }
    }
  }, [value, disableAnimation, reduceMotion, showSweepHighlight]);

  const getColor = () => {
    if (value >= 80) return LuxuryTheme.colors.primary.gold;
    if (value >= 50) return LuxuryTheme.colors.primary.silver;
    return LuxuryTheme.colors.text.tertiary;
  };

  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 3;
  
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      progress.value,
      [0, 100],
      [circumference, 0]
    ),
  }));

  // Create sweep path
  const createSweepPath = () => {
    const sweepAngle = (value / 100) * 360;
    const startAngle = -90;
    const endAngle = startAngle + sweepAngle;
    
    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;
    
    const x1 = size / 2 + radius * Math.cos(startRadians);
    const y1 = size / 2 + radius * Math.sin(startRadians);
    const x2 = size / 2 + radius * Math.cos(endRadians);
    const y2 = size / 2 + radius * Math.sin(endRadians);
    
    const largeArc = sweepAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const sweepAnimatedProps = useAnimatedProps(() => ({
    opacity: interpolate(
      sweepProgress.value,
      [0, 0.5, 1],
      [0, 1, 0]
    ),
    strokeWidth: interpolate(
      sweepProgress.value,
      [0, 0.5, 1],
      [strokeWidth, strokeWidth + 2, strokeWidth]
    ),
  }));

  return (
    <View 
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityLabel={`Momentum ${Math.round(value)} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: value, min: 0, max: 100 }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="sweepGradient">
            <Stop offset="0%" stopColor={LuxuryTheme.colors.primary.gold} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={LuxuryTheme.colors.primary.champagne} stopOpacity="0.2" />
          </SvgGradient>
        </Defs>
        
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        
        {/* Sweep highlight for high values */}
        {showSweepHighlight && value >= 80 && !reduceMotion && (
          <AnimatedPath
            d={createSweepPath()}
            stroke="url(#sweepGradient)"
            fill="none"
            animatedProps={sweepAnimatedProps}
            strokeLinecap="round"
          />
        )}
      </Svg>
      
      {showLabel && (
        <View style={styles.label}>
          <Animated.Text style={[styles.value, { color: getColor() }]}>
            {Math.round(value)}
          </Animated.Text>
          {trend && (
            <View style={styles.trend}>
              <Animated.Text style={styles.trendIcon}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </Animated.Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
  trend: {
    marginTop: -2,
  },
  trendIcon: {
    fontSize: 10,
    color: LuxuryTheme.colors.text.tertiary,
  },
});