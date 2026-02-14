import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Flag, Plus, Trash2, Mountain, Target,
  Sparkles, TrendingUp, Calendar, MapPin,
  Zap, Star, ChevronRight, RotateCw
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { OnboardingGoal, Milestone } from './types';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 100;
const PATH_WIDTH = 3;
const SUMMIT_HEIGHT = 120;

interface Props {
  goal: OnboardingGoal;
  onSubmit: (milestones: Milestone[]) => void;
  onBack: () => void;
}

const generateSmartMilestones = (goal: OnboardingGoal): Milestone[] => {
  const totalDays = Math.ceil(
    (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  const milestoneCount = Math.min(5, Math.max(3, Math.floor(totalDays / 30)));
  const milestones: Milestone[] = [];
  
  for (let i = 1; i <= milestoneCount; i++) {
    const progress = i / milestoneCount;
    const daysFromNow = Math.floor(totalDays * progress);
    const milestoneDate = new Date();
    milestoneDate.setDate(milestoneDate.getDate() + daysFromNow);
    
    let title = `Milestone ${i}`;
    let targetValue = goal.targetValue ? Math.floor(goal.targetValue * progress) : undefined;
    
    // Smart milestone naming based on category
    if (goal.category === 'fitness' && goal.title.toLowerCase().includes('lose')) {
      title = i === 1 ? 'First 10% Progress' :
              i === milestoneCount ? 'Reach Target Weight' :
              `${Math.floor(progress * 100)}% to Goal`;
    } else if (goal.category === 'mindfulness') {
      title = i === 1 ? 'Establish Routine' :
              i === milestoneCount ? 'Master Practice' :
              `Week ${Math.floor(daysFromNow / 7)} Check-in`;
    } else if (goal.category === 'productivity') {
      title = i === 1 ? 'Foundation Phase' :
              i === milestoneCount ? 'Complete Project' :
              `Phase ${i} Complete`;
    }
    
    milestones.push({
      id: `milestone-${i}`,
      title,
      targetDate: milestoneDate,
      targetValue,
      unit: goal.unit,
      completed: false,
      order: i,
    });
  }
  
  return milestones;
};

export const MilestonesScreen: React.FC<Props> = ({ goal, onSubmit, onBack }) => {
  const [milestones, setMilestones] = useState<Milestone[]>(() => 
    generateSmartMilestones(goal)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const scrollY = useSharedValue(0);
  const pathGlow = useSharedValue(0);
  const floatAnim = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Path glow animation
    pathGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Floating animation for elements
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handleAddMilestone = () => {
    const lastMilestone = milestones[milestones.length - 1];
    const secondToLast = milestones[milestones.length - 2];
    
    let newDate: Date;
    if (lastMilestone && secondToLast) {
      const daysDiff = Math.ceil(
        (lastMilestone.targetDate.getTime() - secondToLast.targetDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      newDate = new Date(lastMilestone.targetDate.getTime() + daysDiff * 24 * 60 * 60 * 1000);
    } else {
      newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: `Milestone ${milestones.length + 1}`,
      targetDate: newDate,
      completed: false,
      order: milestones.length + 1,
    };
    setMilestones([...milestones, newMilestone]);
    setEditingId(newMilestone.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Scroll to bottom to show new milestone
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleRegenerateMilestones = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const newMilestones = generateSmartMilestones(goal);
    setMilestones(newMilestones);
  };

  const handleDeleteMilestone = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to remove this milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMilestones(milestones.filter(m => m.id !== id));
          }
        }
      ]
    );
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const getDaysFromNow = (date: Date) => {
    return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getProgressPercentage = (milestone: Milestone) => {
    const totalDays = getDaysFromNow(goal.targetDate);
    const milestoneDays = getDaysFromNow(milestone.targetDate);
    return Math.max(0, Math.min(100, ((totalDays - milestoneDays) / totalDays) * 100));
  };

  const renderMilestone = (milestone: Milestone, index: number) => {
    const isEditing = editingId === milestone.id;
    const isSelected = selectedMilestone === milestone.id;
    const progress = getProgressPercentage(milestone);
    const daysFromNow = getDaysFromNow(milestone.targetDate);
    const isLast = index === milestones.length - 1;
    
    const cardAnimStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: interpolate(floatAnim.value, [-1, 1], [-3, 3]) },
      ],
    }));
    
    return (
      <Animated.View
        key={milestone.id}
        entering={FadeInUp.delay(index * 100).springify()}
        style={[styles.milestoneContainer, cardAnimStyle]}
      >
        {/* Connection Path to Next Milestone */}
        {!isLast && (
          <View style={styles.pathContainer}>
            <Animated.View style={[styles.climbingPath]}>
              <LinearGradient
                colors={['rgba(231, 180, 58, 0.6)', 'rgba(231, 180, 58, 0.2)']}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <Animated.View style={[styles.pathGlow]} />
          </View>
        )}
        
        {/* Milestone Card */}
        <HapticButton
          hapticType="light"
          onPress={() => {
            setSelectedMilestone(isSelected ? null : milestone.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.milestoneCard,
            isSelected && styles.milestoneCardSelected,
          ]}
        >
          <LinearGradient
            colors={
              isSelected
                ? ['rgba(231, 180, 58, 0.2)', 'rgba(231, 180, 58, 0.05)']
                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            }
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Progress Ring */}
          <View style={styles.progressRing}>
            <Svg width={60} height={60} style={styles.progressSvg}>
              <Circle
                cx="30"
                cy="30"
                r="26"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
                fill="none"
              />
              <Circle
                cx="30"
                cy="30"
                r="26"
                stroke={LuxuryTheme.colors.primary.gold}
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </Svg>
            <View style={styles.progressCenter}>
              <MapPin color={LuxuryTheme.colors.primary.gold} size={24} />
            </View>
          </View>
          
          <View style={styles.milestoneContent}>
            {isEditing ? (
              <TextInput
                style={styles.milestoneInput}
                value={milestone.title}
                onChangeText={(text) => handleUpdateMilestone(milestone.id, { title: text })}
                onBlur={() => setEditingId(null)}
                autoFocus
                placeholder="Milestone name..."
                placeholderTextColor={LuxuryTheme.colors.text.muted}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setEditingId(milestone.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.milestoneTitle}>
                  {milestone.title}
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.milestoneMetaRow}>
              <View style={styles.milestoneMeta}>
                <Calendar color={LuxuryTheme.colors.text.tertiary} size={14} />
                <Text style={styles.milestoneMetaText}>
                  {milestone.targetDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              
              <View style={styles.milestoneMeta}>
                <Zap color={LuxuryTheme.colors.text.tertiary} size={14} />
                <Text style={styles.milestoneMetaText}>
                  {daysFromNow} days
                </Text>
              </View>
            </View>
            
            {milestone.targetValue && (
              <View style={styles.targetValue}>
                <Text style={styles.targetValueText}>
                  {milestone.targetValue} {milestone.unit}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => handleDeleteMilestone(milestone.id)}
            style={styles.deleteButton}
          >
            <Trash2 color={LuxuryTheme.colors.text.muted} size={16} />
          </TouchableOpacity>
          
          {/* Altitude Indicator */}
          <View style={styles.altitudeIndicator}>
            <Text style={styles.altitudeText}>{Math.round(progress)}%</Text>
            <Text style={styles.altitudeLabel}>altitude</Text>
          </View>
        </HapticButton>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
      
      {/* Animated Background Stars */}
      <View style={StyleSheet.absoluteFillObject}>
        {[...Array(30)].map((_, i) => {
          const animStyle = useAnimatedStyle(() => ({
            opacity: interpolate(
              pathGlow.value,
              [0, 1],
              [0.2, 0.6]
            ),
          }));
          return (
            <Animated.View
              key={i}
              style={[
                styles.star,
                animStyle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                },
              ]}
            />
          );
        })}
      </View>
      
      <View style={styles.header}>
        <Animated.View entering={FadeIn.duration(600)}>
          <View style={styles.headerIcon}>
            <Mountain color={LuxuryTheme.colors.primary.gold} size={32} />
          </View>
          <Text style={styles.screenTitle}>The Ascent</Text>
          <Text style={styles.screenSubtitle}>
            Plant your flags on the way to the summit
          </Text>
        </Animated.View>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Summit - The Goal */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          style={styles.summit}
        >
          <LinearGradient
            colors={['rgba(231, 180, 58, 0.3)', 'rgba(231, 180, 58, 0.1)', 'transparent']}
            style={styles.summitGlow}
            locations={[0, 0.5, 1]}
          />
          
          <View style={styles.summitCard}>
            <LinearGradient
              colors={['rgba(231, 180, 58, 0.15)', 'rgba(231, 180, 58, 0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.summitIcon}>
              <Target color={LuxuryTheme.colors.primary.gold} size={28} />
            </View>
            <Text style={styles.summitLabel}>SUMMIT</Text>
            <Text style={styles.summitTitle}>{goal.title}</Text>
            <Text style={styles.summitDate}>
              {goal.targetDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <View style={styles.summitStars}>
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  color={LuxuryTheme.colors.primary.gold}
                  size={16}
                  fill={LuxuryTheme.colors.primary.gold}
                />
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Milestones - The Journey */}
        <View style={styles.journeyContainer}>
          {milestones.slice().reverse().map((milestone, index) => 
            renderMilestone(milestone, milestones.length - 1 - index)
          )}
        </View>
        
        {/* Base Camp - Starting Point */}
        <Animated.View 
          entering={FadeInUp.delay(milestones.length * 100 + 200).springify()}
          style={styles.baseCamp}
        >
          <View style={styles.baseCampCard}>
            <LinearGradient
              colors={['rgba(192, 192, 192, 0.1)', 'rgba(192, 192, 192, 0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Flag color={LuxuryTheme.colors.primary.silver} size={20} />
            <Text style={styles.baseCampText}>BASE CAMP</Text>
            <Text style={styles.baseCampSubtext}>Your journey begins here</Text>
          </View>
        </Animated.View>
        
        {/* Add Milestone Button */}
        <Animated.View entering={FadeInUp.delay(milestones.length * 100 + 300).springify()}>
          <HapticButton
            hapticType="light"
            onPress={handleAddMilestone}
            style={styles.addButton}
          >
            <Plus color={LuxuryTheme.colors.text.secondary} size={20} />
            <Text style={styles.addButtonText}>Add Waypoint</Text>
          </HapticButton>
        </Animated.View>
      </ScrollView>
      
      {/* AI Regenerate Button */}
      <Animated.View 
        entering={FadeIn.delay(500)}
        style={styles.regenerateButton}
      >
        <HapticButton
          hapticType="medium"
          onPress={handleRegenerateMilestones}
          style={styles.regenerateButtonInner}
        >
          <LinearGradient
            colors={['rgba(231, 180, 58, 0.1)', 'rgba(231, 180, 58, 0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <RotateCw color={LuxuryTheme.colors.primary.gold} size={18} />
          <Text style={styles.regenerateText}>AI Suggest</Text>
        </HapticButton>
      </Animated.View>
      
      <View style={styles.footer}>
        <HapticButton
          hapticType="light"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </HapticButton>
        
        <HapticButton
          hapticType="medium"
          onPress={() => onSubmit(milestones)}
          style={[styles.continueButton, milestones.length === 0 && styles.continueButtonDisabled]}
          disabled={milestones.length === 0}
        >
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.continueButtonText}>
            Begin Ascent {milestones.length > 0 && `(${milestones.length})`}
          </Text>
        </HapticButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  star: {
    position: 'absolute',
    backgroundColor: LuxuryTheme.colors.primary.gold,
    borderRadius: 50,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  screenSubtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  journeyContainer: {
    marginVertical: 20,
  },
  summit: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  summitGlow: {
    position: 'absolute',
    width: width * 0.8,
    height: 200,
    top: -50,
    borderRadius: 100,
  },
  summitCard: {
    width: width - 48,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: LuxuryTheme.colors.primary.gold,
    alignItems: 'center',
    overflow: 'hidden',
  },
  summitIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(231, 180, 58, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summitLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: LuxuryTheme.colors.primary.gold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  summitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  summitDate: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    marginBottom: 12,
  },
  summitStars: {
    flexDirection: 'row',
    gap: 8,
  },
  baseCamp: {
    alignItems: 'center',
    marginTop: 20,
  },
  baseCampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.primary.silver,
    overflow: 'hidden',
  },
  baseCampText: {
    fontSize: 12,
    fontWeight: '700',
    color: LuxuryTheme.colors.primary.silver,
    letterSpacing: 1,
  },
  baseCampSubtext: {
    fontSize: 11,
    color: LuxuryTheme.colors.text.tertiary,
  },
  milestoneContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  pathContainer: {
    position: 'absolute',
    left: '50%',
    top: CARD_HEIGHT,
    width: PATH_WIDTH,
    height: 60,
    marginLeft: -PATH_WIDTH / 2,
    zIndex: -1,
  },
  climbingPath: {
    flex: 1,
    borderRadius: PATH_WIDTH / 2,
    overflow: 'hidden',
  },
  pathGlow: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    bottom: 0,
    backgroundColor: LuxuryTheme.colors.primary.gold,
    opacity: 0.2,
    borderRadius: 20,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    overflow: 'hidden',
    minHeight: CARD_HEIGHT,
  },
  milestoneCardSelected: {
    borderColor: LuxuryTheme.colors.primary.gold,
    borderWidth: 2,
  },
  progressRing: {
    marginRight: 16,
    position: 'relative',
  },
  progressSvg: {
    transform: [{ rotate: '0deg' }],
  },
  progressCenter: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  milestoneInput: {
    fontSize: 17,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    padding: 0,
    marginBottom: 8,
  },
  milestoneMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  milestoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneMetaText: {
    fontSize: 13,
    color: LuxuryTheme.colors.text.tertiary,
  },
  targetValue: {
    marginTop: 8,
    backgroundColor: 'rgba(231, 180, 58, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  targetValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: LuxuryTheme.colors.primary.gold,
  },
  deleteButton: {
    padding: 8,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  altitudeIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    alignItems: 'center',
  },
  altitudeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.primary.gold,
  },
  altitudeLabel: {
    fontSize: 9,
    color: LuxuryTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    borderStyle: 'dashed',
    marginTop: 20,
    marginHorizontal: 40,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  regenerateButton: {
    position: 'absolute',
    top: 150,
    right: 24,
    zIndex: 10,
  },
  regenerateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.3)',
    overflow: 'hidden',
  },
  regenerateText: {
    fontSize: 12,
    fontWeight: '600',
    color: LuxuryTheme.colors.primary.gold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  backButton: {
    flex: 0.3,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  continueButton: {
    flex: 0.7,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});