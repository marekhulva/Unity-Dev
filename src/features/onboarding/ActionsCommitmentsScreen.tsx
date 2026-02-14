import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  Switch,
  TouchableOpacity,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Zap, RefreshCw, Calendar, Clock, Bell,
  Brain, Coffee, Book, Heart,
  Plus, X, Check,
  Sun, Activity, Droplets, PenTool,
  Target, TrendingUp, Users
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TimePickerInput } from '../../components/TimePickerInput';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { Action, OnboardingGoal } from './types';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const ROUTINE_ACTION_TEMPLATES = [
  { icon: Brain, title: 'Sitting Meditation', frequency: 'daily', duration: 45, category: 'mindfulness' },
  { icon: Activity, title: 'Standing Meditation', frequency: 'daily', duration: 20, category: 'mindfulness' },
  { icon: Droplets, title: 'Cold Showers', frequency: 'daily', duration: 5, category: 'health' },
  { icon: Sun, title: 'Morning Sunlight', frequency: 'daily', duration: 10, timeOfDay: '07:00', category: 'health' },
  { icon: Zap, title: 'Movement Practice', frequency: 'daily', duration: 20, category: 'fitness' },
  { icon: Heart, title: 'Lower Dantian Work', frequency: 'daily', duration: 15, category: 'mindfulness' },
  { icon: Book, title: 'Reading', frequency: 'daily', duration: 30, category: 'skills' },
  { icon: PenTool, title: 'Journaling', frequency: 'daily', duration: 15, category: 'mindfulness' },
];

const GOAL_ACTION_TEMPLATES = [
  { icon: Target, title: 'Deep Work', frequency: 'daily', duration: 90, category: 'productivity' },
  { icon: TrendingUp, title: 'Market Research', frequency: 'daily', duration: 60, category: 'productivity' },
  { icon: Users, title: 'Marketing/Social Media Work', frequency: 'daily', duration: 45, category: 'productivity' },
  { icon: PenTool, title: 'Journaling & Brainstorming', frequency: 'daily', duration: 30, category: 'mindfulness' },
  { icon: Activity, title: 'Strength Training', frequency: 'daily', duration: 60, category: 'fitness' },
  { icon: Zap, title: 'Cardio', frequency: 'daily', duration: 30, category: 'fitness' },
];

interface Props {
  goal: OnboardingGoal;
  onSubmit: (actions: Action[]) => void;
  onBack: () => void;
  isRoutine?: boolean;
}

