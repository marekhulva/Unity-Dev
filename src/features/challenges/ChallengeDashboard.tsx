import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { 
  Trophy, 
  Flame, 
  CheckCircle, 
  Circle,
  TrendingUp,
  Users,
  Calendar,
  Target
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../state/rootStore';

const { width } = Dimensions.get('window');

interface ChallengeDashboardProps {
  challenge: any;
  participantId: string;
  myParticipation?: any;
}

export const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({
  challenge,
  participantId,
  myParticipation: myParticipationProp,
}) => {
  const {
    leaderboard,
    myParticipation: myParticipationStore,
    recordCompletion,
    getTodayCompletions
  } = useStore();

  const myParticipation = myParticipationProp || myParticipationStore;
  
  if (__DEV__) console.log('📊 [DASHBOARD] Component rendered with:', {
    challengeId: challenge?.id,
    participantId,
    leaderboardLength: leaderboard?.length,
    myParticipation: myParticipation,
    hasLeaderboard: leaderboard && leaderboard.length > 0
  });
  
  const [todayCompleted, setTodayCompleted] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'leaderboard' | 'progress'>('leaderboard');
  
  // Load today's completions on mount and when tab changes
  useEffect(() => {
    const loadTodayCompletions = async () => {
      if (participantId) {
        const completions = await getTodayCompletions(participantId);
        if (completions && Array.isArray(completions)) {
          const completedIds = completions.map((c: any) => String(c.challenge_activity_id));
          setTodayCompleted(new Set(completedIds));
          if (__DEV__) console.log('📊 [CHALLENGE] Loaded today\'s completions:', completedIds);
        }
      }
    };
    
    loadTodayCompletions();
    
    // Refresh every time we switch to progress tab
    if (selectedTab === 'progress') {
      loadTodayCompletions();
    }
  }, [participantId, selectedTab, getTodayCompletions]);
  
  const handleActivityToggle = async (activityId: string) => {
    if (todayCompleted.has(String(activityId))) {
      // Can't uncomplete for now
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await recordCompletion(participantId, String(activityId));
    if (success) {
      setTodayCompleted(prev => new Set([...prev, String(activityId)]));
    }
  };
  
  const getSelectedActivities = () => {
    if (!myParticipation?.selected_activity_ids || !challenge?.predetermined_activities) {
      return [];
    }

    return challenge.predetermined_activities.filter((act: any) =>
      myParticipation.selected_activity_ids.map(String).includes(String(act.id))
    );
  };
  
  const calculateTodayProgress = () => {
    const selected = getSelectedActivities();
    if (selected.length === 0) return 0;
    
    const completed = selected.filter((act: any) => todayCompleted.has(String(act.id))).length;
    const required = challenge?.config?.required_daily || 3;
    
    return Math.min(100, (completed / required) * 100);
  };
  
  const todayProgress = calculateTodayProgress();
  const selectedActivities = getSelectedActivities();
  
  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsHeader}>
        {/* TODO: Fix and re-enable streaks - See mvpfix.md Issue #1 */}
        {/* <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.statCard}
        >
          <LinearGradient
            colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Flame size={20} color="#FFD700" />
          <Text style={styles.statValue}>{myParticipation?.current_streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </Animated.View> */}

        <Animated.View 
          entering={FadeInDown.delay(200).springify()}
          style={styles.statCard}
        >
          <LinearGradient
            colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <TrendingUp size={20} color="#FFD700" />
          <Text style={styles.statValue}>{myParticipation?.completion_percentage || 0}%</Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={styles.statCard}
        >
          <LinearGradient
            colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Trophy size={20} color="#FFD700" />
          <Text style={styles.statValue}>
            #{leaderboard.findIndex(p => p.user_id === myParticipation?.user_id) + 1 || '-'}
          </Text>
          <Text style={styles.statLabel}>Rank</Text>
        </Animated.View>
      </View>
      
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <Pressable
          style={[styles.tab, selectedTab === 'leaderboard' && styles.tabActive]}
          onPress={() => setSelectedTab('leaderboard')}
        >
          <Text style={[styles.tabText, selectedTab === 'leaderboard' && styles.tabTextActive]}>
            Leaderboard
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.tab, selectedTab === 'progress' && styles.tabActive]}
          onPress={() => setSelectedTab('progress')}
        >
          <Text style={[styles.tabText, selectedTab === 'progress' && styles.tabTextActive]}>
            Today's Progress
          </Text>
        </Pressable>
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'leaderboard' ? (
          <View>
            {/* Leaderboard */}
            {leaderboard.map((participant: any, index: number) => {
              const isMe = participant.user_id === myParticipation?.user_id;
              
              return (
                <Animated.View
                  key={participant.id}
                  entering={FadeInDown.delay(index * 50).springify()}
                  style={[
                    styles.leaderboardItem,
                    isMe && styles.leaderboardItemMe
                  ]}
                >
                  {isMe && (
                    <LinearGradient
                      colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  
                  <View style={styles.leaderboardLeft}>
                    <Text style={[styles.rank, index < 3 && styles.rankTop]}>
                      {index + 1}
                    </Text>
                    <View>
                      <Text style={styles.leaderboardName}>
                        {participant.profiles?.name || 'Anonymous'}
                        {isMe && ' (You)'}
                      </Text>
                      <View style={styles.leaderboardStats}>
                        <Text style={styles.leaderboardStat}>
                          {participant.completion_percentage || 0}% consistent
                        </Text>
                        <Text style={styles.leaderboardDot}>•</Text>
                        <Text style={styles.leaderboardStat}>
                          {participant.current_streak || 0} day streak
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {index === 0 && <Trophy size={20} color="#FFD700" />}
                  {index === 1 && <Trophy size={20} color="#C0C0C0" />}
                  {index === 2 && <Trophy size={20} color="#CD7F32" />}
                </Animated.View>
              );
            })}
            
            {leaderboard.length === 0 && (
              <View style={styles.emptyLeaderboard}>
                <Users size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>No participants yet</Text>
                <Text style={styles.emptySubtext}>Be the first to join!</Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* Today's Progress Bar */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Today's Completion</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={[styles.progressFill, { width: `${todayProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.floor(todayProgress)}% Complete
              </Text>
              
              {/* Motivational Message */}
              {(() => {
                if (__DEV__) console.log('🎯 [MOTIVATIONAL] Debug info:', {
                  leaderboard: leaderboard.length,
                  myParticipation,
                  myUserId: myParticipation?.user_id,
                  leaderboardUserIds: leaderboard.map(p => p.user_id)
                });
                
                const myIndex = leaderboard.findIndex(p => p.user_id === myParticipation?.user_id);
                const myCompletions = myParticipation?.total_completions || 0;
                
                if (__DEV__) console.log('🎯 [MOTIVATIONAL] Position:', {
                  myIndex,
                  myCompletions,
                  isInLeaderboard: myIndex !== -1
                });
                
                if (myIndex > 0) {
                  // There's someone ahead of us or tied with us
                  const nextPerson = leaderboard[myIndex - 1];
                  const gap = nextPerson.total_completions - myCompletions;
                  const activitiesLeftToday = selectedActivities.filter((act: any) =>
                    !todayCompleted.has(String(act.id))
                  ).length;
                  
                  if (__DEV__) console.log('🎯 [MOTIVATIONAL] Behind/tied with someone:', {
                    nextPerson: nextPerson?.profiles?.name,
                    theirCompletions: nextPerson?.total_completions,
                    gap,
                    activitiesLeftToday
                  });
                  
                  if (gap > 0) {
                    // We're behind
                    if (__DEV__) console.log('🎯 [MOTIVATIONAL] Showing catch-up message');
                    return (
                      <View style={styles.motivationalBox}>
                        <Target size={16} color="#FFD700" />
                        <Text style={styles.motivationalText}>
                          Complete {Math.min(gap, activitiesLeftToday)} more {gap === 1 ? 'activity' : 'activities'} today to overtake{' '}
                          <Text style={styles.motivationalHighlight}>
                            {nextPerson.profiles?.name || 'the next person'}
                          </Text>!
                        </Text>
                      </View>
                    );
                  } else if (gap === 0 && activitiesLeftToday > 0) {
                    // We're tied - one more activity will put us ahead!
                    if (__DEV__) console.log('🎯 [MOTIVATIONAL] Showing tie-breaker message');
                    return (
                      <View style={styles.motivationalBox}>
                        <Target size={16} color="#FFD700" />
                        <Text style={styles.motivationalText}>
                          You're tied with{' '}
                          <Text style={styles.motivationalHighlight}>
                            {nextPerson.profiles?.name || 'the next person'}
                          </Text>! Complete 1 more activity to take the lead!
                        </Text>
                      </View>
                    );
                  }
                } else if (myIndex === 0 && leaderboard.length > 1) {
                  // We're in first place
                  const secondPlace = leaderboard[1];
                  const lead = myCompletions - secondPlace.total_completions;
                  
                  return (
                    <View style={styles.motivationalBox}>
                      <Trophy size={16} color="#FFD700" />
                      <Text style={styles.motivationalText}>
                        You're in 1st place! {lead} {lead === 1 ? 'activity' : 'activities'} ahead of{' '}
                        <Text style={styles.motivationalHighlight}>
                          {secondPlace.profiles?.name || 'the competition'}
                        </Text>
                      </Text>
                    </View>
                  );
                }
                
                if (__DEV__) console.log('🎯 [MOTIVATIONAL] No message to show - not in proper position');
                return null;
              })()}
            </View>
            
            {/* Activities Checklist */}
            <Text style={styles.sectionTitle}>Your Activities</Text>
            {selectedActivities.map((activity: any, index: number) => (
              <Animated.View
                key={activity.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  style={styles.activityItem}
                  onPress={() => handleActivityToggle(String(activity.id))}
                >
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                  </View>

                  {todayCompleted.has(String(activity.id)) ? (
                    <CheckCircle size={24} color="#4CAF50" />
                  ) : (
                    <Circle size={24} color="rgba(255,255,255,0.3)" />
                  )}
                </Pressable>
              </Animated.View>
            ))}
            
            <View style={styles.hint}>
              <Text style={styles.hintText}>
                Complete any {challenge?.config?.required_daily || 3} activities for 100% today!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#FFD700',
  },
  content: {
    flex: 1,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  motivationalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  motivationalText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  motivationalHighlight: {
    color: '#FFD700',
    fontWeight: '600',
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
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hint: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  hintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  leaderboardItemMe: {
    borderColor: 'rgba(255,215,0,0.3)',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    width: 30,
  },
  rankTop: {
    color: '#FFD700',
  },
  leaderboardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  leaderboardStat: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  leaderboardDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
});