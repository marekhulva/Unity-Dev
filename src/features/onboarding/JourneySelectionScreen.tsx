import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, Trophy, Sparkles } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { PurchasedProgram } from './types';

const { width, height } = Dimensions.get('window');

interface Props {
  onSelectJourney: (type: 'routine' | 'goal' | 'program', program?: PurchasedProgram) => void;
  purchasedPrograms?: PurchasedProgram[];
}

export const JourneySelectionScreen: React.FC<Props> = ({ 
  onSelectJourney,
  purchasedPrograms = [] 
}) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const renderRoutineCard = () => (
    <Animated.View entering={FadeIn.delay(300).duration(600)}>
      <HapticButton
        hapticType="medium"
        onPress={() => onSelectJourney('routine')}
        style={styles.customJourneyCard}
      >
        <LinearGradient
          colors={['rgba(96, 165, 250, 0.15)', 'rgba(96, 165, 250, 0.05)', 'rgba(96, 165, 250, 0.15)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />

        <View style={styles.customJourneyContent}>
          <View style={styles.customJourneyIcon}>
            <LinearGradient
              colors={['#60A5FA', '#93C5FD']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus color="#000" size={32} strokeWidth={3} />
            </LinearGradient>
          </View>

          <View style={styles.customJourneyText}>
            <Text style={styles.customJourneyTitle}>Create Your Routine</Text>
            <Text style={styles.customJourneySubtitle}>
              Build daily habits for consistent growth
            </Text>
          </View>

          <View style={styles.sparkleContainer}>
            <Sparkles color="#60A5FA" size={24} />
          </View>
        </View>
      </HapticButton>
    </Animated.View>
  );

  const renderGoalCard = () => (
    <Animated.View entering={FadeIn.delay(400).duration(600)} style={{ marginTop: 16 }}>
      <HapticButton
        hapticType="medium"
        onPress={() => onSelectJourney('goal')}
        style={styles.customJourneyCard}
      >
        <LinearGradient
          colors={['rgba(231, 180, 58, 0.15)', 'rgba(231, 180, 58, 0.05)', 'rgba(231, 180, 58, 0.15)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />

        <View style={styles.customJourneyContent}>
          <View style={styles.customJourneyIcon}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Trophy color="#000" size={32} strokeWidth={2} />
            </LinearGradient>
          </View>

          <View style={styles.customJourneyText}>
            <Text style={styles.customJourneyTitle}>Set Your Goal</Text>
            <Text style={styles.customJourneySubtitle}>
              Define your target and achieve greatness
            </Text>
          </View>

          <View style={styles.sparkleContainer}>
            <Sparkles color={LuxuryTheme.colors.primary.gold} size={24} />
          </View>
        </View>
      </HapticButton>
    </Animated.View>
  );

  const renderProgramCard = (program: PurchasedProgram, index: number) => (
    <Animated.View 
      key={program.id}
      entering={SlideInDown.delay(400 + index * 100).springify()}
    >
      <HapticButton
        hapticType="light"
        onPress={() => onSelectJourney('program', program)}
        style={styles.programCard}
      >
        <ImageBackground
          source={{ uri: program.coverImage }}
          style={styles.programCardBg}
          imageStyle={styles.programCardImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.programCardContent}>
            <View style={styles.programHeader}>
              <View style={styles.programBadge}>
                <Trophy color={LuxuryTheme.colors.primary.gold} size={16} />
              </View>
              <Text style={styles.programDuration}>{program.duration}</Text>
            </View>
            
            <View style={styles.programInfo}>
              <Text style={styles.programTitle}>{program.name}</Text>
              <Text style={styles.programAuthor}>by {program.author}</Text>
              <View style={styles.programMeta}>
                <View style={[styles.difficultyBadge, { 
                  backgroundColor: program.difficulty === 'beginner' ? 'rgba(34, 197, 94, 0.2)' :
                                 program.difficulty === 'intermediate' ? 'rgba(96, 165, 250, 0.2)' :
                                 'rgba(167, 139, 250, 0.2)'
                }]}>
                  <Text style={styles.difficultyText}>
                    {program.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </HapticButton>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
      
      <Animated.View style={[styles.content, containerStyle]}>
        <View style={styles.header}>
          <Animated.View entering={FadeIn.duration(800)}>
            <Text style={styles.welcomeText}>Welcome to Excellence</Text>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>
              Start with a proven program or craft your own journey
            </Text>
          </Animated.View>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderRoutineCard()}
          {renderGoalCard()}
          
          {purchasedPrograms.length > 0 && (
            <View style={styles.programsSection}>
              <Animated.View 
                entering={FadeIn.delay(350).duration(600)}
                style={styles.sectionHeader}
              >
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>YOUR PROGRAMS</Text>
                <View style={styles.sectionDivider} />
              </Animated.View>
              
              {purchasedPrograms.map((program, index) => 
                renderProgramCard(program, index)
              )}
            </View>
          )}
        </ScrollView>
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
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 13,
    color: LuxuryTheme.colors.primary.gold,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  customJourneyCard: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    marginBottom: 32,
  },
  customJourneyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  customJourneyIcon: {
    marginRight: 20,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customJourneyText: {
    flex: 1,
  },
  customJourneyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 4,
  },
  customJourneySubtitle: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    lineHeight: 20,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  programsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: LuxuryTheme.colors.interactive.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.tertiary,
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  programCard: {
    height: 180,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  programCardBg: {
    flex: 1,
  },
  programCardImage: {
    borderRadius: 16,
  },
  programCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programBadge: {
    backgroundColor: 'rgba(231, 180, 58, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  programDuration: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.secondary,
    fontWeight: '600',
  },
  programInfo: {
    marginTop: 'auto',
  },
  programTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 4,
  },
  programAuthor: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    marginBottom: 8,
  },
  programMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: LuxuryTheme.colors.text.primary,
    letterSpacing: 1,
  },
});