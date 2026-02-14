import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  Pressable,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  RefreshCw, Brain, Activity, Heart,
  Moon, PenTool, CheckCircle, Plus, Clock,
  X, Calendar, Trash2
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import * as Haptics from 'expo-haptics';
import { OnboardingGoal, Action } from './types';
import { TimePickerInput } from '../../components/TimePickerInput';

const { width, height } = Dimensions.get('window');

const ROUTINE_ACTION_TEMPLATES = [
  { icon: Brain, title: 'Sitting Meditation', frequency: 'daily', duration: 45, category: 'mindfulness', selected: true, defaultTime: '06:00' },
  { icon: Activity, title: 'Standing Meditation', frequency: 'daily', duration: 20, category: 'mindfulness', selected: true, defaultTime: '07:00' },
  { icon: Heart, title: 'Breathwork', frequency: 'daily', duration: 10, category: 'mindfulness', selected: true, defaultTime: '08:00' },
  { icon: Moon, title: 'Yoga/Stretching', frequency: 'daily', duration: 30, category: 'fitness', selected: true, defaultTime: '18:00' },
  { icon: PenTool, title: 'Journaling', frequency: 'daily', duration: 15, category: 'mindfulness', selected: true, defaultTime: '21:00' },
];

const ROUTINE_SUGGESTIONS = [
  'Morning Routine',
  'Inner Practice',
  'Night Time Routine',
  'Jing Cultivation'
];

const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Every Other Day', value: 'everyOtherDay' },
  { label: '3x per week', value: 'threePerWeek' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Weekends', value: 'weekends' },
];

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 'monday', short: 'M' },
  { label: 'Tue', value: 'tuesday', short: 'T' },
  { label: 'Wed', value: 'wednesday', short: 'W' },
  { label: 'Thu', value: 'thursday', short: 'T' },
  { label: 'Fri', value: 'friday', short: 'F' },
  { label: 'Sat', value: 'saturday', short: 'S' },
  { label: 'Sun', value: 'sunday', short: 'S' },
];

interface CustomAction {
  id: string;
  title: string;
  duration: number;
  frequency: string;
  timeOfDay: string;
  category: string;
  selected: boolean;
  isCustom?: boolean;
  icon?: any;
  scheduledDays?: string[]; // For weekly and 3x/week: ['monday', 'wednesday', 'friday']
}

interface Props {
  onSubmit: (routine: OnboardingGoal, actions: Action[]) => void;
  onBack: () => void;
}

