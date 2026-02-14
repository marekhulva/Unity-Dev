import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Flame, Trophy, Zap, CheckCircle2, Circle, Target, Clock, Edit3, Trash2, MoreVertical } from 'lucide-react-native';
import { HapticManager } from '../../utils/haptics';
import { useStore } from '../../state/rootStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { PrivacySelectionModal } from './PrivacySelectionModal';
import { AbstinenceModal } from './AbstinenceModal';
import { featureFlags } from '../../services/featureFlags.service';
import { backendService } from '../../services/backend.service';

interface ActionItemProps {
  id: string;
  title: string;
  goalTitle?: string;
  done?: boolean;
  failed?: boolean;
  streak: number;
  time?: string;
  type?: 'goal' | 'performance' | 'commitment' | 'oneTime' | 'one-time';
  goalColor?: string;
  isAbstinence?: boolean;
}

// Helper function to format time from 24hr to 12hr with AM/PM
const formatTime = (time?: string) => {
  if (!time) return undefined;
  
  // Handle various time formats (HH:MM or HH:MM:SS)
  const parts = time.split(':');
  let hours = parseInt(parts[0]);
  const minutes = parts[1];
  
  if (isNaN(hours)) return time;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight, and 13-23 to 1-11
  
  return `${hours}:${minutes} ${period}`;
};

