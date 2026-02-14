import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Trophy, Users, Calendar, Target, Crown } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import type { Challenge } from '../../types/challenges.types';
import { JoinChallengeFlow } from './JoinChallengeFlow';
import { ChallengeLeaderboard } from './ChallengeLeaderboard';
import { ChallengeDashboard } from './ChallengeDashboard';

interface ChallengeDetailModalProps {
  visible: boolean;
  challengeId: string | null;
  onClose: () => void;
}

export const ChallengeDetailModal = ({ visible, challengeId, onClose }: ChallengeDetailModalProps) => {
  const insets = useSafeAreaInsets();
  const { currentChallenge, challengesLoading, loadChallenge, fetchMyActiveChallenges, fetchDailyActions, loadLeaderboard } = useStore();
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (visible && challengeId) {
      loadChallenge(challengeId);
    }
  }, [visible, challengeId]);

  const handleViewProgress = async () => {
    if (challenge?.id && challenge?.my_participation) {
      await loadLeaderboard(challenge.id);
      setShowProgress(true);
    }
  };

  const renderDescriptionBody = (description: string) => {
    const allBlocks = description.split('\n\n');
    if (allBlocks.length <= 1) return null;

    const contentBlocks = allBlocks.slice(1);
    const sections: { header?: string; bullets: string[]; bodyLines: string[] }[] = [];
    let current: { header?: string; bullets: string[]; bodyLines: string[] } | null = null;

    for (const block of contentBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      const first = lines[0];
      const isHeader = /^[A-Z][A-Z\s]+$/.test(first);

      if (isHeader) {
        if (current) sections.push(current);
        const rest = lines.slice(1);
        current = {
          header: first,
          bullets: rest.filter(l => l.startsWith('• ')).map(l => l.slice(2)),
          bodyLines: rest.filter(l => !l.startsWith('• ')),
        };
      } else if (current && current.bullets.length === 0 && current.bodyLines.length === 0) {
        current.bullets = lines.filter(l => l.startsWith('• ')).map(l => l.slice(2));
        current.bodyLines = lines.filter(l => !l.startsWith('• '));
      } else {
        if (current) sections.push(current);
        current = {
          bullets: lines.filter(l => l.startsWith('• ')).map(l => l.slice(2)),
          bodyLines: lines.filter(l => !l.startsWith('• ')),
        };
      }
    }
    if (current) sections.push(current);

    return (
      <>
        <View style={styles.descDividerWrap}>
          <View style={styles.descDividerLine} />
        </View>
        {sections.map((section, idx) => {
          const hasBullets = section.bullets.length > 0;
          const hasBody = section.bodyLines.length > 0;

          if (section.header && hasBullets) {
            return (
              <View key={idx} style={styles.descCard}>
                <LinearGradient
                  colors={['rgba(255,215,0,0.05)', 'rgba(0,0,0,0)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <Text style={styles.descSectionHeader}>{section.header}</Text>
                {section.bullets.map((bullet, i) => {
                  const parts = bullet.split(' — ');
                  return (
                    <View
                      key={i}
                      style={[
                        styles.descActivityRow,
                        i < section.bullets.length - 1 && styles.descActivityRowBorder,
                      ]}
                    >
                      <View style={styles.descGoldDot} />
                      <View style={styles.descActivityContent}>
                        <Text style={styles.descActivityName}>{parts[0]}</Text>
                        {parts[1] && (
                          <Text style={styles.descActivityDetail}>{parts[1]}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          }

          if (section.header && hasBody) {
            return (
              <View key={idx} style={styles.descQuoteSection}>
                <Text style={styles.descSectionHeader}>{section.header}</Text>
                <Text style={styles.descQuoteText}>
                  {section.bodyLines.join(' ')}
                </Text>
              </View>
            );
          }

          if (hasBody) {
            return (
              <View key={idx} style={styles.descCallout}>
                <View style={styles.descCalloutAccent} />
                <Text style={styles.descCalloutText}>
                  {section.bodyLines.join(' ')}
                </Text>
              </View>
            );
          }

          return null;
        })}
      </>
    );
  };

  if (!visible) return null;

  const challenge = currentChallenge;
  const isJoined = !!challenge?.my_participation;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#000', '#000000']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challenge Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {challengesLoading && !challenge ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading challenge...</Text>
          </View>
        ) : challenge ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroSection}>
              <Text style={styles.emoji}>{challenge.emoji}</Text>
              <Text style={styles.challengeName}>{challenge.name}</Text>
              {challenge.description && (
                <Text style={styles.descriptionTagline}>
                  {challenge.description.split('\n\n')[0]}
                </Text>
              )}
            </View>

            {challenge.description && renderDescriptionBody(challenge.description)}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Calendar size={20} color="#FFD700" />
                <Text style={styles.statValue}>{challenge.duration_days}</Text>
                <Text style={styles.statLabel}>Days</Text>
              </View>

              <View style={styles.statBox}>
                <Users size={20} color="#FFD700" />
                <Text style={styles.statValue}>{challenge.participant_count || 0}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </View>

              <View style={styles.statBox}>
                <Target size={20} color="#FFD700" />
                <Text style={styles.statValue}>{challenge.success_threshold}%</Text>
                <Text style={styles.statLabel}>To Pass</Text>
              </View>
            </View>

            {isJoined && challenge.my_participation && (
              <View style={styles.progressCard}>
                <LinearGradient
                  colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.progressCardHeader}>
                  <Trophy size={20} color="#FFD700" />
                  <Text style={styles.progressHeaderText}>Your Progress</Text>
                </View>
                <View style={styles.progressStatsRow}>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>
                      Day {challenge.my_participation.current_day}/{challenge.duration_days}
                    </Text>
                    <Text style={styles.progressStatLabel}>Current Day</Text>
                  </View>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>
                      {Math.round(challenge.my_participation.completion_percentage)}%
                    </Text>
                    <Text style={styles.progressStatLabel}>Complete</Text>
                  </View>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>
                      {challenge.my_participation.current_streak} 🔥
                    </Text>
                    <Text style={styles.progressStatLabel}>Streak</Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${challenge.my_participation.completion_percentage}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {(challenge.participant_count || 0) > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Crown size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Top Participants</Text>
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

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Trophy size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>Badge Reward</Text>
              </View>
              <View style={styles.badgeCard}>
                <Text style={styles.badgeEmoji}>{challenge.badge_emoji}</Text>
                <Text style={styles.badgeName}>{challenge.badge_name}</Text>
                <Text style={styles.badgeDescription}>
                  Complete {challenge.success_threshold}% to earn this badge
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>Daily Activities</Text>
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

            {challenge.rules && Object.keys(challenge.rules).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rules</Text>
                <View style={styles.rulesCard}>
                  {typeof challenge.rules === 'string' ? (
                    <Text style={styles.rulesText}>{challenge.rules}</Text>
                  ) : (
                    Object.entries(challenge.rules).map(([key, value]) => (
                      <Text key={key} style={styles.rulesText}>
                        {'\u2022'} {typeof value === 'string' ? value : String(value)}
                      </Text>
                    ))
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Challenge not found</Text>
          </View>
        )}

        {challenge && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.actionButton, isJoined && styles.actionButtonJoined]}
              onPress={() => {
                if (isJoined) {
                  handleViewProgress();
                } else {
                  setShowJoinFlow(true);
                }
              }}
            >
              <Text style={styles.actionButtonText}>
                {isJoined ? 'View Progress' : 'Join Challenge'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <JoinChallengeFlow
          visible={showJoinFlow}
          challenge={currentChallenge}
          onClose={() => setShowJoinFlow(false)}
          onSuccess={() => {
            setShowJoinFlow(false);
            onClose();
            fetchMyActiveChallenges();
            fetchDailyActions();
          }}
        />

        <Modal
          visible={showProgress}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setShowProgress(false)}
        >
          <View style={styles.progressModalContainer}>
            <LinearGradient
              colors={['#000000', '#000', '#000000']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={[styles.progressHeader, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity onPress={() => setShowProgress(false)} style={styles.closeButton}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <View style={{ width: 40 }} />
            </View>

            {challenge?.my_participation ? (
              <View style={styles.progressContent}>
                <ChallengeDashboard
                  challenge={challenge}
                  participantId={challenge.my_participation.id}
                  myParticipation={challenge.my_participation}
                />
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to load progress</Text>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  challengeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  descriptionTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  descDividerWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  descDividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.35)',
  },
  descCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  descSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 3,
    marginBottom: 16,
  },
  descActivityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  descActivityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  descGoldDot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
    backgroundColor: '#FFD700',
    marginTop: 7,
    marginRight: 14,
  },
  descActivityContent: {
    flex: 1,
  },
  descActivityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  descActivityDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
    lineHeight: 18,
  },
  descQuoteSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  descQuoteText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
  },
  descCallout: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  descCalloutAccent: {
    width: 2,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    marginRight: 14,
  },
  descCalloutText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 22,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,215,0,0.1)',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  leaderboardContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badgeCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,215,0,0.1)',
    gap: 12,
  },
  badgeEmoji: {
    fontSize: 48,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  badgeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  activityEmoji: {
    fontSize: 32,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityFrequency: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyActivityState: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.05)',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  rulesCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rulesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  actionButtonJoined: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  progressCard: {
    marginVertical: 24,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  progressContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
