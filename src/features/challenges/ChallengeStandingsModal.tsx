import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { LeaderboardEntry } from '../../types/challenges.types';
import { useStore } from '../../state/rootStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChallengeStandingsModalProps {
  visible: boolean;
  onClose: () => void;
  challengeId: string;
  challengeName: string;
  challengeEmoji: string;
  durationDays: number;
  participantCount: number;
}

export const ChallengeStandingsModal: React.FC<ChallengeStandingsModalProps> = ({
  visible,
  onClose,
  challengeId,
  challengeName,
  challengeEmoji,
  durationDays,
  participantCount,
}) => {
  const currentUser = useStore(s => s.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && challengeId) {
      loadStandings();
    }
  }, [visible, challengeId]);

  const loadStandings = async () => {
    try {
      setLoading(true);
      const data = await supabaseChallengeService.getLeaderboard(challengeId, {
        filter: 'all',
        sort: 'rank',
      });
      setLeaderboard(data);
    } catch (error) {
      if (__DEV__) console.error('[Standings] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (entry: LeaderboardEntry) => {
    const name = entry.name || entry.username || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.user_id === currentUser?.id) return 'You';
    return entry.name || entry.username || 'User';
  };

  const isCurrentUser = (entry: LeaderboardEntry) => entry.user_id === currentUser?.id;

  const avgCompletion = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((sum, e) => sum + (e.completion_percentage || 0), 0) / leaderboard.length)
    : 0;

  const activeCount = leaderboard.filter(e => (e.completion_percentage || 0) > 0).length;

  const currentDay = leaderboard.length > 0
    ? Math.max(...leaderboard.map(e => e.completed_days || 0), 1)
    : 1;

  if (!visible) return null;

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const hasPodium = leaderboard.length >= 2;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Drag Handle */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerEmoji}>
              <Text style={styles.headerEmojiText}>{challengeEmoji}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>{challengeName}</Text>
              <Text style={styles.headerMeta}>
                Day {currentDay} of {durationDays} • {participantCount} participants
              </Text>
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{currentDay}</Text>
                <Text style={styles.statLabel}>DAYS IN</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>ACTIVE</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgCompletion}%</Text>
                <Text style={styles.statLabel}>AVG RATE</Text>
              </View>
            </View>

            {/* Podium */}
            {hasPodium && (
              <View style={styles.podium}>
                {/* 2nd Place */}
                {second && (
                  <View style={styles.podiumSpot}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarSilver]}>
                      <Text style={[styles.podiumAvatarText, { color: '#C0C0C0' }]}>
                        {getInitials(second)}
                      </Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{getDisplayName(second)}</Text>
                    <View style={[styles.podiumBar, styles.podiumBarSilver]}>
                      <Text style={[styles.podiumPct, { color: '#C0C0C0' }]}>
                        {Math.round(second.completion_percentage || 0)}%
                      </Text>
                    </View>
                    <Text style={[styles.podiumRank, { color: '#C0C0C0' }]}>2ND</Text>
                  </View>
                )}

                {/* 1st Place */}
                {first && (
                  <View style={[styles.podiumSpot, styles.podiumSpotFirst]}>
                    <Text style={styles.podiumCrown}>👑</Text>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarGold]}>
                      <Text style={[styles.podiumAvatarText, { color: '#D4AF37' }]}>
                        {getInitials(first)}
                      </Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{getDisplayName(first)}</Text>
                    <View style={[styles.podiumBar, styles.podiumBarGold]}>
                      <Text style={[styles.podiumPct, { color: '#D4AF37' }]}>
                        {Math.round(first.completion_percentage || 0)}%
                      </Text>
                    </View>
                    <Text style={[styles.podiumRank, { color: '#D4AF37' }]}>1ST</Text>
                  </View>
                )}

                {/* 3rd Place */}
                {third ? (
                  <View style={styles.podiumSpot}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarBronze]}>
                      <Text style={[styles.podiumAvatarText, { color: '#CD7F32' }]}>
                        {getInitials(third)}
                      </Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{getDisplayName(third)}</Text>
                    <View style={[styles.podiumBar, styles.podiumBarBronze]}>
                      <Text style={[styles.podiumPct, { color: '#CD7F32' }]}>
                        {Math.round(third.completion_percentage || 0)}%
                      </Text>
                    </View>
                    <Text style={[styles.podiumRank, { color: '#CD7F32' }]}>3RD</Text>
                  </View>
                ) : (
                  <View style={styles.podiumSpot}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarEmpty]}>
                      <Text style={styles.podiumAvatarText}>—</Text>
                    </View>
                    <Text style={styles.podiumName}>—</Text>
                    <View style={[styles.podiumBar, styles.podiumBarBronze]}>
                      <Text style={[styles.podiumPct, { color: 'rgba(255,255,255,0.15)' }]}>—</Text>
                    </View>
                    <Text style={[styles.podiumRank, { color: 'rgba(255,255,255,0.15)' }]}>3RD</Text>
                  </View>
                )}
              </View>
            )}

            {/* Single participant */}
            {leaderboard.length === 1 && (
              <View style={styles.singleLeader}>
                <Text style={styles.podiumCrown}>👑</Text>
                <View style={[styles.podiumAvatar, styles.podiumAvatarGold]}>
                  <Text style={[styles.podiumAvatarText, { color: '#D4AF37' }]}>
                    {getInitials(first)}
                  </Text>
                </View>
                <Text style={[styles.podiumName, { marginTop: 6 }]}>{getDisplayName(first)}</Text>
                <Text style={[styles.podiumPct, { color: '#D4AF37', marginTop: 4 }]}>
                  {Math.round(first.completion_percentage || 0)}%
                </Text>
              </View>
            )}

            {/* Divider + All Participants */}
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
            <Text style={styles.allParticipantsLabel}>ALL PARTICIPANTS</Text>

            {/* Full list */}
            <View style={styles.listSection}>
              {leaderboard.map((entry) => {
                const isCurrent = isCurrentUser(entry);
                const isLow = (entry.completion_percentage || 0) < 30;
                const rankColor = entry.rank === 1 ? '#D4AF37'
                  : entry.rank === 2 ? '#C0C0C0'
                  : entry.rank === 3 ? '#CD7F32'
                  : 'rgba(255,255,255,0.25)';

                return (
                  <View
                    key={entry.user_id}
                    style={[styles.standingRow, isCurrent && styles.standingRowCurrent]}
                  >
                    <Text style={[styles.standingRank, { color: rankColor }]}>{entry.rank}</Text>
                    <View style={[
                      styles.standingAvatar,
                      entry.rank === 1 && styles.standingAvatarFirst,
                    ]}>
                      <Text style={[
                        styles.standingAvatarText,
                        entry.rank === 1 && { color: '#D4AF37' },
                      ]}>
                        {getInitials(entry)}
                      </Text>
                    </View>
                    <View style={styles.standingInfo}>
                      <View style={styles.standingNameRow}>
                        <Text style={styles.standingName}>{getDisplayName(entry)}</Text>
                        {entry.rank === 1 && <Text style={styles.standingCrown}>👑</Text>}
                        {isCurrent && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>YOU</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.standingStreak}>
                        {entry.current_streak > 0 ? `${entry.current_streak} day streak 🔥` : 'No streak'}
                      </Text>
                    </View>
                    <View style={styles.standingProgressWrap}>
                      <Text style={styles.standingPct}>
                        {Math.round(entry.completion_percentage || 0)}%
                      </Text>
                      <View style={styles.standingBar}>
                        <View style={[
                          styles.standingBarFill,
                          isLow && styles.standingBarFillLow,
                          { width: `${Math.max(entry.completion_percentage || 0, 2)}%` },
                        ]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Empty state */}
            {leaderboard.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No standings yet</Text>
                <Text style={styles.emptySubtext}>Complete activities to appear on the board</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 0,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmojiText: {
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFC84A',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  podiumSpot: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  podiumSpotFirst: {
    marginTop: -8,
  },
  podiumCrown: {
    fontSize: 16,
    marginBottom: 2,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarGold: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  podiumAvatarSilver: {
    backgroundColor: 'rgba(192,192,192,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(192,192,192,0.25)',
  },
  podiumAvatarBronze: {
    backgroundColor: 'rgba(205,127,50,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(205,127,50,0.25)',
  },
  podiumAvatarEmpty: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  podiumAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  podiumName: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumBar: {
    width: 80,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    paddingTop: 8,
  },
  podiumBarGold: {
    height: 72,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderBottomWidth: 0,
  },
  podiumBarSilver: {
    height: 52,
    backgroundColor: 'rgba(192,192,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.15)',
    borderBottomWidth: 0,
  },
  podiumBarBronze: {
    height: 40,
    backgroundColor: 'rgba(205,127,50,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(205,127,50,0.15)',
    borderBottomWidth: 0,
  },
  podiumPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  podiumRank: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  singleLeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  allParticipantsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  listSection: {
    paddingHorizontal: 20,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  standingRowCurrent: {
    backgroundColor: 'rgba(212,175,55,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderBottomWidth: 0,
  },
  standingRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  standingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standingAvatarFirst: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  standingAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  standingInfo: {
    flex: 1,
    minWidth: 0,
  },
  standingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standingName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  standingCrown: {
    fontSize: 12,
  },
  youBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  standingStreak: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  standingProgressWrap: {
    width: 80,
    alignItems: 'flex-end',
    gap: 4,
  },
  standingPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFC84A',
  },
  standingBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  standingBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#D4AF37',
  },
  standingBarFillLow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.2)',
  },
});
