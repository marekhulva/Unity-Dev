import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Clock, Bell, X, Check } from 'lucide-react-native';
import { TimePickerInput } from '../../components/TimePickerInput';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { Action } from './types';

const { width, height } = Dimensions.get('window');

interface Props {
  actions: Action[];
  onSubmit: (updatedActions: Action[]) => void;
  onBack: () => void;
  programName?: string;
}

export const TimeSelectionScreen: React.FC<Props> = ({ 
  actions,
  onSubmit,
  onBack,
  programName = '75 HARD'
}) => {
  // Filter to only show activities that require time selection
  const timeRequiredActions = actions.filter(a => a.requiresTime === true);
  const [updatedActions, setUpdatedActions] = useState<Action[]>(actions);

  // If no activities require time, immediately proceed
  React.useEffect(() => {
    if (timeRequiredActions.length === 0) {
      onSubmit(actions);
    }
  }, []);

  const handleTimeChange = (actionIndex: number, timeString: string) => {
    const newActions = [...updatedActions];
    newActions[actionIndex] = {
      ...newActions[actionIndex],
      timeOfDay: timeString,
    };
    setUpdatedActions(newActions);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString || timeString === 'anytime') return 'Set time';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };


  // If no activities require time, show loading/empty state
  if (timeRequiredActions.length === 0) {
    return null; // Will auto-proceed via useEffect
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          entering={FadeIn.duration(600)}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#DC2626', '#991B1B']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Bell color="#FFF" size={36} />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>Set Your Schedule</Text>
          <Text style={styles.subtitle}>
            Choose when you want to be reminded for each task
          </Text>
        </Animated.View>
        
        <View style={styles.actionsContainer}>
          {timeRequiredActions.map((action, index) => {
            // Find the actual index in the full actions array
            const actualIndex = updatedActions.findIndex(a => a.id === action.id);
            return (
            <Animated.View
              key={action.id}
              entering={SlideInDown.delay(100 * index).springify()}
              style={styles.actionCard}
            >
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient
                colors={['rgba(220,38,38,0.1)', 'rgba(220,38,38,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.actionContent}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    {action.description && (
                      <Text style={styles.actionDescription}>{action.description}</Text>
                    )}
                  </View>
                </View>
                
                <View style={{ marginLeft: 12 }}>
                  <TimePickerInput
                    value={updatedActions[actualIndex].timeOfDay || '09:00'}
                    onChange={(time) => handleTimeChange(actualIndex, time)}
                  />
                </View>
              </View>
            </Animated.View>
            );
          })}
        </View>
        
        <Animated.View 
          entering={FadeIn.delay(800).duration(600)}
          style={styles.infoCard}
        >
          <Text style={styles.infoTitle}>💡 Pro Tip</Text>
          <Text style={styles.infoText}>
            Space your workouts at least 3 hours apart. The outdoor workout is best done when weather is favorable.
          </Text>
        </Animated.View>
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
          onPress={() => onSubmit(updatedActions)}
          style={styles.continueButton}
        >
          <LinearGradient
            colors={['#DC2626', '#991B1B']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.continueButtonText}>Continue</Text>
        </HapticButton>
      </View>
      
      {/* Time picker now handled inline by TimePickerInput component */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  actionContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    lineHeight: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: LuxuryTheme.colors.text.secondary,
  },
  infoCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  continueButton: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  // Time Picker Modal Styles
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerOverlay: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: LuxuryTheme.colors.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for safe area
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LuxuryTheme.colors.interactive.border,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
  },
  picker: {
    height: 216,
    backgroundColor: LuxuryTheme.colors.background.secondary,
  },
});