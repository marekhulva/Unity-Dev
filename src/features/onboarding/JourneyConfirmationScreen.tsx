import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Trophy, Target, Calendar, CheckCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { PurchasedProgram } from './types';

const { width, height } = Dimensions.get('window');

interface Props {
  journeyType: 'routine' | 'goal' | 'program';
  program?: PurchasedProgram;
  onContinue: () => void;
}

export const JourneyConfirmationScreen: React.FC<Props> = ({ 
  journeyType,
  program,
  onContinue 
}) => {
  const scaleAnim = useSharedValue(0.9);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 100 });
    progressAnim.value = withDelay(300, withTiming(1, { duration: 1000 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const getJourneyDetails = () => {
    if (journeyType === 'routine') {
      return {
        title: 'Your Daily Routine',
        subtitle: 'Build consistent habits for growth',
        icon: <Target color="#60A5FA" size={48} />,
        gradient: ['#60A5FA', '#93C5FD'],
        features: [
          'Daily action tracking',
          'Build consistent habits',
          'Flexible scheduling',
          'Track your progress'
        ]
      };
    } else if (journeyType === 'goal') {
      return {
        title: 'Your Goal',
        subtitle: 'Define your target and achieve it',
        icon: <Trophy color={LuxuryTheme.colors.primary.gold} size={48} />,
        gradient: [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne],
        features: [
          'Clear target deadline',
          'Track progress percentage',
          'Milestone achievements',
          'Focused on results'
        ]
      };
    } else if (program) {
      const gradientColors = program.gradient || ['#FFD700', '#FFA500'];
      return {
        title: program.name,
        subtitle: `By ${program.author}`,
        icon: <Trophy color={gradientColors[0]} size={48} />,
        gradient: gradientColors,
        features: program.features || [
          `${program.duration} structured program`,
          'Expert-designed curriculum',
          'Community support',
          'Proven results'
        ]
      };
    }
    return null;
  };

  const details = getJourneyDetails();
  if (!details) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#000', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Animated.View style={[styles.content, containerStyle]}>
        <View style={styles.header}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.iconContainer}
          >
            <LinearGradient
              colors={details.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {details.icon}
            </LinearGradient>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(200).duration(800)}>
            <Text style={styles.confirmText}>Journey Selected</Text>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.subtitle}>{details.subtitle}</Text>
          </Animated.View>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View 
            entering={SlideInUp.delay(400).springify()}
            style={styles.featuresCard}
          >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            
            <Text style={styles.featuresTitle}>What's Included</Text>
            {details.features.map((feature, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(600 + index * 100).duration(400)}
                style={styles.featureRow}
              >
                <CheckCircle 
                  color={LuxuryTheme.colors.primary.gold} 
                  size={20} 
                />
                <Text style={styles.featureText}>{feature}</Text>
              </Animated.View>
            ))}
          </Animated.View>
          
          <Animated.View 
            entering={FadeIn.delay(800).duration(600)}
            style={styles.progressContainer}
          >
            <Text style={styles.progressLabel}>Getting Ready...</Text>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={details.gradient}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
        
        <Animated.View 
          entering={SlideInUp.delay(1000).springify()}
          style={styles.footer}
        >
          <HapticButton
            hapticType="medium"
            onPress={onContinue}
            style={styles.continueButton}
          >
            <LinearGradient
              colors={details.gradient}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.continueButtonText}>
              {journeyType === 'routine' ? 'Build Routine' :
             journeyType === 'goal' ? 'Set Goal' :
             'Begin Program'}
            </Text>
          </HapticButton>
        </Animated.View>
      </Animated.View>
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
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 13,
    color: LuxuryTheme.colors.primary.gold,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.secondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  featuresCard: {
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 15,
    color: LuxuryTheme.colors.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: LuxuryTheme.colors.text.tertiary,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
});