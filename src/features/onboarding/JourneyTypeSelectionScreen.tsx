import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RefreshCw, Target, ArrowRight, CheckCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Props {
  onSelectType: (type: 'routine' | 'goal') => void;
  onProceed: () => void;
  hasRoutine: boolean;
  hasGoal: boolean;
}

export const JourneyTypeSelectionScreen: React.FC<Props> = ({ 
  onSelectType,
  onProceed,
  hasRoutine,
  hasGoal
}) => {
  const routineScale = useSharedValue(1);
  const goalScale = useSharedValue(1);

  const handleRoutinePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    routineScale.value = withSpring(0.95, {}, () => {
      routineScale.value = withSpring(1);
    });
    onSelectType('routine');
  };

  const handleGoalPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goalScale.value = withSpring(0.95, {}, () => {
      goalScale.value = withSpring(1);
    });
    onSelectType('goal');
  };

  const routineStyle = useAnimatedStyle(() => ({
    transform: [{ scale: routineScale.value }],
  }));

  const goalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goalScale.value }],
  }));

  const canProceed = hasRoutine || hasGoal;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#000', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        <Animated.View 
          entering={FadeIn.duration(600)}
          style={styles.header}
        >
          <Text style={styles.subtitle}>BUILD YOUR JOURNEY</Text>
          <Text style={styles.title}>What would you like to add?</Text>
          <Text style={styles.description}>
            Create daily routines for consistency or set specific goals to achieve
          </Text>
        </Animated.View>
        
        <View style={styles.optionsContainer}>
          <Animated.View
            entering={SlideInDown.delay(200).springify()}
            style={[styles.optionWrapper, routineStyle]}
          >
            <Pressable onPress={handleRoutinePress} style={styles.optionCard}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient
                colors={['rgba(96,165,250,0.1)', 'rgba(96,165,250,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={['#60A5FA', '#3B82F6']}
                    style={styles.iconGradient}
                  >
                    <RefreshCw color="#FFF" size={28} />
                  </LinearGradient>
                </View>
                
                <Text style={styles.optionTitle}>Daily Routine</Text>
                <Text style={styles.optionDescription}>
                  Build habits that become your foundation
                </Text>
                
                {hasRoutine && (
                  <View style={styles.addedBadge}>
                    <CheckCircle size={14} color="#60A5FA" />
                    <Text style={styles.addedText}>Added</Text>
                  </View>
                )}
                
                <View style={styles.examples}>
                  <Text style={styles.exampleText}>• Morning meditation</Text>
                  <Text style={styles.exampleText}>• Daily workout</Text>
                  <Text style={styles.exampleText}>• Evening reflection</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
          
          <Animated.View
            entering={SlideInDown.delay(300).springify()}
            style={[styles.optionWrapper, goalStyle]}
          >
            <Pressable onPress={handleGoalPress} style={styles.optionCard}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                    style={styles.iconGradient}
                  >
                    <Target color="#000" size={28} />
                  </LinearGradient>
                </View>
                
                <Text style={styles.optionTitle}>Specific Goal</Text>
                <Text style={styles.optionDescription}>
                  Set targets with deadlines to achieve
                </Text>
                
                {hasGoal && (
                  <View style={styles.addedBadge}>
                    <CheckCircle size={14} color={LuxuryTheme.colors.primary.gold} />
                    <Text style={styles.addedText}>Added</Text>
                  </View>
                )}
                
                <View style={styles.examples}>
                  <Text style={styles.exampleText}>• Lose 20 pounds</Text>
                  <Text style={styles.exampleText}>• Run a marathon</Text>
                  <Text style={styles.exampleText}>• Learn Spanish</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
        
        {canProceed && (
          <Animated.View 
            entering={FadeIn.delay(500).duration(600)}
            style={styles.proceedContainer}
          >
            <Text style={styles.orText}>
              Add more or continue with what you have
            </Text>
            
            <HapticButton
              hapticType="medium"
              onPress={onProceed}
              style={styles.proceedButton}
            >
              <LinearGradient
                colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.proceedButtonText}>Continue to Review</Text>
              <ArrowRight color="#000" size={20} />
            </HapticButton>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 12,
    color: LuxuryTheme.colors.primary.gold,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: LuxuryTheme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  optionWrapper: {
    flex: 1,
  },
  optionCard: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  optionContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 13,
    color: LuxuryTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  addedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addedText: {
    fontSize: 11,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  examples: {
    width: '100%',
    marginTop: 'auto',
  },
  exampleText: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    marginBottom: 6,
  },
  proceedContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  orText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  proceedButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  proceedButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
});