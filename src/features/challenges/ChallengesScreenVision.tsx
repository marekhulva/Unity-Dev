import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UnityHeader } from '../../components/UnityHeader';
import { Search, Zap, ArrowLeft, Dumbbell, Brain, BookOpen, Apple, Star, Lock } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import type { ChallengeWithDetails } from '../../types/challenges.types';
import { JoinChallengeFlow } from './JoinChallengeFlow';
import { ChallengeLeaderboard } from './ChallengeLeaderboard';

const CATEGORY_GRADIENTS = {
  fitness: ['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)'],
  mindfulness: ['rgba(255, 255, 255, 0.12)', 'rgba(212, 175, 55, 0.08)'],
  productivity: ['rgba(212, 175, 55, 0.15)', 'rgba(255, 255, 255, 0.08)'],
  reading: ['rgba(212, 175, 55, 0.18)', 'rgba(212, 175, 55, 0.1)'],
  nutrition: ['rgba(255, 255, 255, 0.1)', 'rgba(212, 175, 55, 0.12)'],
  default: ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.08)'],
};

const FILTER_CATEGORIES = ['All', '💪 Fitness', '🧘 Mindfulness', '📚 Learning', '🍎 Nutrition', '⚡ Productivity'];

const DIFFICULTY_COLORS = {
  easy: { bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(212, 175, 55, 0.2)', text: 'rgba(255, 255, 255, 0.7)' },
  medium: { bg: 'rgba(212, 175, 55, 0.12)', border: 'rgba(212, 175, 55, 0.3)', text: '#D4AF37' },
  hard: { bg: 'rgba(212, 175, 55, 0.15)', border: 'rgba(212, 175, 55, 0.4)', text: '#FFD700' },
};

const getCategoryFromName = (name: string): keyof typeof CATEGORY_GRADIENTS => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('fit') || lowerName.includes('workout') || lowerName.includes('hard')) return 'fitness';
  if (lowerName.includes('meditat') || lowerName.includes('mind') || lowerName.includes('zen')) return 'mindfulness';
  if (lowerName.includes('product') || lowerName.includes('morning') || lowerName.includes('am')) return 'productivity';
  if (lowerName.includes('read') || lowerName.includes('book') || lowerName.includes('learn')) return 'reading';
  if (lowerName.includes('eat') || lowerName.includes('nutrit') || lowerName.includes('diet')) return 'nutrition';
  return 'default';
};

const getDifficultyFromDuration = (days: number): keyof typeof DIFFICULTY_COLORS => {
  if (days <= 21) return 'easy';
  if (days <= 60) return 'medium';
  return 'hard';
};

const getCategoryEmoji = (name: string): string => {
  const category = getCategoryFromName(name);
  switch (category) {
    case 'fitness': return '💪';
    case 'mindfulness': return '🧘';
    case 'productivity': return '⚡';
    case 'reading': return '📚';
    case 'nutrition': return '🍎';
    default: return '⭐';
  }
};

const getCategoryName = (name: string): string => {
  const category = getCategoryFromName(name);
  switch (category) {
    case 'fitness': return 'Fitness';
    case 'mindfulness': return 'Mindfulness';
    case 'productivity': return 'Productivity';
    case 'reading': return 'Learning';
    case 'nutrition': return 'Nutrition';
    default: return 'Other';
  }
};

const getCategoryIcon = (name: string, size: number = 24) => {
  const category = getCategoryFromName(name);
  const color = '#E7B43A';
  switch (category) {
    case 'fitness': return <Dumbbell size={size} color={color} strokeWidth={2} />;
    case 'mindfulness': return <Brain size={size} color={color} strokeWidth={2} />;
    case 'productivity': return <Zap size={size} color={color} strokeWidth={2} />;
    case 'reading': return <BookOpen size={size} color={color} strokeWidth={2} />;
    case 'nutrition': return <Apple size={size} color={color} strokeWidth={2} />;
    default: return <Star size={size} color={color} strokeWidth={2} />;
  }
};

