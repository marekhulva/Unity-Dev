import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Target, Calendar, Heart, TrendingUp, RefreshCw,
  Dumbbell, Brain, Briefcase, HeartHandshake, Lightbulb
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
  runOnJS,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { OnboardingGoal } from './types';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#22C55E' },
  { id: 'mindfulness', label: 'Mindfulness', icon: Brain, color: '#60A5FA' },
  { id: 'productivity', label: 'Productivity', icon: Briefcase, color: '#A78BFA' },
  { id: 'health', label: 'Health', icon: HeartHandshake, color: '#EF4444' },
  { id: 'skills', label: 'Skills', icon: Lightbulb, color: '#F59E0B' },
] as const;

const GOAL_SUGGESTIONS = {
  fitness: ['Hit $300K ARR in my business', 'Hit 10,000 monthly listeners on Spotify', 'Launch a Business', 'Get a 6-figure job', 'Gain 10 lbs of muscle'],
  mindfulness: ['Hit $300K ARR in my business', 'Hit 10,000 monthly listeners on Spotify', 'Launch a Business', 'Get a 6-figure job', 'Gain 10 lbs of muscle'],
  productivity: ['Hit $300K ARR in my business', 'Hit 10,000 monthly listeners on Spotify', 'Launch a Business', 'Get a 6-figure job', 'Gain 10 lbs of muscle'],
  health: ['Hit $300K ARR in my business', 'Hit 10,000 monthly listeners on Spotify', 'Launch a Business', 'Get a 6-figure job', 'Gain 10 lbs of muscle'],
  skills: ['Hit $300K ARR in my business', 'Hit 10,000 monthly listeners on Spotify', 'Launch a Business', 'Get a 6-figure job', 'Gain 10 lbs of muscle'],
};

const ROUTINE_SUGGESTIONS = {
  fitness: ['Morning Routine', 'Inner Practice', 'Night Time Routine', 'Jing Cultivation'],
  mindfulness: ['Morning Routine', 'Inner Practice', 'Night Time Routine', 'Jing Cultivation'],
  productivity: ['Morning Routine', 'Inner Practice', 'Night Time Routine', 'Jing Cultivation'],
  health: ['Morning Routine', 'Inner Practice', 'Night Time Routine', 'Jing Cultivation'],
  skills: ['Morning Routine', 'Inner Practice', 'Night Time Routine', 'Jing Cultivation'],
};

interface Props {
  onSubmit: (goal: OnboardingGoal) => void;
  onBack: () => void;
  isRoutine?: boolean;
  onSkip?: () => void;
}

