import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { LeaderboardEntry } from '../../types/challenges.types';
import { useStore } from '../../state/rootStore';

interface ChallengeStandingsDropdownProps {
  challengeId: string;
  durationDays: number;
  participantCount: number;
}

export const ChallengeStandingsDropdown: React.FC<ChallengeStandingsDropdownProps> = ({
  challengeId,
  durationDays,
  participantCount,
}) => {
  const currentUser = useStore(s => s.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, [challengeId]);

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

  const myEntry = leaderboard.find(e => e.user_id === currentUser?.id);
  const currentDay = myEntry?.current_day
    ? Math.min(myEntry.current_day, durationDays)
    : 1;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#D4AF37" />
      </View>
    );
  }

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const hasPodium = leaderboard.length >= 2;

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentDay}/{durationDays}</Text>
          <Text style={styles.statLabel}>DAY</Text>
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

      {leaderboard.length === 1 && first && (
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
                Day {Math.min(entry.current_day || 1, durationDays)}/{durationDays}
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

      {leaderboard.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No standings yet</Text>
          <Text style={styles.emptySubtext}>Complete activities to appear on the board</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFC84A',
  },
  statLabel: {
    fontSize: 8,
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
    gap: 6,
    paddingBottom: 14,
  },
  podiumSpot: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  podiumSpotFirst: {
    marginTop: -6,
  },
  podiumCrown: {
    fontSize: 14,
    marginBottom: 1,
  },
  podiumAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarGold: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  podiumName: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 70,
    textAlign: 'center',
  },
  podiumBar: {
    width: 70,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    paddingTop: 6,
  },
  podiumBarGold: {
    height: 60,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderBottomWidth: 0,
  },
  podiumBarSilver: {
    height: 44,
    backgroundColor: 'rgba(192,192,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.15)',
    borderBottomWidth: 0,
  },
  podiumBarBronze: {
    height: 32,
    backgroundColor: 'rgba(205,127,50,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(205,127,50,0.15)',
    borderBottomWidth: 0,
  },
  podiumPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  podiumRank: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  singleLeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  divider: {
    height: 1,
    marginBottom: 10,
  },
  allParticipantsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  standingRowCurrent: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  standingRank: {
    width: 20,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  standingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 11,
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
    gap: 5,
  },
  standingName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  standingCrown: {
    fontSize: 10,
  },
  youBadge: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E7B43A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  standingStreak: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 1,
  },
  standingProgressWrap: {
    width: 65,
    alignItems: 'flex-end',
    gap: 3,
  },
  standingPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFC84A',
  },
  standingBar: {
    width: '100%',
    height: 3,
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
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  emptySubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
});