export const ActionsCommitmentsScreen: React.FC<Props> = ({ goal, onSubmit, onBack, isRoutine = false }) => {
  const activeTab: 'one-time' | 'commitment' = 'commitment'; // Fixed to commitment, no tabs needed
  const [actions, setActions] = useState<Action[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [expandedTemplateIndex, setExpandedTemplateIndex] = useState<number | null>(null);
  const [customAction, setCustomAction] = useState<Partial<Action>>({
    type: activeTab,
    reminder: true,
    frequency: 'daily',
    timeOfDay: '09:00',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    isAbstinence: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const handleAddAction = (template: any, index: number) => {
    // Toggle expansion of the template card
    if (expandedTemplateIndex === index) {
      setExpandedTemplateIndex(null);
    } else {
      setExpandedTemplateIndex(index);
      setEditingTemplate(template);
      setCustomAction({
        type: activeTab,
        title: template.title,
        category: template.category,
        frequency: template.frequency || 'daily',
        daysPerWeek: template.daysPerWeek,
        duration: template.duration || 30,
        timeOfDay: template.timeOfDay || '09:00',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reminder: true,
        isAbstinence: false,
      });
      setSelectedDays([]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateCustom = () => {
    if (!customAction.title) return;

    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: activeTab,
      title: customAction.title,
      description: customAction.description,
      category: customAction.category || goal.category,
      icon: 'default',
      frequency: customAction.frequency,
      daysPerWeek: customAction.daysPerWeek,
      specificDays: customAction.specificDays,
      duration: customAction.isAbstinence ? undefined : customAction.duration,
      timeOfDay: customAction.isAbstinence ? undefined : customAction.timeOfDay,
      dueDate: customAction.dueDate,
      reminder: customAction.reminder || false,
      reminderTime: customAction.isAbstinence ? undefined : customAction.timeOfDay,
      isAbstinence: customAction.isAbstinence || false,
    };

    setActions([...actions, newAction]);
    setShowCustomForm(false);
    setEditingTemplate(null);
    setExpandedTemplateIndex(null);
    setCustomAction({
      type: activeTab,
      reminder: true,
      frequency: 'daily',
      timeOfDay: '09:00',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAbstinence: false,
    });
    setSelectedDays([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderTemplate = (template: any, index: number) => {
    const IconComponent = template.icon;
    const isAdded = actions.some(a => a.title === template.title);
    const isExpanded = expandedTemplateIndex === index;
    
    return (
      <Animated.View
        key={`${template.title}-${index}`}
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
      >
        <HapticButton
          hapticType="light"
          onPress={() => !isAdded && handleAddAction(template, index)}
          disabled={isAdded}
          style={[styles.templateCard, isAdded && styles.templateCardAdded, isExpanded && styles.templateCardExpanded]}
        >
          <View style={styles.templateIcon}>
            <IconComponent 
              color={isAdded ? LuxuryTheme.colors.primary.gold : LuxuryTheme.colors.text.secondary}
              size={24}
            />
          </View>
          
          <View style={styles.templateContent}>
            <Text style={[styles.templateTitle, isAdded && styles.templateTitleAdded]}>
              {template.title}
            </Text>
            {template.frequency && !isExpanded && (
              <Text style={styles.templateMeta}>
                {template.frequency === 'daily' ? 'Every day' :
                 template.daysPerWeek ? `${template.daysPerWeek}x per week` :
                 template.frequency}
                {template.duration && ` • ${template.duration} min`}
              </Text>
            )}
          </View>
          
          {isAdded ? (
            <Check color={LuxuryTheme.colors.primary.gold} size={20} />
          ) : isExpanded ? (
            <X color={LuxuryTheme.colors.text.tertiary} size={20} />
          ) : (
            <Plus color={LuxuryTheme.colors.text.tertiary} size={20} />
          )}
        </HapticButton>
        
        {isExpanded && !isAdded && renderInlineForm(template)}
      </Animated.View>
    );
  };

  const renderSelectedAction = (action: Action) => (
    <Animated.View
      key={action.id}
      entering={SlideInRight.springify()}
      exiting={SlideOutLeft.springify()}
      layout={Layout.springify()}
      style={styles.selectedAction}
    >
      <View style={styles.selectedActionContent}>
        <Text style={styles.selectedActionTitle}>{action.title}</Text>
        <View style={styles.selectedActionMetaRow}>
          {action.type === 'commitment' && action.frequency && (
            <Text style={styles.selectedActionMeta}>
              {action.frequency === 'daily' ? 'Daily' :
               action.specificDays ? `${action.specificDays.length}x/week` :
               action.frequency}
              {action.timeOfDay && ` at ${action.timeOfDay}`}
              {action.duration && ` • ${action.duration} min`}
            </Text>
          )}
          {action.type === 'one-time' && action.dueDate && (
            <Text style={styles.selectedActionMeta}>
              {action.dueDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {action.timeOfDay && ` at ${action.timeOfDay}`}
            </Text>
          )}
        </View>
      </View>
      
      <HapticButton
        hapticType="light"
        onPress={() => handleRemoveAction(action.id)}
        style={styles.removeButton}
      >
        <X color={LuxuryTheme.colors.text.muted} size={16} />
      </HapticButton>
    </Animated.View>
  );

  const renderInlineForm = (template: any) => (
    <Animated.View
      entering={FadeInDown.springify()}
      style={styles.inlineForm}
    >
        <>
          <View style={styles.actionTypeRow}>
            <Text style={styles.inputLabel}>Action Type</Text>
            <View style={styles.actionTypeOptions}>
              <TouchableOpacity
                onPress={() => setCustomAction({ ...customAction, isAbstinence: false })}
                style={[
                  styles.actionTypeOption,
                  !customAction.isAbstinence && styles.actionTypeOptionActive
                ]}
              >
                <Text style={[
                  styles.actionTypeOptionText,
                  !customAction.isAbstinence && styles.actionTypeOptionTextActive
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCustomAction({ ...customAction, isAbstinence: true })}
                style={[
                  styles.actionTypeOption,
                  customAction.isAbstinence && styles.actionTypeOptionActive
                ]}
              >
                <Text style={[
                  styles.actionTypeOptionText,
                  customAction.isAbstinence && styles.actionTypeOptionTextActive
                ]}>
                  Abstinence
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.actionTypeHint}>
              {customAction.isAbstinence
                ? 'Avoid something (e.g., No Social Media, No Alcohol)'
                : 'Do something (e.g., Meditate, Workout, Read)'}
            </Text>
          </View>

          <View style={styles.frequencyRow}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.frequencyOptions}>
              {['daily', 'weekly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setCustomAction({ ...customAction, frequency: freq as any })}
                  style={[
                    styles.frequencyOption,
                    customAction.frequency === freq && styles.frequencyOptionActive
                  ]}
                >
                  <Text style={[
                    styles.frequencyOptionText,
                    customAction.frequency === freq && styles.frequencyOptionTextActive
                  ]}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {customAction.frequency === 'weekly' && (
            <View style={styles.daysRow}>
              <Text style={styles.inputLabel}>Which days?</Text>
              <View style={styles.weekDaysOptions}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <TouchableOpacity
                    key={`${day}-${index}`}
                    onPress={() => {
                      const newDays = selectedDays.includes(index)
                        ? selectedDays.filter(d => d !== index)
                        : [...selectedDays, index];
                      setSelectedDays(newDays);
                      setCustomAction({ 
                        ...customAction, 
                        specificDays: newDays,
                        daysPerWeek: newDays.length 
                      });
                    }}
                    style={[
                      styles.weekDayOption,
                      selectedDays.includes(index) && styles.weekDayOptionActive
                    ]}
                  >
                    <Text style={[
                      styles.weekDayOptionText,
                      selectedDays.includes(index) && styles.weekDayOptionTextActive
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!customAction.isAbstinence && (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.inputLabel}>Time</Text>
                <TimePickerInput
                  value={customAction.timeOfDay || '09:00'}
                  onChange={(time) => setCustomAction({ ...customAction, timeOfDay: time })}
                />
              </View>

              <View style={styles.durationRow}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <View style={styles.durationOptions}>
                  {[5, 10, 15, 30, 45, 60].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      onPress={() => setCustomAction({ ...customAction, duration: minutes })}
                      style={[
                        styles.durationOption,
                        customAction.duration === minutes && styles.durationOptionActive
                      ]}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        customAction.duration === minutes && styles.durationOptionTextActive
                      ]}>
                        {minutes}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </>

      <View style={styles.reminderRow}>
        <Bell color={LuxuryTheme.colors.text.secondary} size={20} />
        <Text style={styles.reminderText}>Send reminders</Text>
        <Switch
          value={customAction.reminder}
          onValueChange={(value) => setCustomAction({ ...customAction, reminder: value })}
          trackColor={{ 
            false: 'rgba(255,255,255,0.1)', 
            true: LuxuryTheme.colors.primary.gold 
          }}
          thumbColor="#fff"
        />
      </View>
      
      <HapticButton
        hapticType="medium"
        onPress={handleCreateCustom}
        style={[styles.createButton, !customAction.title && styles.createButtonDisabled]}
        disabled={!customAction.title}
      >
        <LinearGradient
          colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.createButtonText}>Add to Schedule</Text>
      </HapticButton>
    </Animated.View>
  );

  const renderCustomForm = () => (
    <Animated.View
      entering={FadeInDown.springify()}
      style={styles.customForm}
    >
      <View style={styles.customFormHeader}>
        <Text style={styles.customFormTitle}>
          {editingTemplate ? 'Customize Action' : 'Create Custom Action'}
        </Text>
        <HapticButton
          hapticType="light"
          onPress={() => {
            setShowCustomForm(false);
            setEditingTemplate(null);
          }}
          style={styles.closeButton}
        >
          <X color={LuxuryTheme.colors.text.tertiary} size={20} />
        </HapticButton>
      </View>
      
      <TextInput
        style={[styles.customInput, editingTemplate && styles.customInputPreFilled]}
        placeholder="Action title..."
        placeholderTextColor={LuxuryTheme.colors.text.muted}
        value={customAction.title}
        onChangeText={(text) => setCustomAction({ ...customAction, title: text })}
        editable={!editingTemplate}
      />

      <View style={styles.actionTypeRow}>
        <Text style={styles.inputLabel}>Action Type</Text>
        <View style={styles.actionTypeOptions}>
          <TouchableOpacity
            onPress={() => setCustomAction({ ...customAction, isAbstinence: false })}
            style={[
              styles.actionTypeOption,
              !customAction.isAbstinence && styles.actionTypeOptionActive
            ]}
          >
            <Text style={[
              styles.actionTypeOptionText,
              !customAction.isAbstinence && styles.actionTypeOptionTextActive
            ]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCustomAction({ ...customAction, isAbstinence: true })}
            style={[
              styles.actionTypeOption,
              customAction.isAbstinence && styles.actionTypeOptionActive
            ]}
          >
            <Text style={[
              styles.actionTypeOptionText,
              customAction.isAbstinence && styles.actionTypeOptionTextActive
            ]}>
              Abstinence
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.actionTypeHint}>
          {customAction.isAbstinence
            ? 'Avoid something (e.g., No Social Media, No Alcohol)'
            : 'Do something (e.g., Meditate, Workout, Read)'}
        </Text>
      </View>

      {activeTab === 'commitment' && (
        <>
          <View style={styles.frequencyRow}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.frequencyOptions}>
              {['daily', 'weekly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setCustomAction({ ...customAction, frequency: freq as any })}
                  style={[
                    styles.frequencyOption,
                    customAction.frequency === freq && styles.frequencyOptionActive
                  ]}
                >
                  <Text style={[
                    styles.frequencyOptionText,
                    customAction.frequency === freq && styles.frequencyOptionTextActive
                  ]}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {customAction.frequency === 'weekly' && (
            <>
              <View style={styles.daysRow}>
                <Text style={styles.inputLabel}>Which days?</Text>
                <View style={styles.weekDaysOptions}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        const newDays = selectedDays.includes(index)
                          ? selectedDays.filter(d => d !== index)
                          : [...selectedDays, index];
                        setSelectedDays(newDays);
                        setCustomAction({ 
                          ...customAction, 
                          specificDays: newDays,
                          daysPerWeek: newDays.length 
                        });
                      }}
                      style={[
                        styles.weekDayOption,
                        selectedDays.includes(index) && styles.weekDayOptionActive
                      ]}
                    >
                      <Text style={[
                        styles.weekDayOptionText,
                        selectedDays.includes(index) && styles.weekDayOptionTextActive
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Time picker for commitments */}
          {!customAction.isAbstinence && (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.inputLabel}>Time of day</Text>
                <TimePickerInput
                  value={customAction.timeOfDay || '09:00'}
                  onChange={(time) => setCustomAction({ ...customAction, timeOfDay: time })}
                />
              </View>

              {/* Duration input */}
              <View style={styles.durationRow}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <View style={styles.durationOptions}>
                  {[5, 10, 15, 30, 45, 60].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      onPress={() => setCustomAction({ ...customAction, duration: minutes })}
                      style={[
                        styles.durationOption,
                        customAction.duration === minutes && styles.durationOptionActive
                      ]}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        customAction.duration === minutes && styles.durationOptionTextActive
                      ]}>
                        {minutes}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </>
      )}
      
      {activeTab === 'one-time' && (
        <>
          {/* Date picker for one-time actions */}
          <View style={styles.dateRow}>
            <Text style={styles.inputLabel}>Due date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Calendar color={LuxuryTheme.colors.text.secondary} size={18} />
              <Text style={styles.dateButtonText}>
                {customAction.dueDate?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Time picker for one-time actions */}
          <View style={styles.timeRow}>
            <Text style={styles.inputLabel}>Time</Text>
            <TimePickerInput
              value={customAction.timeOfDay || '09:00'}
              onChange={(time) => setCustomAction({ ...customAction, timeOfDay: time })}
            />
          </View>
        </>
      )}
      
      <View style={styles.reminderRow}>
        <Bell color={LuxuryTheme.colors.text.secondary} size={20} />
        <Text style={styles.reminderText}>Send reminders</Text>
        <Switch
          value={customAction.reminder}
          onValueChange={(value) => setCustomAction({ ...customAction, reminder: value })}
          trackColor={{ 
            false: 'rgba(255,255,255,0.1)', 
            true: LuxuryTheme.colors.primary.gold 
          }}
          thumbColor="#fff"
        />
      </View>
      
      <HapticButton
        hapticType="medium"
        onPress={handleCreateCustom}
        style={[styles.createButton, !customAction.title && styles.createButtonDisabled]}
        disabled={!customAction.title}
      >
        <LinearGradient
          colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.createButtonText}>
          {editingTemplate ? 'Add to Schedule' : 'Add Action'}
        </Text>
      </HapticButton>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
      
      <View style={styles.header}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={styles.screenTitle}>Build Your System</Text>
          <Text style={styles.screenSubtitle}>
            Choose actions that will drive your success
          </Text>
        </Animated.View>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>SUGGESTED ACTIONS</Text>
          {(isRoutine ? ROUTINE_ACTION_TEMPLATES : GOAL_ACTION_TEMPLATES).map((template, index) => 
            renderTemplate(template, index)
          )}
          
          {!showCustomForm && (
            <HapticButton
              hapticType="light"
              onPress={() => setShowCustomForm(true)}
              style={styles.customActionButton}
            >
              <Plus color={LuxuryTheme.colors.text.secondary} size={20} />
              <Text style={styles.customActionButtonText}>Create Custom</Text>
            </HapticButton>
          )}
          
          {showCustomForm && renderCustomForm()}
        </View>
        
        {actions.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>YOUR ACTIONS ({actions.length})</Text>
            {actions.map(renderSelectedAction)}
          </View>
        )}
      </ScrollView>
      
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
          onPress={() => onSubmit(actions)}
          style={[styles.continueButton, actions.length === 0 && styles.continueButtonDisabled]}
          disabled={actions.length === 0}
        >
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.continueButtonText}>
            Continue {actions.length > 0 && `(${actions.length})`}
          </Text>
        </HapticButton>
      </View>
      
      {/* Time picker now handled inline by TimePickerInput component */}
      
      {/* Global Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={customAction.dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS for "Done" button
            if (event.type === 'set' && selectedDate) {
              setCustomAction({ ...customAction, dueDate: selectedDate });
            }
            if (event.type === 'dismissed' || event.type === 'set') {
              setShowDatePicker(false);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  templatesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 10,
    color: LuxuryTheme.colors.text.tertiary,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    marginBottom: 12,
  },
  templateCardAdded: {
    backgroundColor: 'rgba(231, 180, 58, 0.05)',
    borderColor: 'rgba(231, 180, 58, 0.2)',
  },
  templateCardExpanded: {
    borderColor: LuxuryTheme.colors.primary.gold,
    backgroundColor: 'rgba(231, 180, 58, 0.03)',
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 2,
  },
  templateTitleAdded: {
    color: LuxuryTheme.colors.primary.gold,
  },
  templateMeta: {
    fontSize: 13,
    color: LuxuryTheme.colors.text.tertiary,
  },
  customActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  customActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  inlineForm: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 16,
    marginTop: -8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.2)',
  },
  customForm: {
    backgroundColor: LuxuryTheme.colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.primary.gold + '30',
  },
  customFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  customFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  customInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    marginBottom: 20,
  },
  customInputPreFilled: {
    backgroundColor: 'rgba(231, 180, 58, 0.05)',
    borderColor: 'rgba(231, 180, 58, 0.2)',
    color: LuxuryTheme.colors.primary.gold,
  },
  inputLabel: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  actionTypeRow: {
    marginBottom: 20,
  },
  actionTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    alignItems: 'center',
  },
  actionTypeOptionActive: {
    backgroundColor: 'rgba(231, 180, 58, 0.1)',
    borderColor: LuxuryTheme.colors.primary.gold,
  },
  actionTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  actionTypeOptionTextActive: {
    color: LuxuryTheme.colors.primary.gold,
  },
  actionTypeHint: {
    fontSize: 11,
    color: LuxuryTheme.colors.text.muted,
    marginTop: 8,
    lineHeight: 16,
  },
  frequencyRow: {
    marginBottom: 20,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    alignItems: 'center',
  },
  frequencyOptionActive: {
    backgroundColor: 'rgba(231, 180, 58, 0.1)',
    borderColor: LuxuryTheme.colors.primary.gold,
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  frequencyOptionTextActive: {
    color: LuxuryTheme.colors.primary.gold,
  },
  daysRow: {
    marginBottom: 20,
  },
  weekDaysOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  weekDayOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayOptionActive: {
    backgroundColor: 'rgba(231, 180, 58, 0.15)',
    borderColor: LuxuryTheme.colors.primary.gold,
  },
  weekDayOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  weekDayOptionTextActive: {
    color: LuxuryTheme.colors.primary.gold,
  },
  timeRow: {
    marginBottom: 20,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    gap: 12,
    marginTop: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    fontWeight: '500',
  },
  timeInput: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  dateRow: {
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    gap: 12,
    marginTop: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    fontWeight: '500',
  },
  durationRow: {
    marginBottom: 20,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  durationOptionActive: {
    backgroundColor: 'rgba(231, 180, 58, 0.1)',
    borderColor: LuxuryTheme.colors.primary.gold,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  durationOptionTextActive: {
    color: LuxuryTheme.colors.primary.gold,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  reminderText: {
    flex: 1,
    fontSize: 15,
    color: LuxuryTheme.colors.text.secondary,
  },
  createButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  selectedSection: {
    marginTop: 32,
  },
  selectedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(231, 180, 58, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.15)',
    marginBottom: 8,
  },
  selectedActionContent: {
    flex: 1,
  },
  selectedActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
  },
  selectedActionMeta: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    marginTop: 2,
  },
  selectedActionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
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