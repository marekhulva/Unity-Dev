import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { Clock, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { height, width } = Dimensions.get('window');

interface Activity {
  id: string;
  title: string;
  icon: string;
  isNew?: boolean;
  linkedActionId?: string;
  existingTime?: string;
}

interface TimeSetupModalProps {
  visible: boolean;
  activities: Activity[];
  onComplete: (times: Record<string, string>) => void;
  onBack: () => void;
}

export const TimeSetupModal: React.FC<TimeSetupModalProps> = ({
  visible,
  activities,
  onComplete,
  onBack,
}) => {
  if (__DEV__) console.log('🔴 [TIME FLOW] Step 3: TimeSetupModal rendered, visible:', visible);
  
  // Filter to only show NEW activities (not linked to existing)
  const newActivities = activities.filter(a => !a.linkedActionId);
  
  // Use ALL activities for time setup, not just new ones
  const activitiesToSetup = activities; // Show times for ALL selected activities
  
  // Initialize times with default values
  const [activityTimes, setActivityTimes] = useState<Record<string, Date>>({});

  // Initialize default times when activities change
  React.useEffect(() => {
    if (activities && activities.length > 0) {
      if (__DEV__) console.log('🔴🔴🔴 [TIME SETUP] Initializing default times for', activities.length, 'activities');
      const defaultTimes: Record<string, Date> = {};
      activities.forEach(activity => {
        const defaultTime = new Date();
        defaultTime.setHours(9, 0, 0, 0); // Default to 9:00 AM
        defaultTimes[activity.id] = defaultTime;
      });
      setActivityTimes(defaultTimes);
    }
  }, [activities]);

  const [showPicker, setShowPicker] = useState<string | null>(null);

  const handleTimeChange = (activityId: string, selectedTime: Date | undefined) => {
    if (selectedTime) {
      setActivityTimes(prev => ({
        ...prev,
        [activityId]: selectedTime
      }));
    }
    setShowPicker(null);
  };

  const formatTime = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      // Return a default time if date is undefined or invalid
      return '9:00 AM';
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleComplete = () => {
    if (__DEV__) console.log('🔴🔴🔴 [CONTINUE] BUTTON CLICKED');
    if (__DEV__) console.log('🔴🔴🔴 [CONTINUE] All activities:', activitiesToSetup);
    if (__DEV__) console.log('🔴🔴🔴 [CONTINUE] Activity times state:', activityTimes);
    
    // Convert Date objects to string format for NEW activities only
    const timeStrings: Record<string, string> = {};
    
    // Only include times for NEW activities (not linked to existing)
    const newActivities = activitiesToSetup.filter(a => !a.linkedActionId);
    if (__DEV__) console.log('🔴🔴🔴 [CONTINUE] New activities after filter:', newActivities);
    
    newActivities.forEach(activity => {
      const date = activityTimes[activity.id];
      if (__DEV__) console.log(`🔴🔴🔴 [CONTINUE] Activity ${activity.id}: date =`, date);
      if (date) {
        const formattedTime = formatTime(date);
        timeStrings[activity.id] = formattedTime;
        if (__DEV__) console.log(`🔴🔴🔴 [CONTINUE] Added time for ${activity.id}: ${formattedTime}`);
      } else {
        if (__DEV__) console.log(`🔴🔴🔴 [CONTINUE] NO DATE for ${activity.id}`);
      }
    });
    
    if (__DEV__) console.log('🔴🔴🔴 [CONTINUE] FINAL timeStrings to save:', timeStrings);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(timeStrings);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  // Check if there are any NEW activities that need time setup
  const needsTimeSetup = activitiesToSetup.filter(a => !a.linkedActionId).length > 0;
  
  React.useEffect(() => {
    if (visible && !needsTimeSetup) {
      // All activities are linked to existing habits, skip time setup
      if (__DEV__) console.log('🔴 [TIME FLOW] Step 4: All activities linked, skipping time setup');
      // Delay to ensure smooth transition
      const timer = setTimeout(() => {
        if (__DEV__) console.log('🔴 [TIME FLOW] Calling onComplete with empty times for all-linked activities');
        onComplete({});
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visible, needsTimeSetup, onComplete]);
  
  if (!visible) return null;
  
  if (!needsTimeSetup) {
    // Return null but useEffect will handle the completion
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <Animated.View 
        entering={FadeIn}
        style={styles.container}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
        
        <Animated.View 
          entering={SlideInDown.springify()}
          style={styles.modal}
        >
          <LinearGradient
            colors={['rgba(20,20,20,0.98)', 'rgba(10,10,10,0.98)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <X size={24} color="#999" />
            </Pressable>
            <View style={styles.titleContainer}>
              <Clock size={24} color="#FFD700" />
              <Text style={styles.title}>Set Activity Times</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Description */}
          <Text style={styles.description}>
            When would you like to do these new activities?
          </Text>

          {/* Activities List */}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.activitiesContainer}>
              {/* Show linked activities as info */}
              {activities.filter(a => a.linkedActionId).map(activity => (
                <View key={activity.id} style={styles.linkedActivity}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <View>
                      <Text style={styles.linkedActivityTitle}>{activity.title}</Text>
                      <Text style={styles.linkedActivitySubtitle}>
                        Using existing time
                      </Text>
                    </View>
                  </View>
                  <Check size={20} color="#4CAF50" />
                </View>
              ))}

              {/* New activities need time setup */}
              {activitiesToSetup.filter(a => !a.linkedActionId).map((activity, index) => (
                <Animated.View
                  key={activity.id}
                  entering={FadeIn.delay(index * 50)}
                  style={styles.activityCard}
                >
                  <LinearGradient
                    colors={['rgba(255,215,0,0.05)', 'rgba(255,215,0,0.02)']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  
                  <View style={styles.activityRow}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityIcon}>{activity.icon}</Text>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                    </View>
                    
                    <Pressable
                      style={styles.timeButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPicker(activity.id);
                      }}
                    >
                      <LinearGradient
                        colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                      <Clock size={16} color="#FFD700" />
                      <Text style={styles.timeText}>
                        {formatTime(activityTimes[activity.id])}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Time Picker for this activity */}
                  {showPicker === activity.id && (
                    <View style={styles.pickerContainer}>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeSelectorLabel}>Set Time:</Text>
                        <View style={styles.timeInputRow}>
                          {/* Hour input */}
                          <input
                            type="time"
                            value={(() => {
                              const time = activityTimes[activity.id];
                              if (!time || !(time instanceof Date) || isNaN(time.getTime())) {
                                return '09:00'; // Default if undefined or invalid
                              }
                              try {
                                const hours = time.getHours();
                                const minutes = time.getMinutes();
                                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                              } catch {
                                return '09:00'; // Fallback on any error
                              }
                            })()}
                            onChange={(e) => {
                              if (__DEV__) console.log('🔴🔴🔴 [TIME INPUT] Time changed:', e.target.value, 'for activity:', activity.id);
                              const [hours, minutes] = e.target.value.split(':');
                              const newTime = new Date();
                              newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              handleTimeChange(activity.id, newTime);
                              if (__DEV__) console.log('🔴🔴🔴 [TIME INPUT] New time set:', newTime);
                            }}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: '#FFD700',
                              border: '1px solid rgba(255,215,0,0.3)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '16px',
                              fontWeight: '600',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          />
                          <Text style={styles.currentTimeText}>
                            Selected: {formatTime(activityTimes[activity.id])}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </Animated.View>
              ))}
            </View>
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.footer}>
            <Pressable style={styles.continueButton} onPress={handleComplete}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: width * 0.9,
    maxWidth: 400,
    height: height * 0.7,
    maxHeight: 600,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  activitiesContainer: {
    padding: 20,
    gap: 12,
  },
  linkedActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.2)',
    marginBottom: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkedActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkedActivitySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  activityCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  pickerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  picker: {
    height: 150,
  },
  timeInputContainer: {
    gap: 12,
  },
  timeSelectorLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currentTimeText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});