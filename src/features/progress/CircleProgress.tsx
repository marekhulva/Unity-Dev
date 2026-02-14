import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { 
  Users, Trophy, Flame, TrendingUp, Award, 
  Zap, Target, AlertCircle, Heart, Swords,
  Clock, Activity, ChevronUp, ChevronDown
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

type LeaderboardView = 'consistency';
type TabView = 'overview' | 'leaderboard' | 'challenges';

interface CircleMember {
  id: string;
  name: string;
  avatar: string;
  consistency: number;
  currentStreak: number;
  momentum: number;
  trend: 'up' | 'down' | 'stable';
  lastActive: string;
  totalActions: number;
  averageTime?: string;
}

// Sample data
const circleMembers: CircleMember[] = [
  { id: '1', name: 'You', avatar: '🦸', consistency: 87, currentStreak: 23, momentum: 85, trend: 'up', lastActive: '2h ago', totalActions: 234, averageTime: '7:00 AM' },
  { id: '2', name: 'Alex', avatar: '🏃', consistency: 92, currentStreak: 30, momentum: 78, trend: 'up', lastActive: 'Just now', totalActions: 312, averageTime: '6:30 AM' },
  { id: '3', name: 'Jordan', avatar: '🧘', consistency: 88, currentStreak: 21, momentum: 92, trend: 'up', lastActive: '1h ago', totalActions: 289, averageTime: '7:15 AM' },
  { id: '4', name: 'Taylor', avatar: '📚', consistency: 76, currentStreak: 5, momentum: 45, trend: 'down', lastActive: '1d ago', totalActions: 156, averageTime: '8:00 AM' },
  { id: '5', name: 'Morgan', avatar: '🎯', consistency: 95, currentStreak: 45, momentum: 88, trend: 'stable', lastActive: '3h ago', totalActions: 402, averageTime: '5:45 AM' },
  { id: '6', name: 'Riley', avatar: '💼', consistency: 81, currentStreak: 12, momentum: 72, trend: 'up', lastActive: '30m ago', totalActions: 198, averageTime: '6:15 AM' },
];

const liveActivities = [
  { user: 'Alex', action: 'completed morning workout', streak: 30, time: 'Just now', emoji: '💪' },
  { user: 'Jordan', action: 'finished meditation', streak: 21, time: '15m ago', emoji: '🧘' },
  { user: 'Riley', action: 'checked in reading habit', streak: 12, time: '30m ago', emoji: '📖' },
  { user: 'Morgan', action: 'hit 45-day streak!', streak: 45, time: '1h ago', emoji: '🔥', milestone: true },
];

const challenges = [
  { id: '1', title: 'Week Warriors', description: 'Complete 100 actions as a group', progress: 67, total: 100, reward: '🏆 Champion Badge', daysLeft: 3 },
  { id: '2', title: 'Early Bird Race', description: 'Most 6AM completions wins', leader: 'Morgan', yourRank: 3, participants: 6, daysLeft: 5 },
  { id: '3', title: 'No Miss March', description: 'Everyone maintains their streak', active: true, atRisk: ['Taylor'], daysLeft: 18 },
];

export const CircleProgress: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabView>('overview');
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>('consistency');
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  
  const pulseAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);

  React.useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    glowAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.05]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.6]),
    shadowRadius: interpolate(glowAnim.value, [0, 1], [10, 25]),
  }));

  // Calculate circle metrics
  const activeToday = circleMembers.filter(m => m.lastActive.includes('ago')).length;
  const totalStreakDays = circleMembers.reduce((sum, m) => sum + m.currentStreak, 0);
  const averageConsistency = Math.round(circleMembers.reduce((sum, m) => sum + m.consistency, 0) / circleMembers.length);
  const strugglingMembers = circleMembers.filter(m => m.trend === 'down' || m.momentum < 50);

  // Sort members for leaderboard
  const getSortedMembers = () => {
    return [...circleMembers].sort((a, b) => b.consistency - a.consistency);
  };

  const sortedMembers = getSortedMembers();
  const yourRank = sortedMembers.findIndex(m => m.name === 'You') + 1;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            {(['overview', 'leaderboard', 'challenges'] as TabView[]).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={[styles.tab, selectedTab === tab && styles.tabActive]}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* OVERVIEW TAB */}
          {selectedTab === 'overview' && (
            <>
              {/* Circle Health Dashboard */}
              <Animated.View style={[styles.healthCard, glowStyle, { shadowColor: '#FFD700' }]}>
                <BlurView intensity={30} tint="dark" style={styles.healthCardInner}>
                  <LinearGradient
                    colors={['rgba(255,215,0,0.1)', 'rgba(192,192,192,0.05)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  
                  <View style={styles.healthHeader}>
                    <Users size={24} color="#FFD700" />
                    <Text style={styles.healthTitle}>Circle Health</Text>
                  </View>

                  <Animated.View style={[styles.healthScore, pulseStyle]}>
                    <LinearGradient
                      colors={['#FFD700', '#F7E7CE']}
                      style={styles.scoreRing}
                    />
                    <View style={styles.scoreInner}>
                      <Text style={styles.scoreNumber}>{averageConsistency}</Text>
                      <Text style={styles.scoreLabel}>Group Score</Text>
                    </View>
                  </Animated.View>

                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Activity size={20} color="#FFD700" />
                      <Text style={styles.metricValue}>{activeToday}/{circleMembers.length}</Text>
                      <Text style={styles.metricLabel}>Active Today</Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <Flame size={20} color="#FF6B6B" />
                      <Text style={styles.metricValue}>{totalStreakDays}</Text>
                      <Text style={styles.metricLabel}>Total Streak Days</Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <Trophy size={20} color="#C0C0C0" />
                      <Text style={styles.metricValue}>23</Text>
                      <Text style={styles.metricLabel}>Group Achievements</Text>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Live Activity Feed */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Zap size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Live Activity</Text>
                  <View style={styles.liveDot} />
                </View>

                <BlurView intensity={25} tint="dark" style={styles.activityCard}>
                  <LinearGradient
                    colors={['rgba(255,215,0,0.05)', 'rgba(192,192,192,0.03)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  
                  {liveActivities.map((activity, index) => (
                    <Animated.View
                      key={index}
                      entering={withSpring}
                      style={[
                        styles.activityItem,
                        activity.milestone && styles.milestoneActivity
                      ]}
                    >
                      <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityText}>
                          <Text style={styles.activityUser}>{activity.user}</Text>
                          {' '}{activity.action}
                        </Text>
                        <View style={styles.activityMeta}>
                          <Text style={styles.activityTime}>{activity.time}</Text>
                          {activity.streak > 20 && (
                            <View style={styles.streakBadge}>
                              <Flame size={10} color="#FFD700" />
                              <Text style={styles.streakText}>{activity.streak}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {activity.milestone && (
                        <Trophy size={16} color="#FFD700" />
                      )}
                    </Animated.View>
                  ))}
                </BlurView>
              </View>

              {/* Members Needing Support */}
              {strugglingMembers.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AlertCircle size={20} color="#FF6B6B" />
                    <Text style={styles.sectionTitle}>Show Support</Text>
                  </View>

                  <BlurView intensity={20} tint="dark" style={styles.supportCard}>
                    <LinearGradient
                      colors={['rgba(255,107,107,0.1)', 'rgba(255,107,107,0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    
                    {strugglingMembers.map(member => (
                      <View key={member.id} style={styles.supportItem}>
                        <Text style={styles.supportAvatar}>{member.avatar}</Text>
                        <View style={styles.supportInfo}>
                          <Text style={styles.supportName}>{member.name}</Text>
                          <Text style={styles.supportStatus}>
                            Momentum {member.momentum}% {member.trend === 'down' ? '📉' : ''}
                          </Text>
                        </View>
                        <Pressable style={styles.supportButton}>
                          <Heart size={16} color="#FFD700" />
                          <Text style={styles.supportButtonText}>Send 💪</Text>
                        </Pressable>
                      </View>
                    ))}
                  </BlurView>
                </View>
              )}
            </>
          )}

          {/* LEADERBOARD TAB */}
          {selectedTab === 'leaderboard' && (
            <>

              {/* Your Rank Card */}
              <BlurView intensity={30} tint="dark" style={styles.rankCard}>
                <LinearGradient
                  colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.rankContent}>
                  <Text style={styles.rankLabel}>Your Rank</Text>
                  <Text style={styles.rankNumber}>#{yourRank}</Text>
                  <Text style={styles.rankSubtext}>out of {circleMembers.length}</Text>
                </View>
              </BlurView>

              {/* Leaderboard List */}
              <View style={styles.leaderboardList}>
                {sortedMembers.map((member, index) => {
                  const isYou = member.name === 'You';
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                  
                  return (
                    <Animated.View
                      key={member.id}
                      entering={withSpring}
                      style={[
                        styles.leaderboardItem,
                        isYou && styles.leaderboardItemYou,
                        index < 3 && styles.leaderboardItemTop
                      ]}
                    >
                      <View style={styles.leaderboardRank}>
                        {medal ? (
                          <Text style={styles.medal}>{medal}</Text>
                        ) : (
                          <Text style={styles.rankText}>#{index + 1}</Text>
                        )}
                      </View>
                      
                      <Text style={styles.leaderboardAvatar}>{member.avatar}</Text>
                      
                      <View style={styles.leaderboardInfo}>
                        <Text style={[styles.leaderboardName, isYou && styles.leaderboardNameYou]}>
                          {member.name}
                        </Text>
                        <View style={styles.leaderboardStats}>
                          {leaderboardView === 'consistency' && (
                            <Text style={styles.leaderboardStat}>{member.consistency}%</Text>
                          )}
                          {leaderboardView === 'streaks' && (
                            <View style={styles.streakStat}>
                              <Flame size={12} color="#FFD700" />
                              <Text style={styles.leaderboardStat}>{member.currentStreak} days</Text>
                            </View>
                          )}
                          {leaderboardView === 'momentum' && (
                            <View style={styles.momentumStat}>
                              <Text style={styles.leaderboardStat}>{member.momentum}%</Text>
                              {member.trend === 'up' && <ChevronUp size={12} color="#06FFA5" />}
                              {member.trend === 'down' && <ChevronDown size={12} color="#FF6B6B" />}
                            </View>
                          )}
                          {leaderboardView === 'early' && (
                            <Text style={styles.leaderboardStat}>{member.averageTime || 'N/A'}</Text>
                          )}
                        </View>
                      </View>
                      
                      {member.trend === 'up' && leaderboardView !== 'momentum' && (
                        <TrendingUp size={16} color="#06FFA5" />
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            </>
          )}

          {/* CHALLENGES TAB */}
          {selectedTab === 'challenges' && (
            <>
              {/* Active Challenges */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Swords size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Active Challenges</Text>
                </View>

                {challenges.map(challenge => (
                  <Pressable
                    key={challenge.id}
                    onPress={() => setSelectedChallenge(
                      selectedChallenge === challenge.id ? null : challenge.id
                    )}
                    style={styles.challengeCard}
                  >
                    <BlurView intensity={25} tint="dark" style={styles.challengeCardInner}>
                      <LinearGradient
                        colors={['rgba(255,215,0,0.08)', 'rgba(192,192,192,0.03)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.challengeHeader}>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        <View style={styles.challengeTimer}>
                          <Clock size={12} color="#C0C0C0" />
                          <Text style={styles.challengeTime}>{challenge.daysLeft}d left</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                      
                      {challenge.progress !== undefined && (
                        <View style={styles.challengeProgress}>
                          <View style={styles.progressBar}>
                            <LinearGradient
                              colors={['#FFD700', '#F7E7CE']}
                              style={[styles.progressFill, { width: `${(challenge.progress / challenge.total) * 100}%` }]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {challenge.progress}/{challenge.total}
                          </Text>
                        </View>
                      )}
                      
                      {challenge.leader && (
                        <Text style={styles.challengeLeader}>
                          Leading: {challenge.leader} • You: #{challenge.yourRank}
                        </Text>
                      )}
                      
                      {challenge.atRisk && challenge.atRisk.length > 0 && (
                        <View style={styles.atRiskContainer}>
                          <AlertCircle size={12} color="#FF6B6B" />
                          <Text style={styles.atRiskText}>
                            At risk: {challenge.atRisk.join(', ')}
                          </Text>
                        </View>
                      )}
                      
                      {challenge.reward && (
                        <View style={styles.rewardContainer}>
                          <Award size={14} color="#FFD700" />
                          <Text style={styles.rewardText}>{challenge.reward}</Text>
                        </View>
                      )}
                    </BlurView>
                  </Pressable>
                ))}
              </View>

              {/* Start New Challenge */}
              <Pressable style={styles.newChallengeButton}>
                <LinearGradient
                  colors={['#FFD700', '#F7E7CE']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.newChallengeText}>⚔️ Start New Challenge</Text>
              </Pressable>
            </>
          )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.1)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#FFD700',
  },

  // Health Card
  healthCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  healthCardInner: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  healthScore: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: 114,
    height: 114,
    borderRadius: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
  },
  scoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06FFA5',
  },

  // Activity Feed
  activityCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  milestoneActivity: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  activityUser: {
    fontWeight: '600',
    color: '#FFD700',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
  },

  // Support Card
  supportCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
    overflow: 'hidden',
    gap: 8,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportAvatar: {
    fontSize: 24,
  },
  supportInfo: {
    flex: 1,
  },
  supportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supportStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  supportButtonText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },

  // Leaderboard
  leaderboardSelector: {
    marginBottom: 16,
    flexGrow: 0,
  },
  leaderboardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.1)',
    marginRight: 8,
  },
  leaderboardChipActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  leaderboardChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  leaderboardChipTextActive: {
    color: '#FFD700',
  },
  rankCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  rankContent: {
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
  },
  rankSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  leaderboardList: {
    gap: 6,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leaderboardItemYou: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  leaderboardItemTop: {
    backgroundColor: 'rgba(255,215,0,0.03)',
  },
  leaderboardRank: {
    width: 30,
    alignItems: 'center',
  },
  medal: {
    fontSize: 20,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  leaderboardAvatar: {
    fontSize: 24,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaderboardNameYou: {
    color: '#FFD700',
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  leaderboardStat: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  streakStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  momentumStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Challenges
  challengeCard: {
    marginBottom: 12,
  },
  challengeCardInner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  challengeTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeTime: {
    fontSize: 11,
    color: '#C0C0C0',
  },
  challengeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  challengeProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  challengeLeader: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  atRiskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  atRiskText: {
    fontSize: 11,
    color: '#FF6B6B',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  rewardText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  newChallengeButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 8,
  },
  newChallengeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});