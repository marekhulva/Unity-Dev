/**
 * ISSUE #11 FIX: Weekly progress chart now updates after action completion
 * - Created refreshWeeklyProgress() function to fetch weekly stats
 * - Added calls to refreshWeeklyProgress() after successful completions in:
 *   - handlePrivacySelect (regular actions)
 *   - handleAbstinenceComplete (abstinence actions)
 * - Weekly progress updates immediately after completing any action
 * Date: 2026-02-10
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UnityHeader } from '../../components/UnityHeader';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStore } from '../../state/rootStore';
import { PrivacySelectionModal } from './PrivacySelectionModal';
import { AbstinenceModal } from './AbstinenceModal';
import { SocialSharePrompt } from '../social/SocialSharePrompt';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { Target, Dumbbell, Brain, BookOpen, Edit3, Trash2 } from 'lucide-react-native';
import { HapticManager } from '../../utils/haptics';
import ChallengeDebugV2 from '../../utils/challengeDebugV2';
import { supabaseService, supabase } from '../../services/supabase.service';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { featureFlags } from '../../services/featureFlags.service';
import { backendService } from '../../services/backend.service';
import { parseLocalDateString } from '../../utils/dateUtils';
import { FeedSkeleton } from '../../components/SkeletonLoader';
import { rescheduleAll } from '../../services/notification.local';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { DailyProgressRing } from './components/DailyProgressRing';
import { SectionDivider } from './components/SectionDivider';
import { SectionHeader } from './components/SectionHeader';
import { CommitmentCard } from './components/CommitmentCard';
import { TimelineCard } from './components/TimelineCard';
import { TimelineDot } from './components/TimelineDot';
import { AddActionButton } from './components/AddActionButton';
import { GoalCard } from './GoalCard';

const getCategoryIcon = (title: string, goalTitle?: string) => {
  const text = `${title} ${goalTitle}`.toLowerCase();
  if (text.includes('workout') || text.includes('exercise') || text.includes('fitness') || text.includes('gym')) {
    return '💪';
  }
  if (text.includes('meditat') || text.includes('mindful') || text.includes('breath')) {
    return '🧘';
  }
  if (text.includes('read') || text.includes('book') || text.includes('study') || text.includes('learn')) {
    return '📖';
  }
  if (text.includes('run') || text.includes('jog')) {
    return '🏃';
  }
  if (text.includes('water') || text.includes('drink') || text.includes('hydrat')) {
    return '💧';
  }
  if (text.includes('wake') || text.includes('morning') || text.includes('sunrise')) {
    return '☀️';
  }
  return '✨';
};

export const DailyScreenOption2 = () => {
  const insets = useSafeAreaInsets();
  const actions = useStore(s => s.actions);
  const goals = useStore(s => s.goals);
  const challenges = useStore(s => s.activeChallenges);
  const actionsLoading = useStore(s => s.actionsLoading);
  const actionsError = useStore(s => s.actionsError);
  const fetchDailyActions = useStore(s => s.fetchDailyActions);
  const openOnboarding = useStore(s => s.openOnboarding);
  const toggleAction = useStore(s => s.toggleAction);
  const addCompletedAction = useStore(s => s.addCompletedAction);
  const addPost = useStore(s => s.addPost);
  const recordCompletion = useStore(s => s.recordCompletion);
  const updateAction = useStore(s => s.updateAction);
  const deleteAction = useStore(s => s.deleteAction);
  const currentUser = useStore(s => s.user);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAbstinenceModal, setShowAbstinenceModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  const [completingActionId, setCompletingActionId] = useState<string | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionToEdit, setActionToEdit] = useState<any>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState({ hours: 9, minutes: 0 });

  const completed = actions.filter(a => a.done && !a.failed).length;
  const progress = actions.length ? Math.round((completed / actions.length) * 100) : 0;

  // TODO: Fix and re-enable streaks - Currently broken (never resets, not persisted to DB)
  // See mvpfix.md Issue #1 for details
  // const currentStreak = useMemo(() => {
  //   const maxStreak = actions.reduce((max, action) => {
  //     return Math.max(max, action.streak || 0);
  //   }, 0);
  //   return maxStreak;
  // }, [actions]);

  // Reusable function to fetch weekly progress
  const refreshWeeklyProgress = async () => {
    if (currentUser?.id) {
      if (__DEV__) console.log('🔄 [DAILY] Refreshing weekly progress...');
      const progress = await supabaseService.getWeeklyCompletionStats(currentUser.id);
      setWeeklyProgress(progress);
      if (__DEV__) console.log('✅ [DAILY] Weekly progress updated:', progress);
    }
  };

  useEffect(() => {
    if (__DEV__) console.log('🟦 [DAILY-OPTION2] DailyScreenOption2 mounted');

    // Force refresh feature flags to get latest Living Progress Card setting
    featureFlags.clearCache();
    if (__DEV__) console.log('🔄 [DAILY-OPTION2] Cleared feature flags cache');

    // Always re-fetch to ensure completions reflect today (not stale from yesterday)
    fetchDailyActions();

    // Fetch weekly progress on mount
    refreshWeeklyProgress();
  }, [currentUser?.id]);

  const { timedActions, abstinenceActions } = useMemo(() => {
    const timed: any[] = [];
    const abstinence: any[] = [];

    actions.forEach(action => {
      if (action.isAbstinence) {
        abstinence.push(action);
      } else {
        timed.push(action);
      }
    });

    timed.sort((a, b) => {
      if (!a.time || !b.time) return 0;
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    return { timedActions: timed, abstinenceActions: abstinence };
  }, [actions]);

  const formatTime24 = (time?: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDateString = () => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `${dayName}, ${monthDay}`;
  };

  const getWeekProgress = () => {
    return weeklyProgress;
  };

  const isActionActive = (action: any): boolean => {
    if (action.done || !action.time) return false;

    const now = new Date();
    const [hours, minutes] = action.time.split(':').map(Number);
    const actionTime = new Date();
    actionTime.setHours(hours, minutes, 0, 0);

    const diffMinutes = (now.getTime() - actionTime.getTime()) / 60000;
    return diffMinutes >= 0 && diffMinutes < 30;
  };

  const activeChallenge = challenges && challenges.length > 0 ? challenges[0] : null;
  const challengeName = activeChallenge?.name;
  const totalDays = activeChallenge?.duration_days || 30;
  const currentDay = (() => {
    const startDate = activeChallenge?.my_participation?.personal_start_date;
    if (!startDate) return activeChallenge?.my_participation?.current_day || 1;
    const startDateLocal = parseLocalDateString(startDate);
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysSinceStart = Math.floor((todayLocal.getTime() - startDateLocal.getTime()) / 86400000) + 1;
    return Math.min(Math.max(daysSinceStart, 1), totalDays);
  })();
  const challengeProgress = activeChallenge ? Math.round((currentDay / totalDays) * 100) : 0;

  const handleTaskToggle = (action: any) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    if (timeSinceLastTap < 500) {
      if (__DEV__) console.log('🚫 [DAILY] Debouncing rapid tap (', timeSinceLastTap, 'ms)');
      return;
    }

    if (completingActionId === action.id) {
      if (__DEV__) console.log('🚫 [DAILY] Already submitting action:', action.id);
      return;
    }

    setLastTapTime(now);

    if (!action.done) {
      setSelectedAction(action);
      if (action.isAbstinence) {
        if (__DEV__) console.log('🎯 [DAILY] Opening abstinence modal for:', action.title);
        setShowAbstinenceModal(true);
      } else {
        if (__DEV__) console.log('🎯 [DAILY] Opening privacy modal for:', action.title);
        setShowPrivacyModal(true);
      }
      HapticManager.interaction.premiumPress();
    } else {
      toggleAction(action.id);
      HapticManager.interaction.tap();
    }
  };

  const handlePrivacySelect = async (
    visibility: 'private' | 'circle' | 'followers',
    contentType: 'photo' | 'audio' | 'text' | 'check',
    content?: string,
    mediaUri?: string,
    newVisibility?: {
      isPrivate: boolean;
      isExplore: boolean;
      isNetwork: boolean;
      circleIds: string[];
    }
  ) => {
    if (__DEV__) console.log('🎯 [DailyScreen] handlePrivacySelect called:', { selectedAction, visibility, contentType });

    if (!selectedAction) return;

    if (completingActionId === selectedAction.id) {
      if (__DEV__) console.log('🚫 [DAILY] Already submitting action:', selectedAction.id);
      return;
    }

    setCompletingActionId(selectedAction.id);

    try {
      ChallengeDebugV2.startNewFlow();
      ChallengeDebugV2.checkpoint('CP1-DAILY-START', 'Selected action in Daily screen', selectedAction);

      HapticManager.context.actionCompleted();
      setShowPrivacyModal(false);
      const actionToComplete = selectedAction;
      setSelectedAction(null);

    // Check if Living Progress Cards feature is enabled
    const useLivingProgressCards = await featureFlags.isEnabled('use_living_progress_cards');
    const user = useStore.getState().user;
    if (__DEV__) console.log('🎯 [DailyScreen] Feature flag check:', { useLivingProgressCards, userId: user?.id, visibility });

    // Handle challenge activity completion first (always needed for challenge tracking)
    if (actionToComplete.isFromChallenge && actionToComplete.challengeActivityId) {
      const isLinkedActivity = actionToComplete.id && !actionToComplete.id.startsWith('challenge-');
      const linkedActionId = isLinkedActivity ? actionToComplete.id : undefined;

      // Fire and forget - don't await
      recordCompletion(
        actionToComplete.challengeParticipantId,
        actionToComplete.challengeActivityId,
        linkedActionId,
        mediaUri
      ).then(success => {
        if (success) {
          fetchDailyActions();
        }
      });
    }

    // Check if this is a CHALLENGE activity
    const isChallenge = actionToComplete.isFromChallenge && actionToComplete.challengeId;

    // LIVING PROGRESS CARD FLOW (only for challenge activities)
    if (useLivingProgressCards && user?.id && visibility !== 'private' && isChallenge) {
      if (__DEV__) console.log('✅ [DailyScreen] ===== USING LIVING PROGRESS CARD FLOW (CHALLENGE) =====');

      // Mark action as complete locally (optimistic update)
      toggleAction(actionToComplete.id);

      // Get participant data for current day/total days
      const participantId = actionToComplete.challengeParticipantId;
      let currentDay, totalDays;

      if (participantId) {
        try {
          // Query participant data
          const { data: participant } = await supabase
            .from('challenge_participants')
            .select('current_day, challenges(duration_days)')
            .eq('id', participantId)
            .single();

          if (participant) {
            currentDay = participant.current_day;
            totalDays = (participant.challenges as any)?.duration_days;
            if (__DEV__) console.log('📊 [DailyScreen] Participant data:', { currentDay, totalDays });
          }
        } catch (error) {
          if (__DEV__) console.error('❌ [DailyScreen] Failed to fetch participant data:', error);
        }
      }

      // Update Living Progress Card in background with challenge metadata
      backendService.findOrCreateDailyProgressPost(
        user.id,
        actionToComplete.challengeId,
        actionToComplete.challengeName,
        { currentDay, totalDays }
      ).then(progressPost => {
        if (progressPost.success && progressPost.data) {
          const totalActions = actions.filter(a => a.challengeId === actionToComplete.challengeId).length;

          backendService.updateDailyProgressPost(
            progressPost.data.id,
            {
              actionId: actionToComplete.id,
              title: actionToComplete.title,
              goalTitle: actionToComplete.goalTitle,
              goalColor: actionToComplete.goalColor,
              completedAt: new Date().toISOString(),
              // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
              streak: 0,
              challengeActivityId: actionToComplete.challengeActivityId,
            },
            totalActions
          ).then(() => {
            if (__DEV__) console.log('✅ [DailyScreen] Updated Living Progress Card for challenge');
            useStore.getState().fetchUnifiedFeed(true);
            if (__DEV__) console.log('🔄 [DailyScreen] Refreshed unified feed');
          }).catch(error => {
            if (__DEV__) console.error('❌ [DailyScreen] Failed to update Living Progress Card:', error);
          });
        }
      });

      // Check if user added photo/comment (media)
      const hasMedia = contentType === 'photo' || contentType === 'text' || !!mediaUri || !!content;
      if (__DEV__) console.log('🔍 [DailyScreen] hasMedia check:', { contentType, hasMediaUri: !!mediaUri, hasContent: !!content, hasMedia });

      if (!hasMedia) {
        // Just a check - Living Progress Card only, no individual post
        if (__DEV__) console.log('📋 [DailyScreen] No media/content, LPC only - skipping individual post');
        return;
      }

      // User added media - fall through to create individual post too (dual posting)
      if (__DEV__) console.log('📸 [DailyScreen] User added media, creating individual post too (dual posting)');
    } else {
      // LEGACY FLOW (for regular actions OR when Living Progress Cards are disabled)
      if (__DEV__) console.log('❌ [DailyScreen] ===== USING LEGACY INDIVIDUAL POST FLOW =====');
      toggleAction(actionToComplete.id);
      fetchDailyActions();
    }

    // Create individual post (legacy flow OR dual posting for challenge with media)
    if (__DEV__) console.log('📝 [DailyScreen] Creating individual post');

    // Legacy post creation (for non-Living Progress Card actions)
    const actionType = contentType === 'text' ? 'milestone' : 'check';
    const finalMediaUrl = mediaUri || undefined;
    const isPrivate = newVisibility ? newVisibility.isPrivate : visibility === 'private';

    addCompletedAction({
      id: `${actionToComplete.id}-${Date.now()}`,
      actionId: actionToComplete.id,
      title: actionToComplete.title,
      goalTitle: actionToComplete.goalTitle,
      completedAt: new Date(),
      isPrivate,
      // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
        streak: 0,
      type: actionType,
      mediaUrl: finalMediaUrl,
      category: actionToComplete.goalTitle || 'general',
    });

    // Post creation happens in background with optimistic updates
    if (!isPrivate) {
      const postData = {
        type: actionType === 'check' ? 'checkin' : 'milestone',
        visibility: visibility,
        content: content || 'Completed',
        actionTitle: actionToComplete.title,
        goal: actionToComplete.goalTitle,
        goalColor: actionToComplete.goalColor,
        // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
        streak: 0,
        photoUri: contentType === 'photo' ? finalMediaUrl : undefined,
        audioUri: contentType === 'audio' ? finalMediaUrl : undefined,
        mediaUrl: finalMediaUrl,
        isChallenge: actionToComplete.isFromChallenge || false,
        challengeName: actionToComplete.challengeName,
        challengeId: actionToComplete.challengeId,
        challengeActivityId: actionToComplete.challengeActivityId,
        ...(newVisibility && {
          isPrivate: newVisibility.isPrivate,
          isExplore: newVisibility.isExplore,
          isNetwork: newVisibility.isNetwork,
          circleIds: newVisibility.circleIds,
        }),
      };

      ChallengeDebugV2.checkpoint('CP2-POST-DATA', 'Post data created in Daily', postData);
      if (__DEV__) console.log('📤 [DailyScreen] About to call addPost with:', { type: postData.type, hasPhoto: !!postData.photoUri, hasMedia: !!postData.mediaUrl, actionTitle: postData.actionTitle });

      addPost(postData).then(() => {
        if (__DEV__) console.log('✅ [DailyScreen] Individual post addPost resolved, refreshing feed');
        useStore.getState().fetchUnifiedFeed(true);
        fetchDailyActions();
      }).catch((error) => {
        if (__DEV__) console.error('❌ Failed to save post to database:', error);
        Alert.alert(
          'Failed to Share',
          error.message || 'Unable to share your progress. Your action was completed, but it may not appear in feeds. Please try sharing again.',
          [{ text: 'OK' }]
        );
      });
    }

    // Refresh weekly progress after successful completion
    refreshWeeklyProgress();
    } finally {
      setCompletingActionId(null);
    }
  };

  const handleAbstinenceComplete = async (
    didStayOnTrack: boolean,
    comment?: string,
    photoUri?: string,
    circleIds?: string[],
    includeFollowers?: boolean
  ) => {
    if (__DEV__) console.log('🎯 [DAILY] handleAbstinenceComplete called:', {
      action: selectedAction?.title,
      didStayOnTrack,
      hasComment: !!comment,
      hasPhoto: !!photoUri,
      circleIds,
      includeFollowers
    });

    if (!selectedAction) return;

    if (completingActionId === selectedAction.id) {
      if (__DEV__) console.log('🚫 [DAILY] Already submitting action:', selectedAction.id);
      return;
    }

    setCompletingActionId(selectedAction.id);

    try {
      setShowAbstinenceModal(false);
      const actionToComplete = selectedAction;
      setSelectedAction(null);

      HapticManager.context.actionCompleted();

      const isPrivate = (!circleIds || circleIds.length === 0) && !includeFollowers;
      const visibility = isPrivate ? 'private' : 'circle';

      const useLivingProgressCards = await featureFlags.isEnabled('use_living_progress_cards');
      const user = useStore.getState().user;

      if (useLivingProgressCards && user?.id && !isPrivate && actionToComplete.isFromChallenge) {
        if (__DEV__) console.log('✅ [DAILY] Using Living Progress Card for abstinence');

        const participantId = actionToComplete.challengeParticipantId;
        let currentDay, totalDays;

        if (participantId) {
          try {
            const { data: participant } = await supabase
              .from('challenge_participants')
              .select('current_day, challenges(duration_days)')
              .eq('id', participantId)
              .single();

            if (participant) {
              currentDay = participant.current_day;
              totalDays = (participant.challenges as any)?.duration_days;
              if (__DEV__) console.log('📊 [DAILY] Participant data:', { currentDay, totalDays });
            }
          } catch (error) {
            if (__DEV__) console.error('❌ [DAILY] Failed to fetch participant data:', error);
          }
        }

        const progressPost = await backendService.findOrCreateDailyProgressPost(
          user.id,
          actionToComplete.challengeId,
          actionToComplete.challengeName,
          { currentDay, totalDays }
        );

        if (!progressPost.success || !progressPost.data) {
          throw new Error('Failed to find or create progress post');
        }

        const totalActions = actions.filter(a => a.challengeId === actionToComplete.challengeId).length;

        const updateResult = await backendService.updateDailyProgressPost(
          progressPost.data.id,
          {
            actionId: actionToComplete.id,
            title: actionToComplete.title,
            goalTitle: actionToComplete.goalTitle,
            goalColor: actionToComplete.goalColor,
            completedAt: new Date().toISOString(),
            streak: 0,
            comment: didStayOnTrack ? comment : `Did not stay on track${comment ? ': ' + comment : ''}`,
          },
          totalActions
        );

        if (!updateResult) {
          throw new Error('Failed to update Living Progress Card');
        }

        if (__DEV__) console.log('✅ [DAILY] Updated Living Progress Card with abstinence');

        // Check if user added photo/comment (media) - if so, create individual post too (dual posting)
        const hasMedia = !!photoUri || !!comment;

        if (!hasMedia) {
          // Just a check - Living Progress Card only, no individual post
          if (__DEV__) console.log('📋 [DAILY] No media for abstinence, Living Progress Card only');
          useStore.getState().fetchUnifiedFeed(true);
          toggleAction(actionToComplete.id);
          fetchDailyActions();
          refreshWeeklyProgress();
          return;
        }

        // User added media - fall through to create individual post too (dual posting)
        if (__DEV__) console.log('📸 [DAILY] User added media for abstinence, creating individual post too (dual posting)');
      }

      // Create individual post (either fallback when Living Progress Cards disabled, OR dual posting when media exists)
      const needsIndividualPost = !useLivingProgressCards || !user?.id || isPrivate || !actionToComplete.isFromChallenge || (!!photoUri || !!comment);

      if (needsIndividualPost) {
        if (__DEV__) console.log('📝 [DAILY] Creating individual post for abstinence');

        addCompletedAction({
          id: `${actionToComplete.id}-${Date.now()}`,
          actionId: actionToComplete.id,
          title: actionToComplete.title,
          goalTitle: actionToComplete.goalTitle,
          completedAt: new Date(),
          isPrivate,
          visibility: visibility as any,
          streak: 0,
          type: photoUri ? 'photo' : comment ? 'milestone' : 'check',
          mediaUrl: photoUri,
          content: didStayOnTrack ? comment : `Did not stay on track${comment ? ': ' + comment : ''}`,
          category: actionToComplete.goalTitle || 'general',
        });

        // Post to backend if not private
        if (!isPrivate && (circleIds || includeFollowers)) {
          const postDataForBackend = {
            type: photoUri ? 'checkin' : 'milestone',
            visibility: visibility,
            content: didStayOnTrack ? (comment || 'Completed') : `Did not stay on track${comment ? ': ' + comment : ''}`,
            actionTitle: actionToComplete.title,
            goal: actionToComplete.goalTitle,
            goalColor: actionToComplete.goalColor,
            streak: 0,
            actionType: 'abstinence',
            didStayOnTrack,
            photoUri: photoUri,
            mediaUrl: photoUri,
            // Multi-circle visibility model (matches regular actions)
            isPrivate: false,
            isExplore: false,
            isNetwork: false,
            circleIds: circleIds,
            includeFollowers: includeFollowers,
          };

          addPost(postDataForBackend).then(() => {
            if (__DEV__) console.log('✅ [DAILY] Individual abstinence post created, refreshing feed');
            useStore.getState().fetchUnifiedFeed(true);
          }).catch(error => {
            if (__DEV__) console.error('❌ [DAILY] Failed to create individual post for abstinence:', error);
          });
        }
      }

      if (actionToComplete.isFromChallenge && actionToComplete.challengeActivityId) {
        const challengeSuccess = await recordCompletion(
          actionToComplete.challengeParticipantId,
          actionToComplete.challengeActivityId,
          undefined
        );

        if (!challengeSuccess) {
          throw new Error('Failed to record challenge completion');
        }
      }

      toggleAction(actionToComplete.id);
      fetchDailyActions();

      // Refresh weekly progress after successful completion
      refreshWeeklyProgress();

      if (__DEV__) console.log('🟢 [DAILY] Abstinence completion successful');
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [DAILY] Abstinence completion failed:', error);

      Alert.alert(
        'Completion Failed',
        error.message || 'Failed to save your progress. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCompletingActionId(null);
    }
  };

  const handleRetry = async () => {
    try {
      await fetchDailyActions();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh actions. Please try again.');
    }
  };

  const handleActionLongPress = (action: any) => {
    setActionToEdit(action);
    setShowActionMenu(true);
    HapticManager.interaction.longPress();
  };

  const handleEditAction = () => {
    setShowActionMenu(false);

    if (!actionToEdit) return;

    Alert.prompt(
      'Edit Action',
      'Update action title',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newTitle) => {
            if (newTitle && newTitle.trim()) {
              updateAction(actionToEdit.id, { title: newTitle.trim() });
              HapticManager.interaction.tap();
              setActionToEdit(null);
            }
          }
        }
      ],
      'plain-text',
      actionToEdit.title
    );
  };

  const handleChangeTime = () => {
    setShowActionMenu(false);

    if (!actionToEdit) return;

    const currentTime = actionToEdit.time || '09:00';
    const [hours, minutes] = currentTime.split(':').map(Number);
    setSelectedTime({ hours: hours || 9, minutes: minutes || 0 });
    setShowTimePicker(true);
    HapticManager.interaction.tap();
  };

  const handleTimeConfirm = async () => {
    if (!actionToEdit) return;

    const newTime = `${String(selectedTime.hours).padStart(2, '0')}:${String(selectedTime.minutes).padStart(2, '0')}`;

    console.log('⏰ [TIME-EDIT] Starting time update');
    console.log('⏰ [TIME-EDIT] Action to edit:', actionToEdit);
    console.log('⏰ [TIME-EDIT] New time:', newTime);

    try {
      if (actionToEdit.isFromChallenge) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const activityId = actionToEdit.challengeActivityId || actionToEdit.id.replace(`challenge-${actionToEdit.challengeId}-`, '');

        console.log('⏰ [TIME-EDIT] Challenge activity detected');
        console.log('⏰ [TIME-EDIT] Updating JSONB activity_times');
        console.log('⏰ [TIME-EDIT] Full action ID:', actionToEdit.id);
        console.log('⏰ [TIME-EDIT] Extracted activityId:', activityId);
        console.log('⏰ [TIME-EDIT] challengeId:', actionToEdit.challengeId);
        console.log('⏰ [TIME-EDIT] user_id:', user.id);

        await supabaseChallengeService.updateChallengeActivityTime(
          user.id,
          actionToEdit.challengeId,
          activityId,
          newTime
        );

        console.log('✅ [TIME-EDIT] Successfully updated activity_times JSONB');
      } else {
        console.log('⏰ [TIME-EDIT] Regular action detected');
        await updateAction(actionToEdit.id, { time: newTime });
        console.log('✅ [TIME-EDIT] Successfully updated regular action time');
      }

      console.log('⏰ [TIME-EDIT] Closing modal and refreshing actions');
      HapticManager.interaction.premiumPress();
      setShowTimePicker(false);
      setActionToEdit(null);
      await fetchDailyActions();
      console.log('✅ [TIME-EDIT] Time update complete');
    } catch (error) {
      console.error('❌ [TIME-EDIT] Error in handleTimeConfirm:', error);
      Alert.alert('Error', 'Failed to update time. Please try again.');
    }
  };

  const handleDeleteAction = () => {
    setShowActionMenu(false);

    if (!actionToEdit) return;

    Alert.alert(
      'Delete Action',
      `Are you sure you want to delete "${actionToEdit.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setActionToEdit(null) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAction(actionToEdit.id);
              HapticManager.error.strong();
              setActionToEdit(null);
              await fetchDailyActions();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete action. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn} style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(231,180,58,0.15)', 'transparent']}
        style={styles.emptyGradient}
      />
      <Target size={64} color="#E7B43A" strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>Your day, your way</Text>
      <Text style={styles.emptySubtitle}>
        Start building your perfect routine.{'\n'}
        Set goals and schedule daily actions to{'\n'}
        transform your life, one day at a time.
      </Text>
      <Pressable style={styles.startGoalButton} onPress={openOnboarding}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.startGoalGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Text style={styles.startGoalText}>Start Goal Setup</Text>
      </Pressable>
    </Animated.View>
  );

  if (actionsError && !actionsLoading) {
    return (
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{actionsError}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

      <UnityHeader
        rightContent={<Text style={styles.dateText}>{getDateString()}</Text>}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >

        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={styles.progressContainer}
        >
          <View style={styles.progressSection}>
            <DailyProgressRing completed={completed} total={actions.length} />
            <View style={styles.statsCol}>
              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{progress}%</Text>
                  <Text style={styles.statLabel}>TODAY</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{getWeekProgress()}%</Text>
                  <Text style={styles.statLabel}>THIS WEEK</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {activeChallenge && (
          <View style={styles.goalSection}>
            <GoalCard
              title={challengeName || ''}
              currentDay={currentDay}
              totalDays={totalDays}
              progressPercent={challengeProgress}
            />
          </View>
        )}

        <SectionDivider />

        {/* Show skeleton during initial load */}
        {actionsLoading && actions.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <FeedSkeleton />
            <LoadingSpinner
              text="Loading your actions..."
              size="small"
              theme="gold"
            />
          </View>
        ) : actions.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {abstinenceActions.length > 0 && (
              <>
                <SectionHeader
                  title="ALL-DAY COMMITMENTS"
                  completedCount={abstinenceActions.filter(a => a.done).length}
                  totalCount={abstinenceActions.length}
                />
                <View style={styles.commitmentsSection}>
                  {abstinenceActions.map((action, index) => (
                    <Animated.View
                      key={action.id}
                      entering={FadeInDown.delay(index * 50).springify()}
                    >
                      <CommitmentCard
                        action={action}
                        onPress={() => handleTaskToggle(action)}
                        onLongPress={() => handleActionLongPress(action)}
                      />
                    </Animated.View>
                  ))}
                </View>
                <SectionDivider />
              </>
            )}

            {timedActions.length > 0 && (
              <>
                <SectionHeader
                  title="SCHEDULED ACTIONS"
                  completedCount={timedActions.filter(a => a.done).length}
                  totalCount={timedActions.length}
                />
                <View style={styles.timelineSection}>
                  <LinearGradient
                    colors={['#D4AF37', 'rgba(231,180,58,0.15)']}
                    style={styles.timelineLine}
                  />
                  {timedActions.map((action, index) => {
                    const state = action.done ? 'done' : isActionActive(action) ? 'active' : 'default';

                    return (
                      <Animated.View
                        key={action.id}
                        entering={FadeInDown.delay(index * 50).springify()}
                        style={styles.timelineItem}
                      >
                        <Text style={styles.timeLabel}>{formatTime24(action.time)}</Text>
                        <TimelineDot state={state} />
                        <TimelineCard
                          action={action}
                          state={state}
                          onPress={() => handleTaskToggle(action)}
                          onLongPress={() => handleActionLongPress(action)}
                        />
                      </Animated.View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Add Action button removed - handler not implemented yet */}
          </>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={openOnboarding}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFD700', '#E7B43A']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      <SocialSharePrompt
        visible={showSharePrompt}
        onClose={() => setShowSharePrompt(false)}
        progress={progress}
        completedActions={completed}
        totalActions={actions.length}
        streak={0} // TODO: Fix and re-enable streaks
      />

      <PrivacySelectionModal
        visible={showPrivacyModal}
        onClose={() => {
          setShowPrivacyModal(false);
          setSelectedAction(null);
        }}
        onSelect={handlePrivacySelect}
        actionTitle={selectedAction?.title || ''}
        streak={0} // TODO: Fix and re-enable streaks
      />

      <AbstinenceModal
        visible={showAbstinenceModal}
        onClose={() => {
          setShowAbstinenceModal(false);
          setSelectedAction(null);
        }}
        onComplete={handleAbstinenceComplete}
        actionTitle={selectedAction?.title || ''}
        streak={0} // TODO: Fix and re-enable streaks
      />

      {actionsLoading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={LuxuryTheme.colors.primary.gold} />
            <Text style={styles.loadingText}>Loading your actions...</Text>
          </View>
        </View>
      )}

      {showActionMenu && actionToEdit && (
        <Pressable
          style={styles.actionMenuOverlay}
          onPress={() => {
            setShowActionMenu(false);
            setActionToEdit(null);
          }}
          activeOpacity={1}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenu}>
              {!actionToEdit.isFromChallenge && (
                <>
                  <Pressable style={styles.menuItem} onPress={handleEditAction}>
                    <Edit3 size={20} color={LuxuryTheme.colors.text.primary} />
                    <Text style={styles.menuText}>Edit Action</Text>
                  </Pressable>
                  <View style={styles.menuDivider} />
                </>
              )}
              <Pressable style={styles.menuItem} onPress={handleChangeTime}>
                <Text style={styles.menuIcon}>🕐</Text>
                <Text style={styles.menuText}>Change Time</Text>
              </Pressable>
              {!actionToEdit.isFromChallenge && (
                <>
                  <View style={styles.menuDivider} />
                  <Pressable style={styles.menuItem} onPress={handleDeleteAction}>
                    <Trash2 size={20} color="#ef4444" />
                    <Text style={[styles.menuText, { color: '#ef4444' }]}>Delete Action</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Pressable>
      )}

      {showTimePicker && (
        <Pressable
          style={styles.actionMenuOverlay}
          onPress={() => {
            setShowTimePicker(false);
            setActionToEdit(null);
          }}
          activeOpacity={1}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.actionMenuContainer}>
            <View style={styles.timePicker}>
              <Text style={styles.timePickerTitle}>Set Time</Text>
              <Text style={styles.timePickerSubtitle}>{actionToEdit?.title}</Text>

              <View style={styles.timePickerControls}>
                <View style={styles.timeColumn}>
                  <Pressable
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTime(prev => ({
                        ...prev,
                        hours: prev.hours === 23 ? 0 : prev.hours + 1
                      }));
                      HapticManager.interaction.tap();
                    }}
                  >
                    <Text style={styles.timeButtonText}>▲</Text>
                  </Pressable>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeValue}>{String(selectedTime.hours).padStart(2, '0')}</Text>
                    <Text style={styles.timeLabel}>Hour</Text>
                  </View>
                  <Pressable
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTime(prev => ({
                        ...prev,
                        hours: prev.hours === 0 ? 23 : prev.hours - 1
                      }));
                      HapticManager.interaction.tap();
                    }}
                  >
                    <Text style={styles.timeButtonText}>▼</Text>
                  </Pressable>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeColumn}>
                  <Pressable
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTime(prev => ({
                        ...prev,
                        minutes: prev.minutes === 59 ? 0 : prev.minutes + 1
                      }));
                      HapticManager.interaction.tap();
                    }}
                  >
                    <Text style={styles.timeButtonText}>▲</Text>
                  </Pressable>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeValue}>{String(selectedTime.minutes).padStart(2, '0')}</Text>
                    <Text style={styles.timeLabel}>Min</Text>
                  </View>
                  <Pressable
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTime(prev => ({
                        ...prev,
                        minutes: prev.minutes === 0 ? 59 : prev.minutes - 1
                      }));
                      HapticManager.interaction.tap();
                    }}
                  >
                    <Text style={styles.timeButtonText}>▼</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.timePickerActions}>
                <Pressable
                  style={[styles.timeActionButton, styles.timeCancelButton]}
                  onPress={() => {
                    setShowTimePicker(false);
                    setActionToEdit(null);
                  }}
                >
                  <Text style={styles.timeCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.timeActionButton, styles.timeConfirmButton]}
                  onPress={handleTimeConfirm}
                >
                  <LinearGradient
                    colors={['#FFD700', '#E7B43A']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.timeConfirmText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 0.5,
    paddingTop: 4,
  },
  progressContainer: {
    paddingTop: 20,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
  },
  skeletonContainer: {
    padding: 20,
    gap: 16,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statsCol: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFC84A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  commitmentsSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  timelineSection: {
    paddingHorizontal: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 39,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 44,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeLabel: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
    paddingTop: 14,
  },
  addActionSection: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
    position: 'relative',
  },
  emptyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  startGoalButton: {
    position: 'relative',
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  startGoalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  startGoalText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '500',
  },
  actionMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  actionMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenu: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuText: {
    color: LuxuryTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  menuIcon: {
    fontSize: 20,
    width: 20,
    textAlign: 'center',
  },
  timePicker: {
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
    borderRadius: 24,
    padding: 24,
    minWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 4,
  },
  timePickerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 32,
  },
  timePickerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  timeColumn: {
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: '600',
  },
  timeDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    minWidth: 80,
  },
  timeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
    marginHorizontal: 8,
  },
  timePickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  timeActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timeConfirmButton: {
    position: 'relative',
  },
  timeConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000',
    lineHeight: 24,
  },
});
