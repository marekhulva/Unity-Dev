import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Users, CheckCircle2 } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import type { Challenge, ChallengeWithDetails } from '../../types/challenges.types';
import { ChallengeDetailModal } from './ChallengeDetailModal';
import { ChallengeCompletionModal } from './ChallengeCompletionModal';

type TabType = 'discover' | 'active' | 'completed';

export const ChallengesScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const {
    globalChallenges,
    activeChallenges,
    completedChallenges,
    newlyCompletedChallenge,
    challengesLoading,
    fetchGlobalChallenges,
    fetchMyActiveChallenges,
    fetchMyCompletedChallenges,
    clearCompletionModal,
  } = useStore();

  useEffect(() => {
    fetchGlobalChallenges();
    fetchMyActiveChallenges();
    fetchMyCompletedChallenges();
  }, []);

  const handleChallengePress = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setDetailModalVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailModalVisible(false);
    setSelectedChallengeId(null);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
        onPress={() => setActiveTab('discover')}
      >
        <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
          Discover
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'active' && styles.tabActive]}
        onPress={() => setActiveTab('active')}
      >
        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
          Active
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
          Completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDiscoverTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>🌍</Text>
        <Text style={styles.sectionTitle}>Global Challenges</Text>
      </View>

      {challengesLoading ? (
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 40 }} />
      ) : globalChallenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No challenges available yet</Text>
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
    </View>
  );

  const renderActiveTab = () => (
    <View style={styles.tabContent}>
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

  const renderCompletedTab = () => (
    <View style={styles.tabContent}>
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>Compete, grow, earn badges</Text>
      </View>

      {renderTabBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'discover' && renderDiscoverTab()}
        {activeTab === 'active' && renderActiveTab()}
        {activeTab === 'completed' && renderCompletedTab()}
      </ScrollView>

      <ChallengeDetailModal
        visible={detailModalVisible}
        challengeId={selectedChallengeId}
        onClose={handleCloseDetail}
      />

      <ChallengeCompletionModal
        visible={!!newlyCompletedChallenge}
        challenge={newlyCompletedChallenge}
        onClose={clearCompletionModal}
      />
    </View>
  );
};

const ChallengeCard = ({ challenge, onPress }: { challenge: Challenge; onPress?: () => void }) => (
  <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
    <LinearGradient
      colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.02)']}
      style={styles.cardGradient}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
        <View style={styles.cardHeaderText}>
          <Text style={styles.challengeName}>{challenge.name}</Text>
          <Text style={styles.challengeDuration}>{challenge.duration_days} days</Text>
        </View>
      </View>
      {challenge.description && (
        <Text style={styles.challengeDescription} numberOfLines={2}>
          {challenge.description}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <View style={styles.badgePreview}>
          <Text style={styles.badgeEmoji}>{challenge.badge_emoji}</Text>
          <Text style={styles.badgeName}>{challenge.badge_name}</Text>
        </View>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

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
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
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
        <Text style={styles.completionText}>{completion.toFixed(0)}% Completed</Text>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingTop: 8,
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
  cardHeaderText: {
    flex: 1,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
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
  badgeEmoji: {
    fontSize: 20,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  joinButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFD700',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
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
    backgroundColor: '#FFD700',
  },
  progressText: {
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
  completionText: {
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
});
