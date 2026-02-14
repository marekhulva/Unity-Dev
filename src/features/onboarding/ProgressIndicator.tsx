import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';

const { width } = Dimensions.get('window');

interface Props {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
}

export const ProgressIndicator: React.FC<Props> = ({ 
  currentStep,
  totalSteps,
  stepNames = []
}) => {
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withSpring((currentStep + 1) / totalSteps, {
      damping: 20,
      stiffness: 90,
    });
  }, [currentStep, totalSteps]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const getStepName = () => {
    if (stepNames[currentStep]) {
      return stepNames[currentStep];
    }
    
    // Default step names
    const defaultNames = [
      'Journey Selection',
      'Daily Foundation',
      'Foundation Actions',
      'Main Goal',
      'Milestones',
      'Goal Actions',
      'Review & Commit',
    ];
    
    return defaultNames[currentStep] || `Step ${currentStep + 1}`;
  };

  // Don't show on journey selection screen
  if (currentStep === -1) {
    return null;
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(600)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.stepText}>
          {getStepName()}
        </Text>
        <Text style={styles.progressText}>
          {currentStep + 1} of {totalSteps}
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View style={styles.progressBackground} />
        <Animated.View style={[styles.progressFill, progressStyle]}>
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
        
        {/* Step dots */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isCurrent && styles.dotCurrent,
                ]}
              >
                {isActive && (
                  <LinearGradient
                    colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
  },
  progressText: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    letterSpacing: 1,
  },
  progressBar: {
    height: 4,
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dotsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    right: 0,
    top: -3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  dotActive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  dotCurrent: {
    transform: [{ scale: 1.2 }],
  },
});