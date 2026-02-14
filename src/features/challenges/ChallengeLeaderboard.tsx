import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { LeaderboardEntry } from '../../types/challenges.types';
import { supabase } from '../../services/supabase.service';

type FilterType = 'all' | 'friends' | 'circle';
type SortType = 'rank' | 'fastest' | 'perfect';

interface ChallengeLeaderboardProps {
  challengeId: string;
  compact?: boolean;
  maxEntries?: number;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challengeId,
  compact = false,
  maxEntries,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('rank');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();
  }, [challengeId, filter, sort]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await supabaseChallengeService.getLeaderboard(challengeId, {
        filter,
        sort,
        limit: maxEntries,
      });
      setLeaderboard(data);
    } catch (error) {
      if (__DEV__) console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No participants yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={styles.controls}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'friends' && styles.filterButtonActive]}
              onPress={() => setFilter('friends')}
            >
              <Text style={[styles.filterText, filter === 'friends' && styles.filterTextActive]}>
                Friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'circle' && styles.filterButtonActive]}
              onPress={() => setFilter('circle')}
            >
              <Text style={[styles.filterText, filter === 'circle' && styles.filterTextActive]}>
                Circle
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[styles.sortButton, sort === 'rank' && styles.sortButtonActive]}
              onPress={() => setSort('rank')}
            >
              <Text style={[styles.sortText, sort === 'rank' && styles.sortTextActive]}>
                Rank
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sort === 'fastest' && styles.sortButtonActive]}
              onPress={() => setSort('fastest')}
            >
              <Text style={[styles.sortText, sort === 'fastest' && styles.sortTextActive]}>
                Fastest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sort === 'perfect' && styles.sortButtonActive]}
              onPress={() => setSort('perfect')}
            >
              <Text style={[styles.sortText, sort === 'perfect' && styles.sortTextActive]}>
                Perfect
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const medal = getRankMedal(entry.rank);
          const rankColor = getRankColor(entry.rank);
          const isTopThree = entry.rank <= 3;

          return (
            <View
              key={entry.user_id}
              style={[
                styles.entryCard,
                isCurrentUser && styles.currentUserCard,
                isTopThree && styles.topThreeCard,
              ]}
            >
              <View style={styles.rankSection}>
                {medal ? (
                  <Text style={styles.medal}>{medal}</Text>
                ) : (
                  <Text style={[styles.rank, { color: rankColor }]}>#{entry.rank}</Text>
                )}
              </View>

              <View style={styles.userSection}>
                {entry.avatar_url ? (
                  <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {entry.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.username}>
                      {entry.username}
                      {isCurrentUser && ' ⭐'}
                    </Text>
                  </View>
                  {entry.percentile !== undefined && entry.percentile !== null && (
                    <Text style={styles.percentile}>Top {entry.percentile.toFixed(0)}%</Text>
                  )}
                </View>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.completed_days}</Text>
                  <Text style={styles.statLabel}>days</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.completion_percentage.toFixed(0)}%</Text>
                  <Text style={styles.statLabel}>progress</Text>
                </View>
                {entry.current_streak > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.streakValue}>🔥 {entry.current_streak}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  sortText: {
    fontSize: 13,
    color: '#666',
  },
  sortTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currentUserCard: {
    backgroundColor: '#fff9e6',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  topThreeCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankSection: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
  },
  medal: {
    fontSize: 28,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  percentile: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