export const GoalSettingScreen: React.FC<Props> = ({ onSubmit, onBack, isRoutine = false, onSkip }) => {
  const [goal, setGoal] = useState<Partial<OnboardingGoal>>({
    category: 'fitness',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(1); // Skip category selection, start at goal
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming((currentStep + 1) * 33.33, { duration: 300 });
  }, [currentStep]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleCategorySelect = (categoryId: string) => {
    setGoal({ ...goal, category: categoryId as any });
    setTimeout(() => {
      setCurrentStep(1);
    }, 100);
  };

  const handleGoalTitleSubmit = () => {
    if (!goal.title || goal.title.trim().length === 0) {
      return;
    }
    
    // Skip the why step and submit directly
    const completeGoal: OnboardingGoal = {
      title: goal.title,
      category: goal.category as any,
      targetDate: goal.targetDate || new Date(),
      why: '', // Empty why since we're skipping it
      targetValue: goal.targetValue,
      unit: goal.unit,
      currentValue: goal.currentValue,
    };
    
    onSubmit(completeGoal);
  };

  const handleWhySubmit = () => {
    if (!goal.title || goal.title.trim().length === 0) {
      return;
    }
    
    if (!goal.why || goal.why.trim().length === 0) {
      return;
    }
    
    const completeGoal: OnboardingGoal = {
      title: goal.title,
      category: goal.category as any,
      targetDate: goal.targetDate || new Date(),
      why: goal.why,
      targetValue: goal.targetValue,
      unit: goal.unit,
      currentValue: goal.currentValue,
    };
    
    onSubmit(completeGoal);
  };

  const renderCategoryStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.duration(600)}
      >
        <View style={styles.stepHeader}>
          <Target color={LuxuryTheme.colors.primary.gold} size={32} />
          <Text style={styles.stepTitle}>What area of your life?</Text>
          <Text style={styles.stepSubtitle}>Choose your primary focus</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(index * 50).springify()}
              style={styles.categoryCardWrapper}
            >
              <HapticButton
                hapticType="light"
                onPress={() => handleCategorySelect(category.id)}
                style={[
                  styles.categoryCard,
                  goal.category === category.id && styles.categoryCardSelected,
                ]}
              >
                <LinearGradient
                  colors={
                    goal.category === category.id
                      ? [category.color + '20', category.color + '10']
                      : ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)']
                  }
                  style={StyleSheet.absoluteFillObject}
                />
                <category.icon
                  color={goal.category === category.id ? category.color : LuxuryTheme.colors.text.secondary}
                  size={28}
                />
                <Text style={[
                  styles.categoryLabel,
                  goal.category === category.id && { color: category.color }
                ]}>
                  {category.label}
                </Text>
              </HapticButton>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderCalendarModal = () => {
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const handleDateSelect = (day: number) => {
      const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      setGoal({ ...goal, targetDate: newDate });
      setShowCalendarModal(false);
    };
    
    const changeMonth = (direction: number) => {
      const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1);
      setSelectedMonth(newMonth);
    };
    
    return (
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCalendarModal(false)}
        >
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Text style={styles.monthArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text style={styles.monthArrow}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekDaysRow}>
              {days.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <View key={`empty-${i}`} style={styles.emptyDay} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = goal.targetDate?.toDateString() === date.toDateString();
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      isToday && styles.todayButton,
                      isSelected && styles.selectedDayButton,
                      isPast && styles.pastDayButton,
                    ]}
                    onPress={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isSelected && styles.selectedDayText,
                      isPast && styles.pastDayText,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity 
              style={styles.calendarDoneButton}
              onPress={() => setShowCalendarModal(false)}
            >
              <LinearGradient
                colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.calendarDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const renderGoalStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.duration(600)}
      >
      <View style={styles.stepHeader}>
        {isRoutine ? (
          <>
            <RefreshCw color="#6495ED" size={32} />
            <Text style={styles.stepTitle}>Build Your Routine</Text>
            <Text style={styles.stepSubtitle}>
              The non-negotiable habits that optimize your mind, body, and performance
            </Text>
          </>
        ) : (
          <>
            <TrendingUp color={LuxuryTheme.colors.primary.gold} size={32} />
            <Text style={styles.stepTitle}>Set Your Goal</Text>
            <Text style={styles.stepSubtitle}>Set the goals you are working towards</Text>
          </>
        )}
      </View>

      <View style={styles.inputContainer}>
        {isRoutine && (
          <Text style={styles.inputLabel}>What do you want to call this routine?</Text>
        )}
        <TextInput
          style={styles.goalInput}
          placeholder={isRoutine ? "e.g., Morning Power Hour, Evening Wind-Down" : "e.g., Lose 20 pounds"}
          placeholderTextColor={LuxuryTheme.colors.text.muted}
          value={goal.title}
          onChangeText={(text) => setGoal({ ...goal, title: text })}
          autoFocus={!isRoutine}
          multiline
          maxLength={100}
        />
        
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Popular {isRoutine ? 'routines' : 'goals'}:</Text>
          <View style={styles.suggestionChips}>
            {(isRoutine ? ROUTINE_SUGGESTIONS : GOAL_SUGGESTIONS)[goal.category as keyof typeof GOAL_SUGGESTIONS]?.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => setGoal({ ...goal, title: suggestion })}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!isRoutine && (
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Target Date</Text>
            <HapticButton
              hapticType="light"
              onPress={() => {
                setSelectedMonth(goal.targetDate || new Date());
                setShowCalendarModal(true);
              }}
              style={styles.dateButton}
            >
              <Calendar color={LuxuryTheme.colors.text.secondary} size={20} />
              <Text style={styles.dateText}>
                {goal.targetDate?.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </HapticButton>
          </View>
        )}


        <HapticButton
          hapticType="medium"
          onPress={handleGoalTitleSubmit}
          style={[styles.continueButton, !goal.title && styles.continueButtonDisabled]}
          disabled={!goal.title}
        >
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.continueButtonText}>{isRoutine ? 'Set Routine' : 'Set Goal'}</Text>
        </HapticButton>
      </View>
      </Animated.View>
    </ScrollView>
  );

  const renderWhyStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.duration(600)}
      >
      <View style={styles.stepHeader}>
        <Heart color={isRoutine ? "#6495ED" : LuxuryTheme.colors.primary.gold} size={32} />
        <Text style={styles.stepTitle}>{isRoutine ? 'Your Foundation\'s Power' : 'Why this matters'}</Text>
        <Text style={styles.stepSubtitle}>{isRoutine ? 'What this routine will unlock' : 'Your deeper motivation'}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.whyPrompt}>
          {isRoutine 
            ? `When you consistently follow "${goal.title}", what will it give you?`
            : `When you achieve "${goal.title}", how will your life be different?`
          }
        </Text>
        
        <TextInput
          style={styles.whyInput}
          placeholder={isRoutine 
            ? "This routine will give me the energy, clarity, and momentum to..."
            : "This goal matters to me because..."
          }
          placeholderTextColor={LuxuryTheme.colors.text.muted}
          value={goal.why}
          onChangeText={(text) => setGoal({ ...goal, why: text })}
          autoFocus
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <View style={styles.whyTips}>
          <Text style={styles.whyTipsTitle}>{isRoutine ? 'What great routines unlock:' : 'Tips for a powerful why:'}</Text>
          {isRoutine ? (
            <>
              <Text style={styles.whyTip}>• Mental clarity and focus</Text>
              <Text style={styles.whyTip}>• Peak testosterone & energy</Text>
              <Text style={styles.whyTip}>• Consistent high performance</Text>
              <Text style={styles.whyTip}>• Stress resilience & calm confidence</Text>
            </>
          ) : (
            <>
              <Text style={styles.whyTip}>• Connect to your values</Text>
              <Text style={styles.whyTip}>• Think about who you'll become</Text>
              <Text style={styles.whyTip}>• Consider impact on loved ones</Text>
              <Text style={styles.whyTip}>• Visualize the end result</Text>
            </>
          )}
        </View>

        <HapticButton
          hapticType="medium"
          onPress={handleWhySubmit}
          style={[styles.continueButton, !goal.why && styles.continueButtonDisabled]}
          disabled={!goal.why}
        >
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.continueButtonText}>{isRoutine ? 'Set Routine' : 'Set Goal'}</Text>
        </HapticButton>
      </View>
      </Animated.View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
      
      {renderCalendarModal()}

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, progressStyle]}>
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>

      <View style={styles.stepsContainer}>
        {/* Category step skipped - starting directly with goal */}
        {/* currentStep === 0 && renderCategoryStep() */}
        {currentStep === 1 && renderGoalStep()}
        {/* Why step removed - going directly from goal to milestones */}
        {/* currentStep === 2 && renderWhyStep() */}
      </View>

      {currentStep > 0 && (
        <HapticButton
          hapticType="light"
          onPress={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            } else {
              onBack();
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </HapticButton>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 60,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  stepsContainer: {
    flex: 1,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
  },
  routineDescription: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    marginTop: 12,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  categoryCardWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  categoryCard: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
    marginTop: 8,
  },
  inputContainer: {
    flex: 1,
  },
  goalInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: LuxuryTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    minHeight: 100,
  },
  suggestionsContainer: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  suggestionText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
  },
  dateSection: {
    marginTop: 32,
  },
  dateLabel: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    flex: 1,
  },
  dateInput: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  whyPrompt: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  whyInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    minHeight: 150,
  },
  whyTips: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(231, 180, 58, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.2)',
  },
  whyTipsTitle: {
    fontSize: 12,
    color: LuxuryTheme.colors.primary.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: '600',
  },
  whyTip: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    lineHeight: 22,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
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
  backButton: {
    position: 'absolute',
    top: 70,
    left: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.secondary,
  },
  
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: LuxuryTheme.colors.background.card || '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthArrow: {
    fontSize: 32,
    color: LuxuryTheme.colors.primary.gold,
    paddingHorizontal: 15,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.tertiary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  emptyDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
  },
  dayButton: {
    width: `${100/7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  selectedDayButton: {
    backgroundColor: LuxuryTheme.colors.primary.gold,
    borderRadius: 20,
  },
  pastDayButton: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
  },
  todayText: {
    color: LuxuryTheme.colors.primary.gold,
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#000',
    fontWeight: '700',
  },
  pastDayText: {
    color: LuxuryTheme.colors.text.muted,
  },
  calendarDoneButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  calendarDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});