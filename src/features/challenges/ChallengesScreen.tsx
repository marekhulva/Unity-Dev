import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Users, CheckCircle2, ArrowLeft, Calendar, Target, Crown } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import type { Challenge, ChallengeWithDetails } from '../../types/challenges.types';
import { ChallengeCompletionModal } from './ChallengeCompletionModal';
import { ChallengeLeaderboard } from './ChallengeLeaderboard';
import { JoinChallengeFlow } from './JoinChallengeFlow';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationsModal } from '../notifications/NotificationsModal';
import { ChallengeCard } from './components/ChallengeCard';

type MainTabType = 'discover' | 'active' | 'completed';
type DetailTabType = 'overview' | 'feed' | 'forum';

export const ChallengesScreen = () => {
  const insets = useSafeAreaInsets();
  const [mainTab, setMainTab] = useState<MainTabType>('discover');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTabType>('overview');
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const {
    globalChallenges,
    circleChallenges,
    activeChallenges,
    completedChallenges,
    currentChallenge,
    newlyCompletedChallenge,
    challengesLoading,
    fetchGlobalChallenges,
    fetchAllUserCircleChallenges,
    fetchMyActiveChallenges,
    fetchMyCompletedChallenges,
    fetchDailyActions,
    clearCompletionModal,
    loadChallenge,
  } = useStore();

  useEffect(() => {
    fetchGlobalChallenges();
    fetchAllUserCircleChallenges();
    fetchMyActiveChallenges();
    fetchMyCompletedChallenges();
  }, []);

  useEffect(() => {
    if (selectedChallengeId) {
      loadChallenge(selectedChallengeId);
    }
  }, [selectedChallengeId]);

  const handleChallengePress = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setDetailTab('overview');
  };

  const handleBack = () => {
    setSelectedChallengeId(null);
  };

  const handleMainTabChange = (tab: MainTabType) => {
    setMainTab(tab);
    setSelectedChallengeId(null);
  };

  const renderMainTabs = () => (
    <View style={styles.mainTabBar}>
      <TouchableOpacity
        style={[styles.mainTab, mainTab === 'discover' && styles.mainTabActive]}
        onPress={() => handleMainTabChange('discover')}
      >
        <Text style={[styles.mainTabText, mainTab === 'discover' && styles.mainTabTextActive]}>
          Discover
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.mainTab, mainTab === 'active' && styles.mainTabActive]}
        onPress={() => handleMainTabChange('active')}
      >
        <Text style={[styles.mainTabText, mainTab === 'active' && styles.mainTabTextActive]}>
          Active
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.mainTab, mainTab === 'completed' && styles.mainTabActive]}
        onPress={() => handleMainTabChange('completed')}
      >
        <Text style={[styles.mainTabText, mainTab === 'completed' && styles.mainTabTextActive]}>
          Completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailTabs = () => {
    if (!selectedChallengeId || !currentChallenge) return null;

    const tabs: DetailTabType[] = ['overview', 'feed', 'forum'];

    return (
      <View style={styles.detailTabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.detailTab, detailTab === tab && styles.detailTabActive]}
            onPress={() => setDetailTab(tab)}
          >
            <Text style={[styles.detailTabText, detailTab === tab && styles.detailTabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderChallengeList = () => {
    if (mainTab === 'discover') {
      return (
        <View style={styles.listContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🌍</Text>
            <Text style={styles.sectionTitle}>Global Challenges</Text>
          </View>

          {challengesLoading ? (
            <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
          ) : globalChallenges.length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyTextSmall}>No global challenges available yet</Text>
            </View>
          ) : (
            globalChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={() => handleChallengePress(challenge.id)}
              />
            ))
          )}

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionEmoji}>👥</Text>
            <Text style={styles.sectionTitle}>Circle Challenges</Text>
          </View>

          {circleChallenges.length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyTextSmall}>No circle challenges yet</Text>
              <Text style={styles.emptySubtext}>Join a circle to see their challenges</Text>
            </View>
          ) : (
            circleChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={() => handleChallengePress(challenge.id)}
              />
            ))
          )}
        </View>
      );
    }

    if (mainTab === 'active') {
      return (
        <View style={styles.listContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🌍</Text>
            <Text style={styles.sectionTitle}>Global Challenges</Text>
          </View>

          {challengesLoading ? (
            <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
          ) : activeChallenges.filter(c => c.scope === 'global').length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyTextSmall}>No active global challenges</Text>
            </View>
          ) : (
            activeChallenges
              .filter(c => c.scope === 'global')
              .map(challenge => (
                <ActiveChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => handleChallengePress(challenge.id)}
                />
              ))
          )}

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionEmoji}>👥</Text>
            <Text style={styles.sectionTitle}>Circle Challenges</Text>
          </View>

          {activeChallenges.filter(c => c.scope === 'circle').length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyTextSmall}>No active circle challenges</Text>
            </View>
          ) : (
            activeChallenges
              .filter(c => c.scope === 'circle')
              .map(challenge => (
                <ActiveChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => handleChallengePress(challenge.id)}
                />
              ))
          )}
        </View>
      );
    }

    if (mainTab === 'completed') {
      return (
        <View style={styles.listContent}>
          {challengesLoading ? (
            <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 40 }} />
          ) : completedChallenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color="rgba(255,215,0,0.3)" />
              <Text style={styles.emptyText}>No completed challenges yet</Text>
              <Text style={styles.emptySubtext}>Join a challenge to get started!</Text>
            </View>
          ) : (
            completedChallenges.map(challenge => (
              <CompletedChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={() => handleChallengePress(challenge.id)}
              />
            ))
          )}
        </View>
      );
    }

    return null;
  };

  const [leaderboardFilter, setLeaderboardFilter] = useState<'rank' | 'streak' | 'progress'>('rank');

  const renderDetailContent = () => {
    if (!selectedChallengeId || !currentChallenge) return null;

    const challenge = currentChallenge;
    const isJoined = !!challenge.my_participation;

    if (detailTab === 'overview') {
      const startDate = challenge.start_date
        ? new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Anytime';
      const endDate = challenge.end_date
        ? new Date(challenge.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

      return (
        <View style={styles.detailContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={20} color="#FFD700" />
            <Text style={styles.backText}>Back to list</Text>
          </TouchableOpacity>

          <View style={styles.heroSection}>
            <Text style={styles.emoji}>{challenge.emoji}</Text>
            <Text style={styles.challengeNameDetail}>{challenge.name}</Text>
            {challenge.description && (
              <Text style={styles.description}>{challenge.description}</Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>🗓️ {startDate}{endDate ? ` - ${endDate}` : ''}</Text>
            <Text style={styles.infoText}>👥 {challenge.participant_count || 0} participants</Text>
            <Text style={styles.infoText}>🎯 {challenge.success_threshold}% completion required</Text>
          </View>

          {isJoined && challenge.my_participation && (
            <>
              <View style={styles.progressSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Progress</Text>
                </View>
                <View style={styles.progressCard}>
                  <Text style={styles.progressText}>
                    Day {challenge.my_participation.current_day}/{challenge.duration_days}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${challenge.my_participation.completion_percentage || 0}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {(challenge.my_participation.completion_percentage || 0).toFixed(0)}% Complete
                  </Text>
                  <View style={styles.progressStats}>
                    <Text style={styles.progressStatText}>
                      Rank <Text style={styles.progressStatValue}>#{challenge.my_participation.rank || '—'}</Text>
                    </Text>
                    <Text style={styles.progressStatText}>
                      <Text style={styles.progressStatValue}>Top 5%</Text>
                    </Text>
                    <Text style={styles.progressStatText}>
                      Streak <Text style={styles.progressStatValue}>{challenge.my_participation.current_streak || 0} 🔥</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.checkInButton}>
                <Text style={styles.checkInButtonText}>✅ Check In Now</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.sectionDivider} />

          {(challenge.participant_count || 0) > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
              </View>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, leaderboardFilter === 'rank' && styles.filterChipActive]}
                  onPress={() => setLeaderboardFilter('rank')}
                >
                  <Text style={[styles.filterChipText, leaderboardFilter === 'rank' && styles.filterChipTextActive]}>
                    Rank
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, leaderboardFilter === 'streak' && styles.filterChipActive]}
                  onPress={() => setLeaderboardFilter('streak')}
                >
                  <Text style={[styles.filterChipText, leaderboardFilter === 'streak' && styles.filterChipTextActive]}>
                    Streak
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, leaderboardFilter === 'progress' && styles.filterChipActive]}
                  onPress={() => setLeaderboardFilter('progress')}
                >
                  <Text style={[styles.filterChipText, leaderboardFilter === 'progress' && styles.filterChipTextActive]}>
                    Progress %
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.leaderboardContainer}>
                <ChallengeLeaderboard
                  challengeId={challenge.id}
                  compact={true}
                  maxEntries={5}
                />
              </View>
            </View>
          )}

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Challenge Details</Text>
            </View>
            <View style={styles.detailsCard}>
              <Text style={styles.detailText}>📅 Duration: {challenge.duration_days} days</Text>
              <Text style={styles.detailText}>🗓️ {startDate}{endDate ? ` - ${endDate}` : ''}</Text>
              <Text style={styles.detailText}>🎯 Success: {challenge.success_threshold}% completion</Text>
              <Text style={styles.detailText}>🏆 Badge: {challenge.badge_emoji} {challenge.badge_name}</Text>
              <Text style={styles.detailText}>🎮 Type: {challenge.type === 'streak' ? 'Streak Challenge' : 'Daily Challenge'}</Text>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {challenge.description && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>{challenge.description}</Text>
                </View>
              </View>
              <View style={styles.sectionDivider} />
            </>
          )}

          {challenge.rules && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Rules</Text>
                </View>
                <View style={styles.rulesCard}>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleBullet}>•</Text>
                    <Text style={styles.ruleText}>Complete check-in daily</Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleBullet}>•</Text>
                    <Text style={styles.ruleText}>Maintain consistent streak for best results</Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleBullet}>•</Text>
                    <Text style={styles.ruleText}>Earn badge by completing {challenge.success_threshold}% of days</Text>
                  </View>
                </View>
              </View>
              <View style={styles.sectionDivider} />
            </>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activities Included</Text>
            </View>
            {challenge.predetermined_activities && Array.isArray(challenge.predetermined_activities) && challenge.predetermined_activities.length > 0 ? (
              challenge.predetermined_activities.map((activity: any, index: number) => (
                <View key={activity.id || index} style={styles.activityItem}>
                  <Text style={styles.activityEmoji}>{activity.emoji || '⭐'}</Text>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title || activity.name || 'Activity'}</Text>
                    <Text style={styles.activityFrequency}>{activity.frequency || 'Daily'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyActivityState}>
                <Text style={styles.emptyText}>You'll select your activities when you join</Text>
              </View>
            )}
          </View>

          {!isJoined && (
            <TouchableOpacity style={styles.joinButton} onPress={() => setShowJoinFlow(true)}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (detailTab === 'feed') {
      return (
        <View style={styles.detailContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={20} color="#FFD700" />
            <Text style={styles.backText}>Back to list</Text>
          </TouchableOpacity>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Feed tab coming soon</Text>
            <Text style={styles.emptySubtext}>See activity posts from participants</Text>
          </View>
        </View>
      );
    }

    if (detailTab === 'forum') {
      return (
        <View style={styles.detailContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={20} color="#FFD700" />
            <Text style={styles.backText}>Back to list</Text>
          </TouchableOpacity>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Forum tab coming soon</Text>
            <Text style={styles.emptySubtext}>Discuss tips and motivation</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Challenges</Text>
            {!selectedChallengeId && <Text style={styles.subtitle}>Compete, grow, earn badges</Text>}
          </View>
          <NotificationBell onPress={() => setShowNotifications(true)} />
        </View>
      </View>

      {renderMainTabs()}
      {renderDetailTabs()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {selectedChallengeId ? renderDetailContent() : renderChallengeList()}
      </ScrollView>

      {showJoinFlow && currentChallenge && (
        <JoinChallengeFlow
          challenge={currentChallenge}
          onClose={() => setShowJoinFlow(false)}
          onSuccess={() => {
            setShowJoinFlow(false);
            fetchMyActiveChallenges();
            fetchDailyActions();
          }}
        />
      )}

      <ChallengeCompletionModal
        visible={!!newlyCompletedChallenge}
        challenge={newlyCompletedChallenge}
        onClose={clearCompletionModal}
      />

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
};

const ActiveChallengeCard = ({ challenge, onPress }: { challenge: ChallengeWithDetails; onPress?: () => void }) => {
  const progress = challenge.my_participation?.completion_percentage || 0;
  const currentDay = challenge.my_participation?.current_day || 1;
  const personalEndDate = challenge.my_participation?.personal_end_date;
  const daysRemaining = personalEndDate
    ? Math.max(0, Math.ceil((new Date(personalEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : challenge.duration_days - currentDay + 1;

  return (
    <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
      <LinearGradient
        colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.03)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
          <View style={styles.cardHeaderText}>
            <Text style={styles.challengeName}>{challenge.name}</Text>
            <Text style={styles.challengeDuration}>
              Day {currentDay}/{challenge.duration_days} • {daysRemaining} days left
            </Text>
          </View>
        </View>
        <View style={styles.progressBarSmall}>
          <View style={[styles.progressFillSmall, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressTextSmall}>{progress.toFixed(0)}% Complete</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const CompletedChallengeCard = ({ challenge, onPress }: { challenge: ChallengeWithDetails; onPress?: () => void }) => {
  const badge = challenge.my_participation?.badge_earned || 'gold';
  const completion = challenge.my_participation?.completion_percentage || 0;

  return (
    <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
      <LinearGradient
        colors={['rgba(192,192,192,0.1)', 'rgba(192,192,192,0.02)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
          <View style={styles.cardHeaderText}>
            <Text style={styles.challengeName}>{challenge.name}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeEarnedEmoji}>{challenge.badge_emoji}</Text>
              <Text style={styles.badgeEarnedType}>{badge.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.completionTextSmall}>{completion.toFixed(0)}% Completed</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  mainTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: '#000',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mainTabActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  mainTabTextActive: {
    color: '#FFD700',
  },
  detailTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.1)',
  },
  detailTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  detailTabActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  detailTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  detailTabTextActive: {
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 8,
  },
  detailContent: {
    paddingTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  challengeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  challengeEmoji: {
    fontSize: 40,
  },
  challengeEmojiLarge: {
    fontSize: 36,
  },
  cardHeaderText: {
    flex: 1,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  challengeDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'rgba(255,255,255,0.6)',
  },
  statSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 6,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  challengeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeEmojiSmall: {
    fontSize: 20,
  },
  badgeNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  viewButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFD700',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  progressBarSmall: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  progressTextSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeEarnedEmoji: {
    fontSize: 16,
  },
  badgeEarnedType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  completionTextSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
  emptyStateSmall: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTextSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  challengeNameDetail: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  leaderboardContainer: {
    marginTop: 8,
  },
  badgeCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityFrequency: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyActivityState: {
    padding: 24,
    alignItems: 'center',
  },
  joinButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterChipTextActive: {
    color: '#FFD700',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  progressStatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
  },
  progressStatValue: {
    fontWeight: '600',
    color: '#FFD700',
  },
  checkInButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  detailsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  detailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  descriptionText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  rulesCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleBullet: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});