export const ActionItem: React.FC<ActionItemProps> = ({
  id,
  title,
  goalTitle,
  done = false,
  failed = false,
  streak,
  time,
  type = 'goal',
  goalColor,
  isAbstinence = false
}) => {
  if (__DEV__) console.log('🎯 [ActionItem] Rendering:', { id, title, done, failed, goalTitle, goalColor, isAbstinence });
  const toggle = useStore(s => s.toggleAction);
  const updateAction = useStore(s => s.updateAction);
  const deleteAction = useStore(s => s.deleteAction);
  const openShare = useStore(s => s.openShare);
  const addCompletedAction = useStore(s => s.addCompletedAction);
  const user = useStore(s => s.user);
  const actions = useStore(s => s.actions);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAbstinenceModal, setShowAbstinenceModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const scaleAnimation = useSharedValue(1);
  const streakGlow = useSharedValue(0);
  const checkAnimation = useSharedValue(done ? 1 : 0);
  
  // Streak glow animation for high streaks
  useEffect(() => {
    if (streak > 7) {
      streakGlow.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [streak]);

  // Complete animation
  useEffect(() => {
    checkAnimation.value = withSpring(done ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [done]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(checkAnimation.value, [0, 1], [1, 0.7]),
    transform: [{ scale: interpolate(checkAnimation.value, [0, 1], [1, 0.98]) }],
  }));

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(checkAnimation.value, [0, 1], [1, 1.1]) }],
  }));

  const streakBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(streakGlow.value, [0, 1], [1, 1.05]) }],
  }));

  const getStreakIcon = () => {
    if (streak >= 30) return <Trophy size={12} color={LuxuryTheme.colors.primary.gold} />;
    if (streak >= 7) return <Zap size={12} color={LuxuryTheme.colors.primary.gold} />;
    return <Flame size={12} color={LuxuryTheme.colors.primary.gold} />;
  };

  const handleToggle = async () => {
    if (__DEV__) console.log('🎯 [ActionItem] handleToggle called:', { id, title, done, isAbstinence });

    if (!done) {
      if (isAbstinence) {
        if (__DEV__) console.log('🎯 [ActionItem] Opening abstinence modal for action:', title);
        setShowAbstinenceModal(true);
      } else {
        if (__DEV__) console.log('🎯 [ActionItem] Opening privacy modal for action:', title);
        setShowPrivacyModal(true);
      }
      HapticManager.interaction.premiumPress();
      if (__DEV__) console.log('🎯 [ActionItem] Modal state set to true');
    } else {
      if (__DEV__) console.log('🎯 [ActionItem] Action already completed, no uncomplete allowed');
      HapticManager.interaction.error();
    }
  };

  const handlePrivacySelect = async (
    visibility: 'private' | 'public' | 'circle' | 'followers',
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
    if (__DEV__) console.log('🎯 [ActionItem] handlePrivacySelect called:', { id, title, visibility, contentType, content, mediaUri, newVisibility });

    // Mark action as complete
    await toggle(id);
    // Re-fetch actions to ensure "today check" is current with UTC timestamps
    await fetchDailyActions();
    if (streak >= 7) {
      HapticManager.context.streakExtended();
    } else {
      HapticManager.context.actionCompleted();
    }

    // Check if Living Progress Cards feature is enabled
    const useLivingProgressCards = await featureFlags.isEnabled('use_living_progress_cards');
    if (__DEV__) {
      console.log('🎯 [ActionItem] Feature flag check:', {
        useLivingProgressCards,
        userId: user?.id,
        visibility,
        hasUserId: !!user?.id,
        isNotPrivate: visibility !== 'private'
      });
      console.log('🎯 [ActionItem] Condition breakdown:', {
        flag: useLivingProgressCards,
        user: !!user?.id,
        notPrivate: visibility !== 'private',
        willUseLivingCard: useLivingProgressCards && user?.id && visibility !== 'private'
      });
    }

    if (useLivingProgressCards && user?.id && visibility !== 'private') {
      // LIVING PROGRESS CARD FLOW
      if (__DEV__) console.log('✅ [ACTION] ===== USING LIVING PROGRESS CARD FLOW =====');

      try {
        const progressPost = await backendService.findOrCreateDailyProgressPost(user.id);

        if (progressPost.success && progressPost.data) {
          const totalActions = actions.length;

          await backendService.updateDailyProgressPost(
            progressPost.data.id,
            {
              actionId: id,
              title,
              goalTitle,
              goalColor,
              completedAt: new Date().toISOString(),
              // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
              streak: 0,
            },
            totalActions
          );

          if (__DEV__) console.log('✅ [ACTION] Updated Living Progress Card');

          if (content || mediaUri) {
            try {
              await backendService.createPost({
                type: mediaUri ? 'photo' : 'checkin',
                visibility: 'circle',
                content: content || '',
                mediaUrl: mediaUri,
                actionTitle: title,
                goalTitle: goalTitle,
                goalColor: goalColor,
                streak: 0,
              });
              if (__DEV__) console.log('✅ [ACTION] Individual post created with photo/comment');
            } catch (postError: any) {
              console.error('❌ [ACTION] Failed to create individual post:', postError);
              Alert.alert(
                'Photo Upload Failed',
                postError.message || 'Failed to save your photo. Please check your connection and try again.',
                [{ text: 'OK', style: 'cancel' }]
              );
            }
          }

          useStore.getState().fetchUnifiedFeed(true);
          if (__DEV__) console.log('🔄 [ACTION] Refreshed unified feed');
        }
      } catch (error) {
        if (__DEV__) console.error('❌ [ACTION] Failed to update Living Progress Card:', error);
      }
    } else {
      // LEGACY FLOW - create individual posts
      if (__DEV__) console.log('❌ [ACTION] ===== USING LEGACY INDIVIDUAL POST FLOW =====', {
        reason: !useLivingProgressCards ? 'Feature flag is false' :
                !user?.id ? 'No user ID' :
                visibility === 'private' ? 'Visibility is private' :
                'Unknown'
      });

      const actionType = contentType === 'photo' ? 'photo' :
                        contentType === 'audio' ? 'audio' :
                        contentType === 'text' ? 'milestone' :
                        'check';

      const mediaUrl = mediaUri || undefined;

      const mappedVisibility = visibility === 'public' ? 'circle' : visibility;

      addCompletedAction({
        id: `${id}-${Date.now()}`,
        actionId: id,
        title,
        goalTitle,
        completedAt: new Date(),
        isPrivate: visibility === 'private',
        visibility: mappedVisibility as any,
        // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
        streak: 0,
        type: actionType,
        mediaUrl,
        content,
        category: goalTitle || 'general',
      });

      if (visibility !== 'private' && contentType !== 'check') {
        setTimeout(() => {
          openShare({
            type: 'checkin',
            visibility: mappedVisibility,
            actionTitle: title,
            goal: goalTitle,
            // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
        streak: 0,
            goalColor: goalColor || LuxuryTheme.colors.primary.gold,
            contentType,
          });
        }, 500);
      }
    }

    setShowPrivacyModal(false);
  };

  const handleAbstinenceComplete = async (
    didStayOnTrack: boolean,
    comment?: string,
    photoUri?: string,
    circleIds?: string[],
    includeFollowers?: boolean
  ) => {
    if (__DEV__) console.log('🎯 [ActionItem] handleAbstinenceComplete called:', {
      id,
      title,
      didStayOnTrack,
      hasComment: !!comment,
      hasPhoto: !!photoUri,
      circleIds,
      includeFollowers
    });

    // Determine if this was a failure
    const failed = !didStayOnTrack;
    const failureReason = !didStayOnTrack && comment
      ? comment
      : !didStayOnTrack
        ? 'Did not stay on track'
        : undefined;

    // Mark action as complete (or failed)
    await toggle(id, failed, failureReason);
    // Re-fetch actions to ensure "today check" is current with UTC timestamps
    await fetchDailyActions();
    if (streak >= 7) {
      HapticManager.context.streakExtended();
    } else {
      HapticManager.context.actionCompleted();
    }

    // Determine visibility based on circle selection
    const isPrivate = (!circleIds || circleIds.length === 0) && !includeFollowers;
    const visibility = isPrivate ? 'private' : 'circle';

    if (__DEV__) console.log('🎯 [ActionItem] Abstinence visibility:', { isPrivate, visibility, circleIds, includeFollowers });

    // Check if Living Progress Cards feature is enabled
    const useLivingProgressCards = await featureFlags.isEnabled('use_living_progress_cards');
    if (__DEV__) {
      console.log('🎯 [ActionItem] Feature flag check:', {
        useLivingProgressCards,
        userId: user?.id,
        visibility,
        hasUserId: !!user?.id,
        isNotPrivate: !isPrivate
      });
    }

    if (useLivingProgressCards && user?.id && !isPrivate) {
      // LIVING PROGRESS CARD FLOW
      if (__DEV__) console.log('✅ [ACTION] ===== USING LIVING PROGRESS CARD FLOW (ABSTINENCE) =====');

      try {
        const progressPost = await backendService.findOrCreateDailyProgressPost(user.id);

        if (progressPost.success && progressPost.data) {
          const totalActions = actions.length;

          await backendService.updateDailyProgressPost(
            progressPost.data.id,
            {
              actionId: id,
              title,
              goalTitle,
              goalColor,
              completedAt: new Date().toISOString(),
              // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
              streak: 0,
              comment: didStayOnTrack ? comment : `Did not stay on track${comment ? ': ' + comment : ''}`,
              photoUri,
              failed: !didStayOnTrack,
            },
            totalActions
          );

          if (__DEV__) console.log('✅ [ACTION] Updated Living Progress Card with abstinence completion');

          if (comment || photoUri) {
            try {
              const postContent = didStayOnTrack
                ? (comment || '')
                : `Did not stay on track${comment ? ': ' + comment : ''}`;
              await backendService.createPost({
                type: photoUri ? 'photo' : 'checkin',
                visibility: 'circle',
                content: postContent,
                mediaUrl: photoUri,
                actionTitle: title,
                goalTitle: goalTitle,
                goalColor: goalColor,
                streak: 0,
              });
              if (__DEV__) console.log('✅ [ACTION] Individual abstinence post created');
            } catch (postError: any) {
              console.error('❌ [ACTION] Failed to create individual post:', postError);
              Alert.alert(
                'Photo Upload Failed',
                postError.message || 'Failed to save your photo. Please check your connection and try again.',
                [{ text: 'OK', style: 'cancel' }]
              );
            }
          }

          useStore.getState().fetchUnifiedFeed(true);
          if (__DEV__) console.log('🔄 [ACTION] Refreshed unified feed');
        }
      } catch (error) {
        if (__DEV__) console.error('❌ [ACTION] Failed to update Living Progress Card:', error);
      }
    } else {
      // LEGACY FLOW - create individual posts
      if (__DEV__) console.log('❌ [ACTION] ===== USING LEGACY INDIVIDUAL POST FLOW (ABSTINENCE) =====', {
        reason: !useLivingProgressCards ? 'Feature flag is false' :
                !user?.id ? 'No user ID' :
                isPrivate ? 'Visibility is private' :
                'Unknown'
      });

      const actionType = photoUri ? 'photo' : comment ? 'milestone' : 'check';

      addCompletedAction({
        id: `${id}-${Date.now()}`,
        actionId: id,
        title,
        goalTitle,
        completedAt: new Date(),
        isPrivate,
        visibility: visibility as any,
        // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
        streak: 0,
        type: actionType,
        mediaUrl: photoUri,
        content: didStayOnTrack ? comment : `Did not stay on track${comment ? ': ' + comment : ''}`,
        category: goalTitle || 'general',
      });

      if (!isPrivate && (photoUri || comment)) {
        setTimeout(() => {
          openShare({
            type: 'checkin',
            visibility,
            actionTitle: title,
            goal: goalTitle,
            // TODO: Fix and re-enable streaks - See mvpfix.md Issue #1
        streak: 0,
            goalColor: goalColor || LuxuryTheme.colors.primary.gold,
            contentType: photoUri ? 'photo' : 'text',
          });
        }, 500);
      }
    }

    setShowAbstinenceModal(false);
  };

  const handleEdit = () => {
    setShowActionMenu(false);

    Alert.prompt(
      'Edit Action',
      'Update action title',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newTitle) => {
            if (newTitle && newTitle.trim()) {
              updateAction(id, { title: newTitle.trim() });
              HapticManager.interaction.tap();
            }
          }
        }
      ],
      'plain-text',
      title
    );
  };

  const handleDelete = () => {
    setShowActionMenu(false);
    Alert.alert(
      'Delete Action',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAction(id);
            HapticManager.error.strong();
          }
        }
      ]
    );
  };

  const handleLongPress = () => {
    setShowActionMenu(true);
    HapticManager.interaction.longPress();
  };

  return (
    <Animated.View entering={FadeIn} style={animatedStyle}>
      <TouchableOpacity onPress={handleToggle} onLongPress={handleLongPress} activeOpacity={0.7}>
        <View style={[styles.card, done && !failed && styles.cardDone, failed && styles.cardFailed]}>
          <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFillObject} />

          {/* Subtle gradient overlay */}
          <LinearGradient
            colors={done
              ? failed
                ? ['rgba(239, 68, 68, 0.05)', 'rgba(239, 68, 68, 0.02)']
                : ['rgba(34, 197, 94, 0.05)', 'rgba(34, 197, 94, 0.02)']
              : ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.row}>
            {/* Premium Checkbox */}
            <Animated.View style={[styles.checkbox, checkboxStyle]}>
              {done ? (
                failed ? (
                  // Failed state: Red X
                  <View style={styles.checkboxFailed}>
                    <LinearGradient
                      colors={['#ef4444', '#dc2626']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.failedMark}>✕</Text>
                  </View>
                ) : (
                  // Success state: Green/Gold checkmark
                  <View style={styles.checkboxChecked}>
                    <LinearGradient
                      colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <CheckCircle2 color="#000" size={24} strokeWidth={3} />
                  </View>
                )
              ) : (
                // Not done: Empty circle
                <Circle color={LuxuryTheme.colors.text.tertiary} size={24} strokeWidth={1.5} />
              )}
            </Animated.View>
            
            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>
                {time && (
                  <View style={styles.timeBadge}>
                    <Clock size={12} color={done ? LuxuryTheme.colors.text.muted : LuxuryTheme.colors.primary.gold} />
                    <Text style={[styles.timeText, done && styles.timeTextDone]}>{formatTime(time)}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.metaRow}>
                {time && (
                  <View style={styles.timeBadge}>
                    <Clock size={12} color={LuxuryTheme.colors.primary.gold} />
                    <Text style={styles.timeText}>{formatTime(time)}</Text>
                  </View>
                )}
                
                {goalTitle && (
                  <View style={styles.goalBadge}>
                    <Target size={12} color={LuxuryTheme.colors.primary.gold} />
                    <Text style={styles.goalText}>{goalTitle}</Text>
                  </View>
                )}
                
                {/* TODO: Fix and re-enable streaks - See mvpfix.md Issue #1 */}
                {/* {streak > 0 && (
                  <Animated.View style={[styles.streakBadge, streak > 7 && streakBadgeStyle]}>
                    <LinearGradient
                      colors={streak >= 30 
                        ? ['rgba(231, 180, 58, 0.2)', 'rgba(231, 180, 58, 0.1)']
                        : streak >= 7
                        ? ['rgba(231, 180, 58, 0.15)', 'rgba(231, 180, 58, 0.08)']
                        : ['rgba(231, 180, 58, 0.1)', 'rgba(231, 180, 58, 0.05)']
                      }
                      style={StyleSheet.absoluteFillObject}
                    />
                    {getStreakIcon()}
                    <Text style={styles.streakText}>{streak}</Text>
                    {streak >= 7 && <Text style={styles.streakLabel}>day{streak !== 1 ? 's' : ''}</Text>}
                  </Animated.View>
                )} */}
              </View>
            </View>

            {/* Completion Indicator */}
            {done && (
              <View style={styles.doneIndicator}>
                <Text style={styles.doneText}>✓</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Privacy Selection Modal */}
      <PrivacySelectionModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSelect={handlePrivacySelect}
        actionTitle={title}
        streak={0} // TODO: Fix and re-enable streaks
      />

      {/* Abstinence Modal */}
      <AbstinenceModal
        visible={showAbstinenceModal}
        onClose={() => setShowAbstinenceModal(false)}
        onComplete={handleAbstinenceComplete}
        actionTitle={title}
        streak={0} // TODO: Fix and re-enable streaks
      />

      {/* Action Menu Modal */}
      {showActionMenu && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={() => setShowActionMenu(false)}
          activeOpacity={1}
        >
          <View style={styles.actionMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Edit3 size={20} color={LuxuryTheme.colors.text.primary} />
              <Text style={styles.menuText}>Edit Action</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Delete Action</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { 
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  cardFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    marginRight: 14,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFailed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: { 
    color: LuxuryTheme.colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    flex: 1,
    marginRight: 8,
  },
  titleDone: {
    color: LuxuryTheme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: LuxuryTheme.colors.primary.gold,
    letterSpacing: 0.3,
  },
  timeTextDone: {
    color: LuxuryTheme.colors.text.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  goalText: {
    color: LuxuryTheme.colors.primary.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  streakText: {
    color: LuxuryTheme.colors.primary.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  streakLabel: {
    color: LuxuryTheme.colors.primary.gold,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
  doneIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  actionMenu: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
});