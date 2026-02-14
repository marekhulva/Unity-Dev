/**
 * CircleScreenVision.tsx
 *
 * CHANGELOG (2026-02-10):
 * - Fixed #10: Removed "Coming Soon" alert from Settings save button
 *   - Settings now auto-save (notification toggles work in real-time)
 *   - Removed fake save button that did nothing
 * - Fixed #12: Added confirmation dialog for Leave Circle action
 *   - User must confirm before leaving (prevents accidental exits)
 *   - Shows circle name + warning about losing access
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { UnityHeader } from '../../components/UnityHeader';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import {
  Users,
  Trophy,
  Crown,
  Award,
  X,
  ChevronDown,
  Plus,
  Settings,
  Search,
  Heart,
  MessageCircle,
  Calendar,
  Target,
  Bell,
  Globe,
  Edit,
  LogOut,
  UserPlus,
  Dumbbell,
  Brain,
  BookOpen,
  Apple,
  Star,
  Zap,
  Lock,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useStore } from '../../state/rootStore';
import { supabaseService } from '../../services/supabase.service';
import { backendService } from '../../services/backend.service';
import { ProfileScreen } from '../profile/ProfileScreenVision';
import { JoinCircleModal } from '../social/JoinCircleModal';
import { ChallengeDetailModal } from '../challenges/ChallengeDetailModal';
import { ChallengeStandingsDropdown } from '../challenges/ChallengeStandingsDropdown';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { CreateCircleModal } from '../social/CreateCircleModal';

type TabType = 'overview' | 'community';
type MemberFilter = 'all' | 'admins' | 'mostActive';

const getChallengeIcon = (name: string, size: number = 24) => {
  const lowerName = (name || '').toLowerCase();
  const color = '#E7B43A';
  if (lowerName.includes('fit') || lowerName.includes('workout') || lowerName.includes('hard')) return <Dumbbell size={size} color={color} strokeWidth={2} />;
  if (lowerName.includes('meditat') || lowerName.includes('mind') || lowerName.includes('zen') || lowerName.includes('detox') || lowerName.includes('mental')) return <Brain size={size} color={color} strokeWidth={2} />;
  if (lowerName.includes('product') || lowerName.includes('morning') || lowerName.includes('am')) return <Zap size={size} color={color} strokeWidth={2} />;
  if (lowerName.includes('read') || lowerName.includes('book') || lowerName.includes('learn')) return <BookOpen size={size} color={color} strokeWidth={2} />;
  if (lowerName.includes('eat') || lowerName.includes('nutrit') || lowerName.includes('diet') || lowerName.includes('sugar')) return <Apple size={size} color={color} strokeWidth={2} />;
  return <Star size={size} color={color} strokeWidth={2} />;
};

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  image_url?: string;
  profiles?: {
    username?: string;
    name?: string;
  };
}

export const CircleScreenVision = () => {
  const insets = useSafeAreaInsets();
  const {
    user,
    userCircles,
    activeCircleId,
    setActiveCircle,
    fetchUserCircles,
    circlesLoading,
    circleChallenges,
    fetchCircleChallenges,
    challengesLoading,
    posts,
    fetchPosts,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [circleMembers, setCircleMembers] = useState<any[]>([]);
  const [membersWithStats, setMembersWithStats] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showJoinCircleModal, setShowJoinCircleModal] = useState(false);
  const [showCreateCircleModal, setShowCreateCircleModal] = useState(false);
  const [showCircleSwitcher, setShowCircleSwitcher] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [expandedStandingsId, setExpandedStandingsId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [myParticipations, setMyParticipations] = useState<Record<string, any>>({});

  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');
  const [memberSearch, setMemberSearch] = useState('');

  const [circlePosts, setCirclePosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    newPosts: true,
    challengeUpdates: true,
  });

  const currentRequestId = useRef<string | null>(null);

  const activeCircle = userCircles.find(c => c.id === activeCircleId);

  const calculateMemberStats = useCallback(async () => {
    try {
      const userIds = circleMembers.map(m => m.user_id);
      if (__DEV__) console.log('🔍 [LEADERBOARD] Circle members:', circleMembers.length, 'User IDs:', userIds);
      const bulkStats = await supabaseService.getBulkOverallCompletionStats(userIds);
      if (__DEV__) console.log('🔍 [LEADERBOARD] Bulk stats received:', Object.keys(bulkStats).length, bulkStats);

      const membersWithConsistency = circleMembers.map(member => {
        const stats = bulkStats[member.user_id] || { expected: 0, completed: 0, percentage: 0 };
        return {
          ...member,
          consistencyPercentage: stats.percentage,
          points: Math.round(stats.percentage * 10 + stats.completed * 5),
        };
      });

      if (__DEV__) console.log('🔍 [LEADERBOARD] Members with stats:', membersWithConsistency.length, membersWithConsistency.map(m => ({ name: m.profiles?.username || m.profiles?.name, points: m.points })));
      setMembersWithStats(membersWithConsistency);
    } catch (error) {
      if (__DEV__) console.error('Error calculating member stats:', error);
      const membersWithConsistency = circleMembers.map(member => ({
        ...member,
        consistencyPercentage: 0,
        points: 0,
      }));
      setMembersWithStats(membersWithConsistency);
    }
  }, [circleMembers]);

  const loadCircleData = useCallback(async () => {
    if (!activeCircleId) return;

    const requestId = `${activeCircleId}-${Date.now()}`;
    currentRequestId.current = requestId;

    setIsLoading(true);
    try {
      if (__DEV__) console.log('🔍 [CIRCLE] Loading circle members for:', activeCircleId);
      const response = await backendService.getCircleMembers(activeCircleId);
      if (__DEV__) console.log('🔍 [CIRCLE] Backend response:', response.success, 'Members count:', response.data?.length);

      if (currentRequestId.current === requestId) {
        if (response.success && response.data) {
          if (__DEV__) console.log('🔍 [CIRCLE] Setting circle members:', response.data.length, response.data.map(m => m.profiles?.username || m.profiles?.name));
          setCircleMembers(response.data);
        } else {
          setCircleMembers([]);
        }
        setIsLoading(false);
      }
    } catch (error) {
      if (currentRequestId.current === requestId) {
        if (__DEV__) console.error('[CircleScreenVision] Error loading members:', error);
        setCircleMembers([]);
        setIsLoading(false);
      }
    }
  }, [activeCircleId]);

  const loadCirclePosts = useCallback(async () => {
    if (!activeCircleId) return;

    setPostsLoading(true);
    try {
      const response = await backendService.getFeed('circle', 20, 0, activeCircleId);
      if (response.success && response.data) {
        setCirclePosts(response.data);
      }
    } catch (error) {
      if (__DEV__) console.error('[CircleScreenVision] Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [activeCircleId]);

  useEffect(() => {
    fetchUserCircles();
  }, []);

  useEffect(() => {
    if (userCircles.length > 0 && !activeCircleId) {
      setActiveCircle(userCircles[0].id);
    }
  }, [userCircles, activeCircleId]);

  // Debounce circle data loading to prevent multiple rapid requests
  useEffect(() => {
    if (!activeCircleId) return;

    const timeoutId = setTimeout(() => {
      loadCircleData();
      fetchCircleChallenges(activeCircleId);
      loadCirclePosts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeCircleId]);

  useEffect(() => {
    if (circleMembers && circleMembers.length > 0) {
      calculateMemberStats();
    }
  }, [circleMembers, calculateMemberStats]);

  useEffect(() => {
    if (circleChallenges.length === 0 || !user) return;
    const fetchParticipations = async () => {
      const participations: Record<string, any> = {};
      for (const c of circleChallenges) {
        const p = await supabaseChallengeService.getMyParticipation(c.id);
        if (p) participations[c.id] = p;
      }
      setMyParticipations(participations);
    };
    fetchParticipations();
  }, [circleChallenges, user]);

  const handleMemberPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUserId(userId);
  };

  const filteredMembers = membersWithStats.filter(member => {
    const displayName = member.profiles?.username || member.profiles?.name || 'Unknown User';

    if (memberSearch && !displayName.toLowerCase().includes(memberSearch.toLowerCase())) {
      return false;
    }

    if (memberFilter === 'all') return true;
    if (memberFilter === 'admins') return member.role === 'admin';
    if (memberFilter === 'mostActive') return (member.consistencyPercentage || 0) > 50;
    return true;
  });

  const sortedLeaderboard = [...membersWithStats].sort((a, b) => b.consistencyPercentage - a.consistencyPercentage);

  if (!userCircles || userCircles.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyStateContainer}>
          <Users size={80} color="#E7B43A" />
          <Text style={styles.emptyStateTitle}>Join a Circle</Text>
          <Text style={styles.emptyStateSubtitle}>
            Connect with others and build consistency together
          </Text>
          <Pressable
            style={styles.emptyStateButton}
            onPress={() => setShowJoinCircleModal(true)}
          >
            <LinearGradient
              colors={['#E7B43A', '#FFD700']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.emptyStateButtonText}>Join Circle</Text>
          </Pressable>
          <Pressable
            style={[styles.emptyStateButtonSecondary, { opacity: 0.45 }]}
            onPress={() => {/* Disabled — coming soon */}}
          >
            <Lock size={14} color="#E7B43A" style={{ marginRight: 6 }} />
            <Text style={styles.emptyStateButtonSecondaryText}>Create Circle</Text>
          </Pressable>
        </View>

        <JoinCircleModal
          visible={showJoinCircleModal}
          onClose={() => setShowJoinCircleModal(false)}
          onSuccess={async () => {
            setShowJoinCircleModal(false);
            await fetchUserCircles();
          }}
        />

        <CreateCircleModal
          visible={showCreateCircleModal}
          onClose={() => setShowCreateCircleModal(false)}
          onSuccess={async () => {
            setShowCreateCircleModal(false);
            await fetchUserCircles();
          }}
        />
      </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <UnityHeader
        rightContent={
          <Pressable
            style={styles.headerButton}
            onPress={() => setShowJoinCircleModal(true)}
          >
            <UserPlus size={20} color="#FFD700" />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Circle Switcher */}
        <Pressable
          style={styles.circleCard}
          onPress={() => {
            if ((userCircles?.length || 0) > 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCircleSwitcher(true);
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.circleNameCentered}>{activeCircle?.name || 'Circle'}</Text>
            <Text style={styles.circleMemberCountCentered}>{activeCircle?.member_count || 0} members</Text>
          </View>
          {(userCircles?.length || 0) > 1 && (
            <ChevronDown size={16} color="#E7B43A" />
          )}
          <Pressable
            style={styles.circleCardBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSettings(true);
            }}
          >
            <Settings size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </Pressable>

        {/* Active Challenges - Top Section */}
        {circleChallenges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              <Pressable onPress={() => setActiveTab('community')}>
                <Text style={styles.sectionLink}>See All →</Text>
              </Pressable>
            </View>
            {circleChallenges.slice(0, 3).map((challenge, index) => {
              const isExpanded = expandedStandingsId === challenge.id;
              const myP = myParticipations[challenge.id];
              const isCompleted = myP?.status === 'completed';
              const isFailed = myP?.status === 'failed';
              const myDay = myP?.current_day || null;
              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  style={isExpanded && styles.challengeCardExpanded}
                >
                  <Pressable
                    style={[styles.challengeCardCompact, isExpanded && styles.challengeCardCompactActive]}
                    onPress={() => setSelectedChallengeId(challenge.id)}
                  >
                    <View style={styles.challengeIconGold}>
                      {getChallengeIcon(challenge.name, 22)}
                    </View>
                    <View style={styles.challengeContent}>
                      <Text style={styles.challengeTitleCompact}>{challenge.name}</Text>
                      <Text style={styles.challengeMeta}>
                        {challenge.duration_days} days • {challenge.participant_count || 0} participants
                      </Text>
                      {isCompleted && (
                        <View style={styles.challengeStatusBadge}>
                          <Text style={styles.challengeStatusText}>Completed</Text>
                        </View>
                      )}
                      {isFailed && (
                        <View style={[styles.challengeStatusBadge, styles.challengeStatusFailed]}>
                          <Text style={[styles.challengeStatusText, styles.challengeStatusTextFailed]}>Challenge Over</Text>
                        </View>
                      )}
                      {!isCompleted && !isFailed && myDay && (
                        <Text style={styles.challengeDayText}>Day {Math.min(myDay, challenge.duration_days)}/{challenge.duration_days}</Text>
                      )}
                    </View>
                    <View style={styles.challengeActions}>
                      {!myP ? (
                        <Pressable
                          style={styles.joinBtn}
                          onPress={() => setSelectedChallengeId(challenge.id)}
                        >
                          <Text style={styles.joinBtnText}>Join</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={[styles.standingsBtn, isExpanded && styles.standingsBtnActive]}
                          onPress={() => setExpandedStandingsId(isExpanded ? null : challenge.id)}
                        >
                          <Trophy size={14} color="#D4AF37" />
                          <Text style={styles.standingsBtnText}>Standings</Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                  {isExpanded && (
                    <ChallengeStandingsDropdown
                      challengeId={challenge.id}
                      durationDays={challenge.duration_days}
                      participantCount={challenge.participant_count || 0}
                    />
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Tab Buttons */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('overview');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'community' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('community');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
              Community
            </Text>
          </Pressable>
        </View>

        {activeTab === 'overview' && (
          <View style={styles.pageContent}>
            {/* Recent Activity - commented out for now
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {postsLoading ? (
                <ActivityIndicator size="large" color="#E7B43A" style={{ marginVertical: 40 }} />
              ) : circlePosts.length === 0 ? (
                <View style={styles.emptyActivity}>
                  <MessageCircle size={48} color="rgba(231,180,58,0.3)" />
                  <Text style={styles.emptyActivityText}>No activity yet</Text>
                  <Text style={styles.emptyActivitySubtext}>Be the first to post!</Text>
                </View>
              ) : (
                <View style={styles.journeyTimeline}>
                  <LinearGradient
                    colors={['#E7B43A', 'rgba(231,180,58,0)']}
                    style={styles.timelineLine}
                  />

                  {circlePosts.slice(0, 3).map((post, index) => {
                    const isFirstPost = index === 0;
                    const hasPhoto = post.media_url || post.image_url;
                    const userName = post.profiles?.username || post.profiles?.name || 'Member';

                    return (
                      <View key={post.id} style={styles.timelineEvent}>
                        <View style={isFirstPost ? styles.timelineMilestone : styles.timelineDot}>
                          {isFirstPost && <Text style={styles.milestoneIcon}>🏆</Text>}
                        </View>

                        <View style={styles.timelineContent}>
                          <View style={styles.timelineUserHeader}>
                            <View style={styles.timelineUserAvatar}>
                              <Text style={styles.timelineUserAvatarText}>
                                {userName.substring(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.timelineUserInfo}>
                              <Text style={styles.timelineUserName}>{userName}</Text>
                              <Text style={styles.timelineDate}>
                                {new Date(post.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>

                          {hasPhoto ? (
                            <View style={styles.timelinePhoto}>
                              <Image
                                source={{ uri: post.media_url || post.image_url }}
                                style={styles.photoImage}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                              />
                              <View style={styles.photoBadge}>
                                <Text style={styles.photoBadgeText}>Day {index + 1} 📸</Text>
                              </View>
                              <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.85)']}
                                style={styles.photoOverlay}
                              >
                                <Text style={styles.photoTitle}>{post.action_title || post.content}</Text>
                                {post.goal_title && (
                                  <View style={styles.photoMetrics}>
                                    <Text style={styles.metricText}>🎯 {post.goal_title}</Text>
                                  </View>
                                )}
                              </LinearGradient>
                            </View>
                          ) : (
                            <View style={styles.timelineText}>
                              <Text style={styles.timelineTitle}>
                                {post.action_title || post.content || 'Post'}
                              </Text>
                              {post.content && post.action_title && (
                                <Text style={styles.timelineReflection}>{post.content}</Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
            */}

            {membersWithStats.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top Performers</Text>
                  <Pressable onPress={() => setActiveTab('community')}>
                    <Text style={styles.sectionLink}>View Full Leaderboard →</Text>
                  </Pressable>
                </View>
                <View style={styles.podium}>
                  {sortedLeaderboard.slice(0, 3).map((member, index) => {
                    const displayName = member.profiles?.username || member.profiles?.name || 'User';
                    return (
                      <Pressable
                        key={member.user_id}
                        style={[styles.podiumPlace, index === 0 && styles.podiumFirst]}
                        onPress={() => handleMemberPress(member.user_id)}
                      >
                        <View style={styles.podiumAvatarWrap}>
                          <View style={[
                            styles.podiumAvatar,
                            index === 0 && styles.podiumAvatarFirst,
                            index === 0 && styles.podiumAvatarGold,
                            index > 0 && styles.podiumAvatarSilver,
                          ]}>
                            <Text style={styles.podiumAvatarText}>
                              {displayName.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.podiumRankBadge, index === 0 && styles.podiumRankBadgeFirst]}>
                            <Text style={[styles.podiumRankText, index === 0 && styles.podiumRankTextFirst]}>
                              {index + 1}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{displayName}</Text>
                        <Text style={styles.podiumPoints}>{member.consistencyPercentage}%</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {membersWithStats.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Members</Text>
                  <Pressable onPress={() => setActiveTab('community')}>
                    <Text style={styles.sectionLink}>View All ({membersWithStats.length}) →</Text>
                  </Pressable>
                </View>
                <View style={styles.membersGrid}>
                  {membersWithStats.slice(0, 8).map((member, index) => {
                    const displayName = member.profiles?.username || member.profiles?.name || 'Unknown';
                    const isAdmin = member.role === 'admin';
                    return (
                      <Pressable
                        key={member.user_id}
                        style={styles.memberGridItem}
                        onPress={() => handleMemberPress(member.user_id)}
                      >
                        <View style={styles.memberGridAvatar}>
                          <Text style={styles.memberGridAvatarText}>
                            {displayName.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.memberGridName} numberOfLines={1}>
                          {displayName.split(' ')[0]}
                        </Text>
                        <Text style={styles.memberGridRole}>
                          {isAdmin ? 'Admin' : 'Member'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'community' && (
          <View style={styles.pageContent}>
            {/* Full Leaderboard Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leaderboard</Text>

              {/* Full Rankings */}
              {isLoading ? (
                <ActivityIndicator size="large" color="#E7B43A" style={{ marginVertical: 40 }} />
              ) : sortedLeaderboard.length === 0 ? (
                <View style={styles.emptyState}>
                  <Trophy size={48} color="rgba(231,180,58,0.3)" />
                  <Text style={styles.emptyText}>No rankings yet</Text>
                </View>
              ) : (
                sortedLeaderboard.map((member, index) => {
                  const displayName = member.profiles?.username || member.profiles?.name || 'User';
                  const isCurrentUser = member.user_id === user?.id;
                  return (
                    <Pressable
                      key={member.user_id}
                      style={[styles.rankingItem, isCurrentUser && styles.rankingItemHighlight]}
                      onPress={() => handleMemberPress(member.user_id)}
                    >
                      <View style={styles.rankNumber}>
                        <Text style={styles.rankNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.rankingAvatar}>
                        <Text style={styles.rankingAvatarText}>
                          {displayName.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rankingInfo}>
                        <Text style={[styles.memberName, isCurrentUser && styles.memberNameHighlight]}>
                          {isCurrentUser ? `You (${displayName})` : displayName}
                        </Text>
                        <Text style={styles.memberStats}>
                          {member.consistencyPercentage}% consistency
                        </Text>
                      </View>
                      <Text style={styles.rankingPoints}>{member.consistencyPercentage}%</Text>
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* All Challenges Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Challenges</Text>

              {/* Challenge Cards */}
              {challengesLoading ? (
                <ActivityIndicator size="large" color="#E7B43A" style={{ marginVertical: 40 }} />
              ) : circleChallenges.length === 0 ? (
                <View style={styles.emptyState}>
                  <Target size={48} color="rgba(231,180,58,0.3)" />
                  <Text style={styles.emptyText}>No challenges found</Text>
                </View>
              ) : (
                circleChallenges.map((challenge, index) => (
                  <Animated.View
                    key={challenge.id}
                    entering={FadeInDown.delay(index * 100).springify()}
                  >
                    <Pressable
                      style={styles.challengeCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallengeId(challenge.id);
                      }}
                    >
                      <View style={styles.challengeCardContent}>
                        <View style={styles.challengeIconGold}>
                          {getChallengeIcon(challenge.name, 22)}
                        </View>
                        <View style={styles.challengeContent}>
                          <Text style={styles.challengeTitle}>{challenge.name}</Text>
                          <Text style={styles.challengeMeta}>
                            {challenge.duration_days} days • {challenge.participant_count || 0} participants
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              )}
            </View>

            {/* All Members Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members ({circleMembers.length})</Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Search size={18} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search members..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={memberSearch}
                  onChangeText={setMemberSearch}
                />
              </View>

              {/* Member Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterPills}
                contentContainerStyle={styles.filterPillsContent}
              >
                {(['all', 'admins', 'mostActive'] as MemberFilter[]).map(filter => (
                  <Pressable
                    key={filter}
                    style={[styles.filterPill, memberFilter === filter && styles.filterPillActive]}
                    onPress={() => setMemberFilter(filter)}
                  >
                    <Text style={[styles.filterPillText, memberFilter === filter && styles.filterPillTextActive]}>
                      {filter === 'all' ? 'All' : filter === 'admins' ? 'Admins' : 'Most Active'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Member List */}
              {isLoading ? (
                <ActivityIndicator size="large" color="#E7B43A" style={{ marginVertical: 40 }} />
              ) : filteredMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color="rgba(231,180,58,0.3)" />
                  <Text style={styles.emptyText}>No members found</Text>
                </View>
              ) : (
                filteredMembers.map((member, index) => {
                  const displayName = member.profiles?.username || member.profiles?.name || 'Unknown';
                  const isAdmin = member.role === 'admin';
                  const isCurrentUser = member.user_id === user?.id;
                  return (
                    <Pressable
                      key={member.user_id}
                      style={styles.memberItem}
                      onPress={() => handleMemberPress(member.user_id)}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {displayName.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>
                            {isCurrentUser ? `You (${displayName})` : displayName}
                          </Text>
                          {isAdmin && (
                            <View style={styles.adminBadge}>
                              <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberStats}>
                          {member.consistencyPercentage || 0}% consistency
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {selectedUserId && (
        <Modal
          visible={!!selectedUserId}
          animationType="slide"
          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'fullScreen'}
          transparent={Platform.OS === 'android'}
          onRequestClose={() => setSelectedUserId(null)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <Pressable
              style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 50 : 20,
                left: 20,
                zIndex: 1000,
                padding: 10,
              }}
              onPress={() => setSelectedUserId(null)}
            >
              <X size={24} color="#FFFFFF" />
            </Pressable>
            <ProfileScreen userId={selectedUserId} isInModal={true} source="Circle" />
          </View>
        </Modal>
      )}

      {/* Circle Switcher Dropdown */}
      <Modal
        visible={showCircleSwitcher}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCircleSwitcher(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowCircleSwitcher(false)}
        >
          <View style={styles.dropdownMenu}>
            {userCircles.map(circle => (
              <Pressable
                key={circle.id}
                style={[
                  styles.dropdownItem,
                  circle.id === activeCircleId && styles.dropdownItemActive
                ]}
                onPress={() => {
                  if (circle.id !== activeCircleId) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setActiveCircle(circle.id);
                  }
                  setShowCircleSwitcher(false);
                }}
              >
                <Text style={styles.dropdownEmoji}>{circle.emoji}</Text>
                <View style={styles.dropdownInfo}>
                  <Text style={styles.dropdownName}>{circle.name}</Text>
                  <Text style={styles.dropdownMeta}>
                    {circle.member_count || 0} members • {circle.active_challenges || 0} challenges
                  </Text>
                </View>
                {circle.id === activeCircleId && (
                  <Text style={styles.dropdownCheck}>✓</Text>
                )}
              </Pressable>
            ))}

            {/* Join Another Circle Button */}
            <Pressable
              style={styles.joinAnotherButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCircleSwitcher(false);
                setShowJoinCircleModal(true);
              }}
            >
              <Plus size={20} color="#FFD700" />
              <Text style={styles.joinAnotherText}>Join Another Circle</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ChallengeDetailModal
        visible={!!selectedChallengeId}
        challengeId={selectedChallengeId}
        onClose={() => setSelectedChallengeId(null)}
      />


      <JoinCircleModal
        visible={showJoinCircleModal}
        onClose={() => setShowJoinCircleModal(false)}
        onSuccess={async () => {
          setShowJoinCircleModal(false);
          await fetchUserCircles();
        }}
      />

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowSettings(false)}
          />
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Settings</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowSettings(false)}>
                <X size={20} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>General</Text>
                <View style={styles.settingItem}>
                  <View style={styles.settingIcon}>
                    <Edit size={16} color="#E7B43A" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Circle Name</Text>
                    <Text style={styles.settingDescription}>{activeCircle?.name}</Text>
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <View style={styles.settingIcon}>
                    <Globe size={16} color="#E7B43A" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Privacy</Text>
                    <Text style={styles.settingValue}>
                      {activeCircle?.is_private ? 'Private' : 'Public'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Pressable
                  style={styles.btnDanger}
                  onPress={() => {
                    if (!activeCircleId || !activeCircle) return;

                    Alert.alert(
                      'Leave Circle?',
                      `Are you sure you want to leave ${activeCircle.name}? You'll lose access to all circle posts and challenges.`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                          onPress: () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          },
                        },
                        {
                          text: 'Leave',
                          style: 'destructive',
                          onPress: async () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            await backendService.leaveCircle(activeCircleId);
                            setShowSettings(false);
                            await fetchUserCircles();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <LogOut size={16} color="#ff4444" />
                  <Text style={styles.btnDangerText}>Leave Circle</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },

  headerButton: {
    padding: 8,
  },

  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    gap: 12,
  },

  circleAvatarRound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  circleAvatarText: {
    fontSize: 18,
  },

  circleNameCentered: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },

  circleMemberCountCentered: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },

  circleCardActions: {
    flexDirection: 'row',
    gap: 8,
  },

  circleCardBtn: {
    padding: 8,
  },

  circleCardBtnText: {
    display: 'none',
  },

  stickyHeader: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  circleTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  circleIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  circleIconSmallText: {
    fontSize: 18,
  },

  circleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  headerBtn: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabNav: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  tabNavContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },

  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  tabItemActive: {
    backgroundColor: 'rgba(231,180,58,0.15)',
  },

  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  tabItemTextActive: {
    color: '#E7B43A',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 100,
  },

  pageContent: {
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
  },

  circleHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  circleIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },

  circleIconLargeText: {
    fontSize: 40,
  },

  circleDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 15,
    lineHeight: 19,
    textAlign: 'center',
  },

  circleStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },

  circleStat: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E7B43A',
  },

  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
    fontSize: 12,
    color: '#E7B43A',
    fontWeight: '600',
  },

  sectionCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },

  btn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },

  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  btnSecondary: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  btnDanger: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
  },

  btnDangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4444',
  },

  challengeCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  challengeActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  joinBtn: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E7B43A',
  },
  standingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  standingsBtnActive: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderColor: 'rgba(212,175,55,0.4)',
  },
  standingsBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4AF37',
  },
  challengeCardExpanded: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.1)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  challengeCardCompactActive: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  challengeStatusBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  challengeStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
  },
  challengeStatusFailed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  challengeStatusTextFailed: {
    color: 'rgba(255,255,255,0.4)',
  },
  challengeDayText: {
    fontSize: 10,
    color: '#E7B43A',
    fontWeight: '600',
    marginTop: 4,
  },

  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  challengeIconText: {
    fontSize: 24,
  },

  challengeIconGold: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(231,180,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  challengeContent: {
    flex: 1,
  },

  challengeTitleCompact: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },

  challengeMeta: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  memberGridItem: {
    width: '22%',
    alignItems: 'center',
  },

  memberGridAvatar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(231,180,58,0.3)',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  },

  memberGridAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E7B43A',
  },

  memberGridName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },

  memberGridRole: {
    fontSize: 9,
    color: '#E7B43A',
    textAlign: 'center',
  },

  activityItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },

  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(231,180,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E7B43A',
  },

  activityUser: {
    flex: 1,
  },

  activityUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },

  activityTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  activityContent: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },

  activityImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },

  activityActions: {
    flexDirection: 'row',
    gap: 15,
  },

  activityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  activityActionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
  },

  emptyActivitySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },

  filterPills: {
    marginBottom: 15,
  },

  filterPillsContent: {
    gap: 8,
  },

  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  filterPillActive: {
    backgroundColor: 'rgba(231,180,58,0.15)',
    borderColor: 'rgba(231,180,58,0.3)',
  },

  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  filterPillTextActive: {
    color: '#E7B43A',
  },

  challengeCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },

  challengeImage: {
    height: 120,
    position: 'relative',
    overflow: 'hidden',
  },

  challengeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  challengeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E7B43A',
  },

  challengeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 40,
    paddingHorizontal: 15,
    paddingBottom: 12,
  },

  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },

  challengeCreator: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  challengeInfo: {
    padding: 15,
  },

  challengeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 19,
    marginBottom: 12,
  },

  challengeStats: {
    flexDirection: 'row',
    gap: 15,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statItemText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  statItemValue: {
    color: '#E7B43A',
    fontWeight: '600',
  },

  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },

  searchBar: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
    color: '#fff',
    fontSize: 14,
  },

  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 2,
  },

  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },

  rankBadgeTop: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  rankBadgeTopText: {
    fontSize: 16,
  },

  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(231,180,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E7B43A',
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },

  memberStats: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  pointsBadge: {
    backgroundColor: 'rgba(231,180,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },

  pointsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E7B43A',
  },

  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },

  memberRoleBadge: {
    backgroundColor: 'rgba(231,180,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },

  memberRoleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E7B43A',
    textTransform: 'uppercase',
  },

  memberAction: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
  },

  podiumSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E7B43A',
    marginBottom: 4,
  },

  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },

  rankingItemCurrent: {
    backgroundColor: 'rgba(231,180,58,0.08)',
    borderColor: 'rgba(231,180,58,0.3)',
  },

  rankNumber: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },

  rankingPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E7B43A',
  },

  fab: {
    position: 'absolute',
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },

  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
  },

  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },

  emptyStateButton: {
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },

  emptyStateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },

  emptyStateButtonSecondary: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  emptyStateButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-start',
    padding: 20,
  },

  modalContent: {
    maxWidth: 420,
    width: '100%',
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  modalClose: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBody: {
    padding: 20,
  },

  settingsSection: {
    marginBottom: 24,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    gap: 12,
  },

  settingIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(231,180,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingInfo: {
    flex: 1,
  },

  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },

  settingDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  settingValue: {
    fontSize: 13,
    color: '#E7B43A',
    fontWeight: '600',
  },

  settingArrow: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
  },

  toggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    position: 'relative',
  },

  toggleSwitchActive: {
    backgroundColor: '#E7B43A',
  },

  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    position: 'absolute',
    top: 2,
    left: 2,
  },

  toggleKnobActive: {
    left: 22,
  },

  circleInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  circleTitleInfo: {
    flex: 1,
  },

  circleMemberCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 20,
  },

  dropdownMenu: {
    backgroundColor: 'rgba(20,20,20,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
    borderRadius: 16,
    padding: 8,
    maxHeight: '60%',
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },

  dropdownItemActive: {
    backgroundColor: 'rgba(231,180,58,0.15)',
  },

  dropdownEmoji: {
    fontSize: 28,
  },

  dropdownInfo: {
    flex: 1,
  },

  dropdownName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },

  dropdownMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  dropdownCheck: {
    fontSize: 20,
    color: '#E7B43A',
  },

  joinAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,215,0,0.05)',
  },

  joinAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },

  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: 'rgba(231,180,58,0.2)',
  },

  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },

  tabTextActive: {
    color: '#E7B43A',
  },

  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    paddingVertical: 20,
  },

  podiumPlace: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 100,
  },

  podiumFirst: {
    transform: [{ scale: 1.08 }],
  },

  podiumAvatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },

  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  podiumAvatarFirst: {
    width: 62,
    height: 62,
  },

  podiumAvatarGold: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },

  podiumAvatarSilver: {
    borderColor: 'rgba(255,255,255,0.15)',
  },

  podiumRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  podiumRankBadgeFirst: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },

  podiumRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
  },

  podiumRankTextFirst: {
    color: '#000',
  },

  podiumAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E7B43A',
  },

  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },

  podiumPoints: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },

  // Timeline (My Journey style for Recent Activity)
  journeyTimeline: {
    position: 'relative',
    paddingLeft: 30,
  },
  timelineLine: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    width: 2,
  },
  timelineEvent: {
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -22,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E7B43A',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  timelineMilestone: {
    position: 'absolute',
    left: -26,
    top: 0,
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#E7B43A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  milestoneIcon: {
    fontSize: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  timelineUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(231,180,58,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
  },
  timelineUserAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E7B43A',
  },
  timelineUserInfo: {
    flex: 1,
  },
  timelineUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  timelinePhoto: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.15)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E7B43A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  photoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingTop: 40,
  },
  photoDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  photoMetrics: {
    flexDirection: 'row',
    gap: 10,
  },
  metricText: {
    fontSize: 11,
    color: '#E7B43A',
    fontWeight: '600',
  },
  timelineText: {
    backgroundColor: 'rgba(231,180,58,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.1)',
  },
  timelineDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  timelineReflection: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
});