export const RoutineBuilderScreen: React.FC<Props> = ({ onSubmit, onBack }) => {
  const [routineName, setRoutineName] = useState('');
  const [selectedActions, setSelectedActions] = useState<CustomAction[]>(
    ROUTINE_ACTION_TEMPLATES.map((template, index) => ({
      ...template,
      id: `action-${index}`,
      selected: template.selected,
      timeOfDay: template.defaultTime || '09:00',
      isCustom: false,
      scheduledDays: template.frequency === 'weekly' ? ['monday'] :
                     template.frequency === 'threePerWeek' ? ['monday', 'wednesday', 'friday'] :
                     undefined,
    }))
  );
  const [showCustomActionModal, setShowCustomActionModal] = useState(false);
  const [editingAction, setEditingAction] = useState<CustomAction | null>(null);
  const [customActionTitle, setCustomActionTitle] = useState('');
  const [customActionDuration, setCustomActionDuration] = useState('30');
  const [customActionFrequency, setCustomActionFrequency] = useState('daily');
  const [customActionTime, setCustomActionTime] = useState('09:00');
  const [customActionScheduledDays, setCustomActionScheduledDays] = useState<string[]>([]);
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const toggleAction = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...selectedActions];
    updated[index].selected = !updated[index].selected;
    setSelectedActions(updated);
  };

  const handleTimeChange = (index: number, time: string) => {
    const updated = [...selectedActions];
    updated[index].timeOfDay = time;
    setSelectedActions(updated);
  };

  const handleFrequencyChange = (index: number, frequency: string) => {
    const updated = [...selectedActions];
    updated[index].frequency = frequency;

    // Set default scheduled days based on frequency
    if (frequency === 'weekly') {
      updated[index].scheduledDays = ['monday'];
    } else if (frequency === 'threePerWeek') {
      updated[index].scheduledDays = ['monday', 'wednesday', 'friday'];
    } else {
      updated[index].scheduledDays = undefined;
    }

    setSelectedActions(updated);
  };

  const handleDayToggle = (index: number, day: string) => {
    const updated = [...selectedActions];
    const action = updated[index];
    if (!action.scheduledDays) action.scheduledDays = [];

    if (action.frequency === 'weekly') {
      // For weekly, only one day can be selected
      action.scheduledDays = [day];
    } else if (action.frequency === 'threePerWeek') {
      // For 3x/week, toggle the day and limit to 3 days
      const dayIndex = action.scheduledDays.indexOf(day);
      if (dayIndex > -1) {
        action.scheduledDays.splice(dayIndex, 1);
      } else if (action.scheduledDays.length < 3) {
        action.scheduledDays.push(day);
      }
    }

    setSelectedActions(updated);
  };

  const openCustomActionModal = (action?: CustomAction) => {
    if (action) {
      setEditingAction(action);
      setCustomActionTitle(action.title);
      setCustomActionDuration(action.duration.toString());
      setCustomActionFrequency(action.frequency);
      setCustomActionTime(action.timeOfDay);
      setCustomActionScheduledDays(action.scheduledDays || []);
    } else {
      setEditingAction(null);
      setCustomActionTitle('');
      setCustomActionDuration('30');
      setCustomActionFrequency('daily');
      setCustomActionTime('09:00');
      setCustomActionScheduledDays([]);
    }
    setShowCustomActionModal(true);
  };

  const saveCustomAction = () => {
    if (!customActionTitle.trim() || !customActionDuration.trim()) return;

    // Validate scheduled days for weekly and 3x/week
    if (customActionFrequency === 'weekly' && customActionScheduledDays.length !== 1) {
      return; // Weekly must have exactly 1 day
    }
    if (customActionFrequency === 'threePerWeek' && customActionScheduledDays.length !== 3) {
      return; // 3x/week must have exactly 3 days
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const scheduledDays = (customActionFrequency === 'weekly' || customActionFrequency === 'threePerWeek')
      ? customActionScheduledDays
      : undefined;

    if (editingAction) {
      const updated = selectedActions.map(action =>
        action.id === editingAction.id
          ? {
              ...action,
              title: customActionTitle,
              duration: parseInt(customActionDuration) || 30,
              frequency: customActionFrequency,
              timeOfDay: customActionTime,
              scheduledDays: scheduledDays,
            }
          : action
      );
      setSelectedActions(updated);
    } else {
      const newAction: CustomAction = {
        id: `custom-${Date.now()}`,
        title: customActionTitle,
        duration: parseInt(customActionDuration) || 30,
        frequency: customActionFrequency,
        timeOfDay: customActionTime,
        category: 'custom',
        selected: true,
        isCustom: true,
        icon: Plus,
        scheduledDays: scheduledDays,
      };
      setSelectedActions([...selectedActions, newAction]);
    }

    setShowCustomActionModal(false);
  };

  const deleteAction = (actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = selectedActions.filter(action => action.id !== actionId);
    setSelectedActions(updated);
  };

  const handleSubmit = () => {
    if (!routineName.trim()) return;
    
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });
    
    const routine: OnboardingGoal = {
      title: routineName,
      category: 'health',
      targetDate: new Date(),
      why: '',
    };
    
    const actions: Action[] = selectedActions
      .filter(a => a.selected)
      .map(action => ({
        id: action.id,
        type: 'commitment' as const,
        title: action.title,
        category: action.category,
        icon: 'default',
        frequency: action.frequency === 'everyOtherDay' ? 'every_other_day' :
                   action.frequency === 'threePerWeek' ? 'three_per_week' :
                   action.frequency === 'weekdays' ? 'weekdays' :
                   action.frequency === 'weekends' ? 'weekends' :
                   action.frequency === 'weekly' ? 'weekly' : 'daily',
        duration: action.duration,
        timeOfDay: action.timeOfDay || '09:00',
        reminder: true,
        reminderTime: action.timeOfDay || '09:00',
        requiresTime: true, // All routine actions have times
        scheduledDays: action.scheduledDays, // For weekly and 3x/week frequencies
      }));
    
    onSubmit(routine, actions);
  };

  const canContinue = routineName.trim().length > 0 && selectedActions.some(a => a.selected);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#000000', '#000', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeIn.duration(600)}
          style={styles.header}
        >
          <RefreshCw color="#6495ED" size={32} />
          <Text style={styles.title}>Build Your Routine</Text>
          <Text style={styles.subtitle}>
            Create your daily foundation for optimal performance
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>What do you want to call this routine?</Text>
          
          <TextInput
            style={styles.input}
            placeholder="e.g., Morning Power Hour"
            placeholderTextColor={LuxuryTheme.colors.text.muted}
            value={routineName}
            onChangeText={setRoutineName}
            maxLength={50}
          />
          
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsLabel}>Popular routines:</Text>
            <View style={styles.suggestionChips}>
              {ROUTINE_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => setRoutineName(suggestion)}
                  style={styles.suggestionChip}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Select your routine activities</Text>
          <Text style={styles.sectionHint}>These are pre-selected based on best practices</Text>
          
          <View style={styles.actionsList}>
            {selectedActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Animated.View 
                  key={action.id}
                  entering={FadeInDown.delay(500 + index * 50).duration(400)}
                >
                  <View style={[
                    styles.actionCard,
                    action.selected && styles.actionCardSelected
                  ]}>
                    <Pressable
                      onPress={() => toggleAction(index)}
                      style={styles.actionCardContent}
                    >
                      <View style={styles.actionIcon}>
                        <IconComponent
                          size={24}
                          color={action.selected ? '#FFD700' : 'rgba(255,255,255,0.5)'}
                        />
                      </View>
                      <View style={styles.actionInfo}>
                        <Text style={[
                          styles.actionTitle,
                          action.selected && styles.actionTitleSelected
                        ]}>
                          {action.title}
                        </Text>
                        <Text style={styles.actionDuration}>
                          {action.duration} min • {
                            FREQUENCY_OPTIONS.find(f => f.value === action.frequency)?.label || 'Daily'
                          }
                        </Text>
                      </View>
                      <View style={[
                        styles.checkbox,
                        action.selected && styles.checkboxSelected
                      ]}>
                        {action.selected && (
                          <CheckCircle size={20} color="#FFD700" />
                        )}
                      </View>
                    </Pressable>
                    {action.selected && (
                      <>
                        <View style={styles.timePickerContainer}>
                          <View style={styles.timePickerLabel}>
                            <Clock size={14} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.timePickerLabelText}>Time:</Text>
                          </View>
                          <TimePickerInput
                            value={action.timeOfDay}
                            onChange={(time) => handleTimeChange(index, time)}
                          />
                        </View>
                        <View style={styles.frequencyContainer}>
                          <View style={styles.timePickerLabel}>
                            <Calendar size={14} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.timePickerLabelText}>Frequency:</Text>
                          </View>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.frequencyScroll}
                          >
                            {FREQUENCY_OPTIONS.map((freq) => (
                              <Pressable
                                key={freq.value}
                                onPress={() => handleFrequencyChange(index, freq.value)}
                                style={[
                                  styles.frequencyChip,
                                  action.frequency === freq.value && styles.frequencyChipSelected
                                ]}
                              >
                                <Text style={[
                                  styles.frequencyChipText,
                                  action.frequency === freq.value && styles.frequencyChipTextSelected
                                ]}>
                                  {freq.label}
                                </Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                        {(action.frequency === 'weekly' || action.frequency === 'threePerWeek') && (
                          <View style={styles.daysContainer}>
                            <Text style={styles.daysLabel}>
                              {action.frequency === 'weekly' ? 'Select day:' : 'Select 3 days:'}
                            </Text>
                            <View style={styles.daysGrid}>
                              {DAYS_OF_WEEK.map((day) => (
                                <Pressable
                                  key={day.value}
                                  onPress={() => handleDayToggle(index, day.value)}
                                  style={[
                                    styles.dayChip,
                                    action.scheduledDays?.includes(day.value) && styles.dayChipSelected
                                  ]}
                                >
                                  <Text style={[
                                    styles.dayChipText,
                                    action.scheduledDays?.includes(day.value) && styles.dayChipTextSelected
                                  ]}>
                                    {day.short}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                            {action.frequency === 'threePerWeek' && (
                              <Text style={styles.daysHint}>
                                {action.scheduledDays?.length || 0}/3 days selected
                              </Text>
                            )}
                          </View>
                        )}
                        {action.isCustom && (
                          <View style={styles.actionButtonsContainer}>
                            <Pressable
                              onPress={() => openCustomActionModal(action)}
                              style={styles.editButton}
                            >
                              <PenTool size={16} color="#60A5FA" />
                              <Text style={styles.editButtonText}>Edit</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => deleteAction(action.id)}
                              style={styles.deleteButton}
                            >
                              <Trash2 size={16} color="#FF6B6B" />
                              <Text style={styles.deleteButtonText}>Delete</Text>
                            </Pressable>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </Animated.View>
              );
            })}

            <HapticButton
              hapticType="light"
              onPress={() => openCustomActionModal()}
              style={styles.addCustomActionButton}
            >
              <View style={styles.addCustomActionContent}>
                <View style={styles.addCustomActionIcon}>
                  <Plus size={20} color="#60A5FA" />
                </View>
                <Text style={styles.addCustomActionText}>Add Custom Action</Text>
              </View>
            </HapticButton>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(800).duration(600)}
          style={styles.buttonContainer}
        >
          <Animated.View style={buttonStyle}>
            <HapticButton
              hapticType="medium"
              onPress={handleSubmit}
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
              disabled={!canContinue}
            >
              <LinearGradient
                colors={canContinue 
                  ? [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]
                  : ['#333', '#222']
                }
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.continueButtonText}>Continue</Text>
            </HapticButton>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showCustomActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1A1A1A', '#000']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAction ? 'Edit Action' : 'Add Custom Action'}
              </Text>
              <Pressable
                onPress={() => setShowCustomActionModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Action Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Morning Walk"
                  placeholderTextColor={LuxuryTheme.colors.text.muted}
                  value={customActionTitle}
                  onChangeText={setCustomActionTitle}
                  maxLength={50}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="30"
                  placeholderTextColor={LuxuryTheme.colors.text.muted}
                  value={customActionDuration}
                  onChangeText={setCustomActionDuration}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Time</Text>
                <TimePickerInput
                  value={customActionTime}
                  onChange={setCustomActionTime}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Frequency</Text>
                <View style={styles.modalFrequencyGrid}>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <Pressable
                      key={freq.value}
                      onPress={() => {
                        setCustomActionFrequency(freq.value);
                        // Set default scheduled days when frequency changes
                        if (freq.value === 'weekly') {
                          setCustomActionScheduledDays(['monday']);
                        } else if (freq.value === 'threePerWeek') {
                          setCustomActionScheduledDays(['monday', 'wednesday', 'friday']);
                        } else {
                          setCustomActionScheduledDays([]);
                        }
                      }}
                      style={[
                        styles.modalFrequencyOption,
                        customActionFrequency === freq.value && styles.modalFrequencyOptionSelected
                      ]}
                    >
                      <Text style={[
                        styles.modalFrequencyText,
                        customActionFrequency === freq.value && styles.modalFrequencyTextSelected
                      ]}>
                        {freq.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {(customActionFrequency === 'weekly' || customActionFrequency === 'threePerWeek') && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>
                    {customActionFrequency === 'weekly' ? 'Select Day' : 'Select 3 Days'}
                  </Text>
                  <View style={styles.modalDaysGrid}>
                    {DAYS_OF_WEEK.map((day) => (
                      <Pressable
                        key={day.value}
                        onPress={() => {
                          if (customActionFrequency === 'weekly') {
                            setCustomActionScheduledDays([day.value]);
                          } else if (customActionFrequency === 'threePerWeek') {
                            const dayIndex = customActionScheduledDays.indexOf(day.value);
                            if (dayIndex > -1) {
                              setCustomActionScheduledDays(customActionScheduledDays.filter(d => d !== day.value));
                            } else if (customActionScheduledDays.length < 3) {
                              setCustomActionScheduledDays([...customActionScheduledDays, day.value]);
                            }
                          }
                        }}
                        style={[
                          styles.modalDayOption,
                          customActionScheduledDays.includes(day.value) && styles.modalDayOptionSelected
                        ]}
                      >
                        <Text style={[
                          styles.modalDayText,
                          customActionScheduledDays.includes(day.value) && styles.modalDayTextSelected
                        ]}>
                          {day.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {customActionFrequency === 'threePerWeek' && (
                    <Text style={styles.modalDaysHint}>
                      {customActionScheduledDays.length}/3 days selected
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <HapticButton
                hapticType="medium"
                onPress={saveCustomAction}
                style={[
                  styles.modalSaveButton,
                  (!customActionTitle.trim() || !customActionDuration.trim()) && styles.modalSaveButtonDisabled
                ]}
                disabled={!customActionTitle.trim() || !customActionDuration.trim()}
              >
                <LinearGradient
                  colors={
                    customActionTitle.trim() && customActionDuration.trim()
                      ? ['#60A5FA', '#93C5FD']
                      : ['#333', '#222']
                  }
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.modalSaveButtonText}>
                  {editingAction ? 'Save Changes' : 'Add Action'}
                </Text>
              </HapticButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.muted,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  suggestions: {
    marginBottom: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.muted,
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  suggestionText: {
    fontSize: 13,
    color: '#FFD700',
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionCardSelected: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  actionTitleSelected: {
    color: '#FFFFFF',
  },
  actionDuration: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.muted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
  },
  timePickerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timePickerLabelText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  buttonContainer: {
    marginTop: 32,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  frequencyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  frequencyScroll: {
    marginTop: 8,
  },
  frequencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  frequencyChipSelected: {
    backgroundColor: 'rgba(100,149,237,0.2)',
    borderColor: '#60A5FA',
  },
  frequencyChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  frequencyChipTextSelected: {
    color: '#60A5FA',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  editButtonText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  addCustomActionButton: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(96,165,250,0.3)',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(96,165,250,0.05)',
    padding: 16,
  },
  addCustomActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96,165,250,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addCustomActionText: {
    fontSize: 15,
    color: '#60A5FA',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalFrequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFrequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  modalFrequencyOptionSelected: {
    backgroundColor: 'rgba(100,149,237,0.2)',
    borderColor: '#60A5FA',
  },
  modalFrequencyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  modalFrequencyTextSelected: {
    color: '#60A5FA',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalSaveButton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  daysLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    marginTop: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: 'rgba(100,149,237,0.2)',
    borderColor: '#60A5FA',
  },
  dayChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: '#60A5FA',
  },
  daysHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
  },
  modalDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalDayOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
    minWidth: 65,
    alignItems: 'center',
  },
  modalDayOptionSelected: {
    backgroundColor: 'rgba(100,149,237,0.2)',
    borderColor: '#60A5FA',
  },
  modalDayText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  modalDayTextSelected: {
    color: '#60A5FA',
    fontWeight: '500',
  },
  modalDaysHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
});