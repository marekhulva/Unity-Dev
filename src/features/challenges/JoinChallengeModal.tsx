/*
 * FIXED: Priority 2 Issue #19 - Removed setTimeout hacks
 *
 * Changes made (2026-02-10):
 * - Removed arbitrary setTimeout(resolve, 500) after creating participant record
 * - Removed arbitrary setTimeout(resolve, 500) after updating links
 * - Removed arbitrary setTimeout(resolve, 1000) before refreshing actions
 * - Added proper database confirmation with waitForParticipant() method
 * - Added verifyDataCommitted() to confirm updates were saved
 * - Proper async/await patterns for all database operations
 * - Better error handling for slow networks
 *
 * Database operations now:
 * 1. Wait for actual participant record creation with polling
 * 2. Update links and verify the update completed
 * 3. Update times and verify the update completed
 * 4. Create actions and wait for each insert to complete
 * 5. Refresh data only after all operations confirmed
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { X, CheckCircle, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { supabase } from '../../services/supabase.service';
import { useStore } from '../../state/rootStore';
import { ActivityLinkingModal } from './ActivityLinkingModal';
import { TimeSetupModal } from './TimeSetupModal';

const { width, height } = Dimensions.get('window');

// Helper function to convert 12-hour time to 24-hour format
const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12);
  }

  return `${hours.padStart(2, '0')}:${minutes}:00`;
};

interface JoinChallengeModalProps {
  visible: boolean;
  challenge: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface Activity {
  id: string;
  title: string;
  icon: string;
  description?: string;
  canonical_name?: string;
}

export const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  visible,
  challenge,
  onClose,
  onSuccess,
}) => {
  if (__DEV__) console.log('🔴🔴🔴 [JOIN MODAL] Component rendered, visible:', visible, 'challenge:', challenge?.name);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [showTimeSetupModal, setShowTimeSetupModal] = useState(false);
  const [selectedForLinking, setSelectedForLinking] = useState<Activity[]>([]);
  const [activityLinks, setActivityLinks] = useState<Record<string, string>>({});
  const { joinChallenge, fetchDailyActions, actions } = useStore();

  useEffect(() => {
    if (__DEV__) console.log('🎯 [JOIN MODAL] Challenge data:', challenge);
    if (__DEV__) console.log('🎯 [JOIN MODAL] Activities in challenge:', challenge?.challenge_activities);
    if (challenge?.challenge_activities) {
      setActivities(challenge.challenge_activities);
      if (__DEV__) console.log('🎯 [JOIN MODAL] Set activities:', challenge.challenge_activities.length);
    } else {
      if (__DEV__) console.log('⚠️ [JOIN MODAL] No activities in challenge object');
    }
  }, [challenge]);

  const toggleActivity = (activityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      if (newSelected.size < challenge.max_activities) {
        newSelected.add(activityId);
      } else {
        Alert.alert(
          'Maximum Reached',
          `You can select up to ${challenge.max_activities} activities`,
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setSelectedActivities(newSelected);
  };

  const handleJoin = async () => {
    if (selectedActivities.size < challenge.min_activities) {
      Alert.alert(
        'Select More Activities',
        `Please select at least ${challenge.min_activities} activities to join`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (__DEV__) console.log('🔴 [TIME FLOW] Step 1: Join button clicked, showing linking modal');
    // Show linking modal
    const selectedIds = Array.from(selectedActivities);
    const selectedActivityObjects = activities.filter(a => selectedIds.includes(a.id));
    setSelectedForLinking(selectedActivityObjects);
    setShowLinkingModal(true);
  };

  const handleLinkingComplete = async (links: Record<string, string>) => {
    if (__DEV__) console.log('🔴 [TIME FLOW] Step 2: After linking modal, showing time setup');
    setShowLinkingModal(false);
    setActivityLinks(links);
    
    // Make sure we have activities to work with
    const activitiesToUse = selectedForLinking && selectedForLinking.length > 0 
      ? selectedForLinking 
      : activities.filter(a => Array.from(selectedActivities).includes(a.id));
    
    // Prepare activities with link information for time setup
    const activitiesWithLinks = activitiesToUse.map(activity => ({
      ...activity,
      linkedActionId: links[activity.id],
      isNew: !links[activity.id]
    }));
    
    setSelectedForLinking(activitiesWithLinks);
    setShowTimeSetupModal(true);
  };
  
  const handleTimeSetupComplete = async (times: Record<string, string>) => {
    if (__DEV__) console.log('🔴 [TIME FLOW] Step 5: Joining challenge with', Object.keys(times).length, 'new times');
    setShowTimeSetupModal(false);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const selectedIds = Array.from(selectedActivities);

      // Step 1: Join the challenge (creates participant record)
      if (__DEV__) console.log('🔴🔴🔴 [SAVING] About to join challenge');
      const result = await joinChallenge(challenge.id, selectedIds);
      if (__DEV__) console.log('🔴🔴🔴 [SAVING] Join result:', result);

      if (!result) {
        if (__DEV__) console.log('🔴🔴🔴 [SAVING] Join failed, no result');
        throw new Error('Failed to join challenge - no result returned');
      }

      // Step 2: Wait for participant record to be available (with polling)
      if (__DEV__) console.log('🔴🔴🔴 [SAVING] Waiting for participant record...');
      const participant = await supabaseChallengeService.waitForParticipant(challenge.id, 10, 200);

      if (!participant) {
        if (__DEV__) console.log('🔴🔴🔴 [SAVING] NO PARTICIPANT FOUND after waiting!');
        throw new Error('Failed to create participant record');
      }

      if (__DEV__) console.log('🔴🔴🔴 [SAVING] Participant found:', participant.id);

      // Step 3: Update links if any
      if (Object.keys(activityLinks).length > 0) {
        if (__DEV__) console.log('🔴🔴🔴 [SAVING] Saving links...');
        const linkResult = await supabaseChallengeService.updateParticipantLinks(participant.id, activityLinks);

        if (!linkResult.success) {
          throw new Error('Failed to save activity links: ' + linkResult.error);
        }

        if (__DEV__) console.log('🔴🔴🔴 [SAVING] Links saved successfully');
      }

      // Step 4: Prepare times for ALL activities (linked and new)
      const allActivityTimes: Record<string, string> = { ...times };

      // For linked activities, get times from their existing actions
      if (Object.keys(activityLinks).length > 0) {
        if (__DEV__) console.log('🔴🔴🔴 [SAVING] Getting times for linked activities...');
        const existingActions = actions.filter(a => !a.isFromChallenge);

        Object.entries(activityLinks).forEach(([activityId, actionId]) => {
          const linkedAction = existingActions.find(a => a.id === actionId);
          if (linkedAction && linkedAction.time) {
            allActivityTimes[activityId] = linkedAction.time;
            if (__DEV__) console.log(`🔴🔴🔴 [SAVING] Linked activity ${activityId} will use time: ${linkedAction.time}`);
          } else {
            // Default time if the linked action doesn't have one
            allActivityTimes[activityId] = '9:00 AM';
            if (__DEV__) console.log(`🔴🔴🔴 [SAVING] Linked activity ${activityId} using default time: 9:00 AM`);
          }
        });
      }

      // Step 5: Store times for ALL activities (both new and linked)
      if (__DEV__) console.log('🔴🔴🔴 [SAVING] All activity times:', allActivityTimes);
      if (__DEV__) console.log('🔴🔴🔴 [SAVING] Total times to save:', Object.keys(allActivityTimes).length);

      if (Object.keys(allActivityTimes).length > 0) {
        if (__DEV__) console.log('🔴🔴🔴 [SAVING] Updating participant activity times...');
        const timesResult = await supabaseChallengeService.updateParticipantActivityTimes(participant.id, allActivityTimes);

        if (!timesResult.success) {
          throw new Error('Failed to save activity times: ' + timesResult.error);
        }

        if (__DEV__) console.log('🔴🔴🔴 [SAVING] All times saved!');
      } else {
        if (__DEV__) console.log('🔴🔴🔴 [SAVING] WARNING: No times to save at all!');
      }

      // Step 6: Verify data was committed
      const expectedLinks = Object.values(activityLinks);
      const expectedTimesCount = Object.keys(allActivityTimes).length;
      const dataCommitted = await supabaseChallengeService.verifyDataCommitted(
        participant.id,
        expectedLinks,
        expectedTimesCount
      );

      if (!dataCommitted) {
        if (__DEV__) console.error('🔴🔴🔴 [SAVING] Data verification failed!');
        throw new Error('Failed to verify data was saved correctly');
      }

      if (__DEV__) console.log('🟢 [SAVING] Data verified successfully');

      // Step 7: Create actions for unlinked challenge activities
      const unlinkedActivities = selectedForLinking.filter(a => !activityLinks[a.id]);
      if (unlinkedActivities.length > 0) {
        if (__DEV__) console.log('🔴🔴🔴 [CREATING ACTIONS] Creating actions for', unlinkedActivities.length, 'unlinked activities');

        const actionCreationPromises = unlinkedActivities.map(async (activity) => {
          const time = times[activity.id] || allActivityTimes[activity.id] || '9:00 AM';

          // Convert 12h to 24h format
          const time24h = time.includes('AM') || time.includes('PM')
            ? convertTo24Hour(time)
            : time;

          if (__DEV__) console.log(`🔴🔴🔴 [CREATING ACTIONS] Creating action for "${activity.title}" at ${time24h}`);

          try {
            const { data: newAction, error: actionError } = await supabase
              .from('actions')
              .insert({
                title: activity.title,
                time: time24h,
                frequency: 'daily',
                challenge_ids: [challenge.id],
                user_id: participant.user_id,
                date: new Date().toISOString().split('T')[0],
                completed: false,
                visibility: 'public'
              })
              .select()
              .single();

            if (actionError) {
              if (__DEV__) console.error(`🔴🔴🔴 [CREATING ACTIONS] Error creating action for ${activity.title}:`, actionError);
              throw actionError;
            } else {
              if (__DEV__) console.log(`🟢 [CREATING ACTIONS] Created action for ${activity.title}:`, newAction.id);
              return newAction;
            }
          } catch (err) {
            if (__DEV__) console.error(`🔴🔴🔴 [CREATING ACTIONS] Exception creating action for ${activity.title}:`, err);
            throw err;
          }
        });

        // Wait for all actions to be created
        await Promise.all(actionCreationPromises);
        if (__DEV__) console.log('🟢 [CREATING ACTIONS] All actions created successfully');
      }

      // Step 8: Refresh daily actions to show the new challenge activities
      if (__DEV__) console.log('🔄 [JOIN MODAL] Refreshing daily actions...');
      await fetchDailyActions();
      if (__DEV__) console.log('🟢 [JOIN MODAL] Daily actions refreshed');

      // Step 9: Call onSuccess which will refresh the challenges list
      if (__DEV__) console.log('🔄 [JOIN MODAL] Calling onSuccess to refresh challenges...');
      await onSuccess();
      if (__DEV__) console.log('🟢 [JOIN MODAL] Challenges refreshed');

      onClose();
    } catch (error) {
      if (__DEV__) console.error('🔴 Error joining challenge:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to join challenge. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeSetupBack = () => {
    setShowTimeSetupModal(false);
    setShowLinkingModal(true);
  };

  const handleLinkingSkip = async () => {
    await handleLinkingComplete({});
  };

  if (!visible && !showLinkingModal && !showTimeSetupModal) return null;

  return (
    <>
      <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={StyleSheet.absoluteFillObject}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject}>
          <View style={styles.backdrop} />
        </BlurView>
        
        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.container}
        >
          <View style={styles.modal}>
            <LinearGradient
              colors={['rgba(255,215,0,0.05)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Join {challenge?.title || challenge?.name || 'Challenge'}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            
            {/* Info */}
            <View style={styles.infoBox}>
              <Info size={16} color="#FFD700" />
              <Text style={styles.infoText}>
                Select {challenge?.min_activities}-{challenge?.max_activities} activities to track.
                Complete any {challenge?.required_daily} daily for 100% consistency.
              </Text>
            </View>
            
            {/* Activities */}
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isSelected={selectedActivities.has(activity.id)}
                  onToggle={() => toggleActivity(activity.id)}
                />
              ))}
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.selectionCount}>
                {selectedActivities.size}/{challenge?.min_activities}-{challenge?.max_activities} selected
              </Text>
              
              <Pressable
                style={[
                  styles.joinButton,
                  selectedActivities.size < challenge?.min_activities && styles.joinButtonDisabled
                ]}
                onPress={handleJoin}
                disabled={isLoading || selectedActivities.size < challenge?.min_activities}
              >
                <LinearGradient
                  colors={
                    selectedActivities.size >= challenge?.min_activities
                      ? ['#FFD700', '#FFA500']
                      : ['rgba(255,215,0,0.2)', 'rgba(255,165,0,0.1)']
                  }
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.joinButtonText}>
                  {isLoading ? 'Joining...' : 'Join Challenge'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>

      <ActivityLinkingModal
        visible={showLinkingModal}
        challengeActivities={selectedForLinking}
        onComplete={handleLinkingComplete}
        onSkip={handleLinkingSkip}
      />
      
      <TimeSetupModal
        visible={showTimeSetupModal}
        activities={selectedForLinking}
        onComplete={handleTimeSetupComplete}
        onBack={handleTimeSetupBack}
      />
    </>
  );
};

interface ActivityItemProps {
  activity: Activity;
  isSelected: boolean;
  onToggle: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isSelected, onToggle }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.activityItem, isSelected && styles.activityItemSelected]}
        onPress={handlePress}
      >
        <View style={styles.activityLeft}>
          <Text style={styles.activityIcon}>{activity.icon}</Text>
          <View>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            {activity.description && (
              <Text style={styles.activityDescription}>{activity.description}</Text>
            )}
          </View>
        </View>
        
        {isSelected && (
          <CheckCircle size={24} color="#FFD700" />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.8,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activityItemSelected: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 20,
  },
  selectionCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 12,
  },
  joinButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
  },
});