const ActiveChallengeStatusCard = ({ challenge, onPress }: { challenge: ChallengeWithDetails; onPress?: () => void }) => {
  const progress = challenge.my_participation?.completion_percentage || 0;
  const currentDay = challenge.my_participation?.current_day || 1;
  const daysLeft = challenge.duration_days - currentDay;

  return (
    <Pressable style={styles.activeStatusCard} onPress={onPress}>
      <View style={styles.statusIcon}>
        <LinearGradient
          colors={CATEGORY_GRADIENTS[getCategoryFromName(challenge.name)]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusIconInner}>
            {getCategoryIcon(challenge.name, 22)}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.statusContent}>
        <Text style={styles.statusTitle}>{challenge.name}</Text>
        <Text style={styles.statusSubtitle}>
          Day {currentDay} of {challenge.duration_days} • {daysLeft} days left 🔥
        </Text>
      </View>

      <View style={styles.statusProgress}>
        <View style={styles.statusProgressCircle}>
          <View style={styles.statusProgressInner}>
            <Text style={styles.statusProgressText}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const HeroChallenge = ({ challenge, onPress }: { challenge: ChallengeWithDetails; onPress?: () => void }) => {
  const gradient = CATEGORY_GRADIENTS[getCategoryFromName(challenge.name)];

  return (
    <Pressable style={styles.heroChallenge} onPress={onPress}>
      <LinearGradient
        colors={['rgba(231,180,58,0.15)', 'rgba(255,165,0,0.05)']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>✨ TRENDING</Text>
      </View>

      <View style={styles.heroImage}>
        <LinearGradient
          colors={gradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.95)']}
          style={styles.heroOverlay}
        >
          <Text style={styles.heroTitle}>{challenge.name}</Text>
          <Text style={styles.heroDescription}>
            {challenge.description || 'Join this challenge to transform your life'}
          </Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>👥 {challenge.participant_count || 0} joined</Text>
            <Text style={styles.heroStat}>⏱ {challenge.duration_days} days</Text>
            <Text style={styles.heroStat}>📊 {challenge.success_threshold}% goal</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.heroContent}>
        <View style={styles.difficultyTags}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {getCategoryEmoji(challenge.name)} {getCategoryName(challenge.name)}
            </Text>
          </View>
          <View
            style={[
              styles.difficultyTag,
              {
                backgroundColor: DIFFICULTY_COLORS[getDifficultyFromDuration(challenge.duration_days)].bg,
                borderColor: DIFFICULTY_COLORS[getDifficultyFromDuration(challenge.duration_days)].border,
              },
            ]}
          >
            <Text
              style={[
                styles.difficultyTagText,
                { color: DIFFICULTY_COLORS[getDifficultyFromDuration(challenge.duration_days)].text },
              ]}
            >
              {getDifficultyFromDuration(challenge.duration_days).charAt(0).toUpperCase() +
                getDifficultyFromDuration(challenge.duration_days).slice(1)}
            </Text>
          </View>
          <View style={styles.durationTag}>
            <Text style={styles.durationTagText}>{challenge.duration_days} Days</Text>
          </View>
        </View>

        <Pressable style={styles.joinButton}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.joinButtonText}>Join Challenge →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const ChallengeGridCard = ({ challenge, isActive, onPress }: { challenge: ChallengeWithDetails; isActive?: boolean; onPress?: () => void }) => {
  const gradient = CATEGORY_GRADIENTS[getCategoryFromName(challenge.name)];
  const progress = challenge.my_participation?.completion_percentage || 0;

  return (
    <Pressable style={[styles.challengeCard, isActive && styles.challengeCardActive]} onPress={onPress}>
      <View style={styles.challengeThumbnail}>
        <LinearGradient
          colors={gradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
        <View style={styles.progressOverlay}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.challengeInfo}>
        <Text style={styles.challengeCategory}>
          {getCategoryEmoji(challenge.name)} {getCategoryName(challenge.name).toUpperCase()}
        </Text>
        <Text style={styles.challengeName}>{challenge.name}</Text>
        <View style={styles.challengeMeta}>
          <Text style={styles.metaText}>⏱ {challenge.duration_days} days</Text>
          <Text style={styles.metaText}>
            {getDifficultyFromDuration(challenge.duration_days) === 'easy' && '💚 Easy'}
            {getDifficultyFromDuration(challenge.duration_days) === 'medium' && '⚡ Medium'}
            {getDifficultyFromDuration(challenge.duration_days) === 'hard' && '🔥 Hard'}
          </Text>
        </View>

        <View style={styles.participantsRow}>
          <View style={styles.avatarStack}>
            <LinearGradient colors={['rgba(212, 175, 55, 0.3)', 'rgba(212, 175, 55, 0.15)']} style={styles.miniAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(212, 175, 55, 0.1)']} style={styles.miniAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <LinearGradient colors={['rgba(212, 175, 55, 0.25)', 'rgba(212, 175, 55, 0.12)']} style={styles.miniAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <LinearGradient colors={['rgba(255, 255, 255, 0.12)', 'rgba(212, 175, 55, 0.08)']} style={styles.miniAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          </View>
          <Text style={styles.participantsCount}>+{challenge.participant_count || 0} joined</Text>
        </View>
      </View>
    </Pressable>
  );
};

const LOCKED_CHALLENGES = [
  {
    id: 'locked-75-hard',
    name: '75 HARD Mental Toughness',
    author: 'Andy Frisella',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    duration: '75 days',
    category: 'FITNESS',
  },
  {
    id: 'locked-testosterone',
    name: 'Natural Testosterone Optimization',
    author: 'Dr. Andrew Huberman',
    coverImage: 'https://images.unsplash.com/photo-1583521214690-73421a1829a9',
    duration: '8 weeks',
    category: 'HEALTH',
  },
  {
    id: 'locked-jj-basketball',
    name: "JJ's Elite Basketball Program",
    author: 'JJ Murray',
    coverImage: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0',
    duration: '12 weeks',
    category: 'FITNESS',
  },
];

const LockedChallengeCard = ({ challenge }: { challenge: typeof LOCKED_CHALLENGES[0] }) => (
  <View style={styles.challengeCard}>
    <View style={styles.challengeThumbnail}>
      <Image source={{ uri: challenge.coverImage }} style={StyleSheet.absoluteFillObject} />
      <View style={lockedStyles.overlay} />
      <View style={lockedStyles.lockBadge}>
        <Lock size={16} color="#FFD700" />
        <Text style={lockedStyles.lockText}>LOCKED</Text>
      </View>
    </View>
    <View style={styles.challengeInfo}>
      <Text style={styles.challengeCategory}>{challenge.category}</Text>
      <Text style={[styles.challengeName, { opacity: 0.6 }]}>{challenge.name}</Text>
      <View style={styles.challengeMeta}>
        <Text style={styles.metaText}>⏱ {challenge.duration}</Text>
        <Text style={[styles.metaText, { opacity: 0.5 }]}>by {challenge.author}</Text>
      </View>
    </View>
  </View>
);

export const ChallengesScreenVision = () => {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'feed' | 'forum'>('overview');

  const {
    globalChallenges,
    circleChallenges,
    activeChallenges,
    challengesLoading,
    currentChallenge,
    fetchGlobalChallenges,
    fetchAllUserCircleChallenges,
    fetchMyActiveChallenges,
    loadChallenge,
  } = useStore();

  useEffect(() => {
    // Check if we have cached data
    const hasCachedData = globalChallenges.length > 0 || activeChallenges.length > 0;

    if (hasCachedData) {
      if (__DEV__) console.log('🟢 [CHALLENGES] Using cached data - Global:', globalChallenges.length, 'Active:', activeChallenges.length);
      // Fetch fresh data in background without showing loading state
      Promise.all([
        fetchGlobalChallenges(),
        fetchAllUserCircleChallenges(),
        fetchMyActiveChallenges(),
      ]).then(() => {
        if (__DEV__) console.log('✅ [CHALLENGES] Background refresh complete');
      });
    } else {
      if (__DEV__) console.log('🔄 [CHALLENGES] No cached data, fetching...');
      // First load - will show loading state
      fetchGlobalChallenges();
      fetchAllUserCircleChallenges();
      fetchMyActiveChallenges();
    }
  }, []);

  useEffect(() => {
    if (selectedChallengeId) {
      loadChallenge(selectedChallengeId);
    }
  }, [selectedChallengeId]);

  const handleChallengePress = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setDetailTab('overview'); // Reset to overview when opening
  };

  const handleBack = () => {
    setSelectedChallengeId(null);
    setDetailTab('overview'); // Reset tab when closing
  };

  // Filter and search logic
  const allChallenges = [
    ...globalChallenges,
  ];

  const filteredChallenges = allChallenges.filter(challenge => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = challenge.name.toLowerCase().includes(query);
      const matchesDescription = challenge.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) return false;
    }

    // Category filter
    if (selectedFilter !== 'All') {
      const categoryName = getCategoryName(challenge.name);
      const filterCategory = selectedFilter.split(' ')[1]; // Remove emoji
      if (categoryName !== filterCategory) return false;
    }

    return true;
  });

  const featuredChallenge = filteredChallenges.find(c => c.scope === 'global') || globalChallenges[0];
  const popularChallenges = filteredChallenges.filter(c => c.id !== featuredChallenge?.id).slice(0, 6);

  if (selectedChallengeId && currentChallenge) {
    const challenge = currentChallenge;
    const isJoined = !!challenge.my_participation;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={20} color="#FFD700" />
              <Text style={styles.backText}>Back to challenges</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailHero}>
            <View style={styles.detailIconContainer}>
              {getCategoryIcon(challenge.name, 40)}
            </View>
            <Text style={styles.detailTitle}>{challenge.name}</Text>
            {challenge.description && (
              <Text style={styles.detailDescription}>{challenge.description}</Text>
            )}
          </View>

          {/* Detail section - Feed and Forum tabs hidden until implemented */}

          {/* Challenge Details */}
          {true && (
            <>
              <View style={styles.detailInfoCard}>
                <Text style={styles.detailInfoText}>📅 {challenge.duration_days} days</Text>
                <Text style={styles.detailInfoText}>👥 {challenge.participant_count || 0} joined</Text>
                <Text style={styles.detailInfoText}>🎯 {challenge.success_threshold}% goal</Text>
              </View>

              {isJoined && challenge.my_participation && (
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
              </View>
            </View>
          )}

          {(challenge.participant_count || 0) > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Leaderboard</Text>
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
            </>
          )}

          {/* Feed and Forum tab content removed - not implemented yet */}
        </ScrollView>

        <JoinChallengeFlow
          visible={showJoinFlow}
          challenge={challenge}
          onClose={() => setShowJoinFlow(false)}
          onSuccess={() => {
            setShowJoinFlow(false);
            fetchMyActiveChallenges();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: '#000' }} edges={['top']}>
        <UnityHeader />
      </SafeAreaView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* My Active Challenges (global only — circle challenges show in Circle tab) */}
        {activeChallenges.filter(c => c.scope !== 'circle').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Challenges</Text>
              {activeChallenges.filter(c => c.scope !== 'circle').length > 2 && (
                <Pressable onPress={() => { if (__DEV__) console.log('View all active challenges'); }}>
                  <Text style={styles.sectionLink}>View All →</Text>
                </Pressable>
              )}
            </View>

            {activeChallenges.filter(c => c.scope !== 'circle').slice(0, 2).map((challenge) => (
              <ActiveChallengeStatusCard
                key={challenge.id}
                challenge={challenge}
                onPress={() => handleChallengePress(challenge.id)}
              />
            ))}
          </View>
        )}

        {/* Featured Challenge */}
        {featuredChallenge && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured This Week</Text>
            </View>
            <HeroChallenge challenge={featuredChallenge} onPress={() => handleChallengePress(featuredChallenge.id)} />
          </View>
        )}

        {/* Most Popular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Most Popular'}
            </Text>
            {!searchQuery && (
              <Pressable onPress={() => { if (__DEV__) console.log('View all challenges'); }}>
                <Text style={styles.sectionLink}>See All →</Text>
              </Pressable>
            )}
          </View>

          {challengesLoading ? (
            <ActivityIndicator size="large" color="#E7B43A" style={{ marginTop: 20 }} />
          ) : popularChallenges.length > 0 ? (
            <View style={styles.challengesGrid}>
              {popularChallenges.map((challenge) => (
                <ChallengeGridCard
                  key={challenge.id}
                  challenge={challenge}
                  isActive={activeChallenges.some((ac) => ac.id === challenge.id)}
                  onPress={() => handleChallengePress(challenge.id)}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Coming Soon - Locked Challenges */}
        <View style={styles.section}>
          <View style={styles.challengesGrid}>
            {LOCKED_CHALLENGES.map((challenge) => (
              <LockedChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const lockedStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    paddingBottom: 20,
    backgroundColor: 'rgba(231,180,58,0.03)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Search Bar
  searchContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  searchBar: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 48,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -9 }],
    zIndex: 2,
  },
  filterIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -9 }],
    zIndex: 2,
  },

  // Filter Pills
  filterPills: {
    marginBottom: 16,
  },
  filterPillsContent: {
    gap: 10,
  },
  filterPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: 'rgba(231,180,58,0.18)',
    borderColor: 'rgba(231,180,58,0.6)',
    borderWidth: 1.5,
    shadowColor: '#E7B43A',
    shadowOpacity: 0.2,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  filterPillTextActive: {
    color: '#FFD700',
    fontWeight: '700',
  },

  // Section
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E7B43A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E7B43A',
    letterSpacing: 0.2,
  },

  // Active Challenge Status Card
  activeStatusCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusIconInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 24,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  statusProgress: {
    width: 44,
    height: 44,
  },
  statusProgressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusProgressInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusProgressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E7B43A',
  },

  // Hero Challenge
  heroChallenge: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(231,180,58,0.4)',
    position: 'relative',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    zIndex: 3,
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  heroImage: {
    height: 240,
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 70,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 34,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 18,
    lineHeight: 20,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 24,
  },
  heroStat: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroContent: {
    padding: 16,
  },
  difficultyTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  difficultyTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  durationTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  joinButton: {
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },

  // Challenge Grid
  challengesGrid: {
    gap: 14,
  },
  challengeCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  challengeCardActive: {
    borderColor: 'rgba(231,180,58,0.6)',
    backgroundColor: 'rgba(231,180,58,0.06)',
    borderWidth: 1.5,
  },
  challengeThumbnail: {
    height: 150,
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(231,180,58,0.95)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.6,
  },
  challengeInfo: {
    padding: 18,
  },
  challengeCategory: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  challengeName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 6,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    marginLeft: -8,
  },
  participantsCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  // Detail View Styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  detailHero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  detailEmoji: {
    fontSize: 80,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  detailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(231,180,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  detailDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  detailInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 14,
  },
  detailInfoText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  progressCard: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  leaderboardContainer: {
    marginTop: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    marginHorizontal: 24,
  },
  activityEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  activityFrequency: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  emptyActivityState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  emptyResults: {
    padding: 60,
    alignItems: 'center',
  },
  emptyResultsEmoji: {
    fontSize: 72,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyResultsText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptyResultsSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  clearFiltersButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(231,180,58,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
  },
  clearFiltersText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E7B43A',
    letterSpacing: 0.3,
  },

  // Detail View Tabs
  detailTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  detailTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  detailTabActive: {
    borderBottomColor: '#FFD700',
  },
  detailTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  detailTabTextActive: {
    color: '#FFD700',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    minHeight: 400,
  },
  comingSoon: {
    padding: 60,
    alignItems: 'center',
  },
  comingSoonEmoji: {
    fontSize: 80,
    marginBottom: 28,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  comingSoonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
});
