import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Users, Trophy, Crown, Award, X, ChevronDown, Plus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useStore } from '../../state/rootStore';
import { supabaseService } from '../../services/supabase.service';
import { backendService } from '../../services/backend.service';
import { ProfileScreen } from '../profile/ProfileScreenVision';
import { CircleSelector } from '../circles/components/CircleSelector';
import { JoinCircleModal } from '../social/JoinCircleModal';
import { ChallengeDetailModal } from '../challenges/ChallengeDetailModal';
import { CreateChallengeModal } from '../challenges/CreateChallengeModal';
import { ChallengeCard } from '../challenges/components/ChallengeCard';

export const CircleScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    user,
    userCircles,
    activeCircleId,
    setActiveCircle,
    fetchUserCircles,
    circlesLoading,
    circlesError,
    circleChallenges,
    fetchCircleChallenges,
    challengesLoading,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [circleMembers, setCircleMembers] = useState<any[]>([]);
  const [membersWithStats, setMembersWithStats] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showJoinCircleModal, setShowJoinCircleModal] = useState(false);
  const [showCircleSwitcher, setShowCircleSwitcher] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'members'>('overview');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

  // Use ref to track current request and prevent race conditions
  const currentRequestId = useRef<string | null>(null);

  // Get active circle details from userCircles
  const activeCircle = userCircles.find(c => c.id === activeCircleId);

  const handleMemberPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (__DEV__) console.log('[CircleScreen] Member pressed - userId:', userId, 'currentUserId:', user?.id);
    // Show profile in modal instead of navigating
    setSelectedUserId(userId);
  };

  const calculateMemberStats = useCallback(async () => {
    try {
      // Fetch bulk completion stats for all members in 2 queries instead of 2*N
      const userIds = circleMembers.map(m => m.user_id);
      const bulkStats = await supabaseService.getBulkOverallCompletionStats(userIds);

      const membersWithConsistency = circleMembers.map(member => {
        const stats = bulkStats[member.user_id] || { expected: 0, completed: 0, percentage: 0 };
        if (__DEV__) console.log(`📊 [Circle] Member ${member.display_name}: ${stats.completed}/${stats.expected} = ${stats.percentage}%`);

        return {
          ...member,
          consistencyPercentage: stats.percentage,
          consistencyTrend: 'stable' as const
        };
      });

      setMembersWithStats(membersWithConsistency);
    } catch (error) {
      if (__DEV__) console.error('Error calculating member stats:', error);
      // Set all to 0 if there's an error
      const membersWithConsistency = circleMembers.map(member => ({
        ...member,
        consistencyPercentage: 0,
        consistencyTrend: 'stable' as const
      }));
      setMembersWithStats(membersWithConsistency);
    }
  }, [circleMembers]);

  const loadData = useCallback(async () => {
    if (!activeCircleId) return;

    // Generate unique request ID to prevent race conditions
    const requestId = `${activeCircleId}-${Date.now()}`;
    currentRequestId.current = requestId;

    setIsLoading(true);
    try {
      if (__DEV__) console.log('[CircleScreen] Fetching members for circle:', activeCircleId, 'requestId:', requestId);
      const response = await backendService.getCircleMembers(activeCircleId);

      // Only update state if this is still the current request
      if (currentRequestId.current === requestId) {
        if (response.success && response.data) {
          if (__DEV__) console.log('[CircleScreen] Loaded', response.data.length, 'members (requestId:', requestId, ')');
          setCircleMembers(response.data);
        } else {
          if (__DEV__) console.error('[CircleScreen] Failed to load members:', response);
          setCircleMembers([]);
        }
        setIsLoading(false);
      } else {
        if (__DEV__) console.log('[CircleScreen] Discarding stale response for requestId:', requestId);
      }
    } catch (error) {
      // Only update state if this is still the current request
      if (currentRequestId.current === requestId) {
        if (__DEV__) console.error('[CircleScreen] Error loading members:', error);
        setCircleMembers([]);
        setIsLoading(false);
      }
    }
  }, [activeCircleId]);

  useEffect(() => {
    if (__DEV__) console.log('[CircleScreen] Component mounted, fetching circles');
    fetchUserCircles();
  }, []);

  // Set default activeCircleId when circles load
  useEffect(() => {
    if (userCircles.length > 0 && !activeCircleId) {
      if (__DEV__) console.log('[CircleScreen] Setting default circle to:', userCircles[0].name);
      setActiveCircle(userCircles[0].id);
    }
  }, [userCircles, activeCircleId]);

  // Load data when active circle changes
  useEffect(() => {
    if (activeCircleId) {
      if (__DEV__) console.log('[CircleScreen] Active circle changed, loading data for:', activeCircleId);
      loadData();
    }
  }, [activeCircleId, loadData]);

  useEffect(() => {
    if (circleMembers && circleMembers.length > 0) {
      calculateMemberStats();
    }
  }, [circleMembers, calculateMemberStats]);

  // If not in any circles, show join prompt
  if (!userCircles || userCircles.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CIRCLES</Text>
          <View style={styles.headerUnderline}>
            <LinearGradient
              colors={[
                '#D4AF37',  // Antique gold highlight
                '#C9A050',  // Rich gold
                '#B8860B',  // Dark goldenrod
                '#A0790A',  // Deep gold (no grey)
                '#B8860B',  // Dark goldenrod again
                '#C9A050',  // Rich gold again
                '#D4AF37'   // Antique gold edge
              ]}
              locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Users size={80} color="#FFD700" />
          <Text style={styles.emptyTitle}>Join a Circle</Text>
          <Text style={styles.emptySubtitle}>
            Connect with others and build consistency together
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with integrated circle switcher */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerTitleContainer}
          onPress={() => {
            if (userCircles.length > 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCircleSwitcher(true);
            }
          }}
        >
          <Text style={styles.headerTitle}>
            {activeCircle?.name?.toUpperCase() || 'CIRCLES'}
          </Text>
          {userCircles.length > 1 && (
            <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={styles.headerChevron} />
          )}
        </Pressable>
        <View style={styles.headerUnderline}>
          <LinearGradient
            colors={[
              '#D4AF37',  // Antique gold highlight
              '#C9A050',  // Rich gold
              '#B8860B',  // Dark goldenrod
              '#A0790A',  // Deep gold (no grey)
              '#B8860B',  // Dark goldenrod again
              '#C9A050',  // Rich gold again
              '#D4AF37'   // Antique gold edge
            ]}
            locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </View>
      </View>

      {/* View Tabs */}
      <View style={styles.viewTabs}>
        <Pressable
          style={[styles.viewTab, activeTab === 'overview' && styles.viewTabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('overview');
          }}
        >
          <Text style={[styles.viewTabText, activeTab === 'overview' && styles.viewTabTextActive]}>
            Overview
          </Text>
        </Pressable>

        <Pressable
          style={[styles.viewTab, activeTab === 'challenges' && styles.viewTabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('challenges');
            if (activeCircleId && !circleChallenges.length) {
              fetchCircleChallenges(activeCircleId);
            }
          }}
        >
          <Text style={[styles.viewTabText, activeTab === 'challenges' && styles.viewTabTextActive]}>
            Challenges
          </Text>
        </Pressable>

        <Pressable
          style={[styles.viewTab, activeTab === 'members' && styles.viewTabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('members');
          }}
        >
          <Text style={[styles.viewTabText, activeTab === 'members' && styles.viewTabTextActive]}>
            Members
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Circle Stats Card */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={styles.statsCard}
            >
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(0,0,0,0.3)']}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={24} color="#FFD700" />
                  <Text style={styles.statValue}>{membersWithStats?.length || 0}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>

                <View style={styles.statItem}>
                  <Trophy size={24} color="#FFD700" />
                  <Text style={styles.statValue}>
                    {membersWithStats?.length > 0
                      ? Math.round(
                          membersWithStats.reduce((acc, m) => acc + (m.consistencyPercentage || 0), 0) /
                          membersWithStats.length
                        )
                      : 0}%
                  </Text>
                  <Text style={styles.statLabel}>Avg Consistency</Text>
                </View>
              </View>
            </Animated.View>

            {/* Leaderboard */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>OVERALL LEADERBOARD</Text>
              <Text style={styles.sectionSubtitle}>Based on daily action completion</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#FFD700" />
          ) : membersWithStats.length === 0 ? (
            <View style={styles.emptyLeaderboard}>
              <Users size={48} color="rgba(255,215,0,0.3)" />
              <Text style={styles.emptyLeaderboardTitle}>No members yet</Text>
              <Text style={styles.emptyLeaderboardSubtitle}>
                This circle is waiting for members to join
              </Text>
            </View>
          ) : (
            <View>
              {membersWithStats
                .sort((a, b) => b.consistencyPercentage - a.consistencyPercentage)
                .map((member, index) => {
                const consistency = member.consistencyPercentage || 0;
                const isCurrentUser = member.user_id === user?.id;
                const displayName = member.profiles?.username || member.profiles?.name || 'Unknown User';

                return (
                  <Animated.View
                    key={member.user_id}
                    entering={FadeInDown.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      style={[
                        styles.memberCard,
                        isCurrentUser && styles.currentUserCard
                      ]}
                      onPress={() => handleMemberPress(member.user_id)}
                    >
                      {/* Rank Badge */}
                      <View style={styles.rankContainer}>
                        {index === 0 ? (
                          <Crown size={20} color="#FFD700" />
                        ) : index === 1 ? (
                          <Award size={20} color="#C0C0C0" />
                        ) : index === 2 ? (
                          <Award size={20} color="#CD7F32" />
                        ) : (
                          <Text style={styles.rankNumber}>#{index + 1}</Text>
                        )}
                      </View>

                      {/* User Info */}
                      <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </Text>
                        </View>
                        <Text style={styles.userName} numberOfLines={1}>
                          {displayName} {isCurrentUser && '(You)'}
                        </Text>
                      </View>

                      {/* Consistency Circle */}
                      <View style={styles.consistencyContainer}>
                        <Svg width={50} height={50}>
                          <SvgCircle
                            cx="25"
                            cy="25"
                            r="20"
                            stroke="rgba(192,192,192,0.2)"
                            strokeWidth="4"
                            fill="none"
                          />
                          <SvgCircle
                            cx="25"
                            cy="25"
                            r="20"
                            stroke={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "#888"}
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${(consistency / 100) * 126} 126`}
                            strokeLinecap="round"
                            transform="rotate(-90 25 25)"
                          />
                        </Svg>
                        <View style={styles.percentageContainer}>
                          <Text style={styles.percentageText}>{consistency}%</Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
          </>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <View style={styles.section}>
            {challengesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading challenges...</Text>
              </View>
            ) : circleChallenges.length === 0 ? (
              <View style={styles.emptyLeaderboard}>
                <Trophy size={48} color="rgba(255,215,0,0.3)" />
                <Text style={styles.emptyLeaderboardTitle}>No challenges yet</Text>
                <Text style={styles.emptyLeaderboardSubtitle}>
                  Create the first challenge for this circle
                </Text>
                <Pressable
                  style={styles.createChallengeButton}
                  onPress={() => setShowCreateChallenge(true)}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Plus size={20} color="#000000" />
                  <Text style={styles.createChallengeButtonText}>Create Challenge</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {/* Challenge Cards */}
                {circleChallenges.map((challenge, index) => (
                  <Animated.View
                    key={challenge.id}
                    entering={FadeInDown.delay(index * 100).springify()}
                  >
                    <ChallengeCard
                      challenge={challenge}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallengeId(challenge.id);
                      }}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.section}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading members...</Text>
              </View>
            ) : membersWithStats.length === 0 ? (
              <View style={styles.emptyLeaderboard}>
                <Users size={48} color="rgba(255,215,0,0.3)" />
                <Text style={styles.emptyLeaderboardTitle}>No members yet</Text>
                <Text style={styles.emptyLeaderboardSubtitle}>
                  This circle is waiting for members to join
                </Text>
              </View>
            ) : (
              membersWithStats.map((member, index) => {
                const isCurrentUser = member.user_id === user?.id;
                const displayName = member.profiles?.username || member.profiles?.name || 'Unknown User';

                return (
                  <Animated.View
                    key={member.user_id}
                    entering={FadeInDown.delay(index * 50).springify()}
                  >
                    <Pressable
                      style={[styles.memberListItem, isCurrentUser && styles.currentUserCard]}
                      onPress={() => handleMemberPress(member.user_id)}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </Text>
                      </View>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {displayName} {isCurrentUser && '(You)'}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Profile View Modal - Shows when a member is clicked */}
      {selectedUserId && (
        <Modal
          visible={!!selectedUserId}
          animationType="slide"
          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'fullScreen'}
          transparent={Platform.OS === 'android'}
          onRequestClose={() => setSelectedUserId(null)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Close button - Always show for all profiles */}
            <Pressable
              style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 50 : 20,
                left: 20,
                zIndex: 1000,
                padding: 10,
              }}
              onPress={() => {
                if (__DEV__) console.log('[CircleScreen] Closing profile modal');
                setSelectedUserId(null);
              }}
            >
              <X size={24} color="#FFFFFF" />
            </Pressable>
            <ProfileScreen userId={selectedUserId} isInModal={true} source="Circle" />
          </View>
        </Modal>
      )}

      {/* Join Circle Modal */}
      {showJoinCircleModal && (
        <JoinCircleModal
          visible={showJoinCircleModal}
          onClose={() => setShowJoinCircleModal(false)}
          onSuccess={async () => {
            setShowJoinCircleModal(false);
            await fetchUserCircles();
          }}
        />
      )}

      {/* Challenge Detail Modal */}
      <ChallengeDetailModal
        visible={!!selectedChallengeId}
        challengeId={selectedChallengeId}
        onClose={() => setSelectedChallengeId(null)}
      />

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        visible={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        circleId={activeCircleId || ''}
        circleName={activeCircle?.name || 'Circle'}
        onSuccess={() => {
          setShowCreateChallenge(false);
          fetchCircleChallenges(activeCircleId || '');
        }}
      />

      {/* Circle Switcher Bottom Sheet */}
      <Modal
        visible={showCircleSwitcher}
        transparent
        animationType="none"
        onRequestClose={() => setShowCircleSwitcher(false)}
      >
        <View style={styles.circleSwitcherOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowCircleSwitcher(false)}
          />

          <Animated.View
            entering={FadeInDown.springify().damping(20)}
            style={styles.circleSwitcherSheet}
          >
            <LinearGradient
              colors={['#1a1a1a', '#000']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Switch Circle</Text>
              <Text style={styles.sheetSubtitle}>
                {userCircles.length} {userCircles.length === 1 ? 'circle' : 'circles'} available
              </Text>
            </View>

            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={styles.sheetContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {userCircles.map((circle, index) => {
                const isActive = circle.id === activeCircleId;
                return (
                  <Pressable
                    key={circle.id}
                    style={[styles.circleItem, isActive && styles.circleItemActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveCircle(circle.id);
                      setShowCircleSwitcher(false);
                    }}
                  >
                    {isActive && (
                      <LinearGradient
                        colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}

                    <View style={styles.circleItemContent}>
                      <View style={styles.circleItemLeft}>
                        <Text style={styles.circleEmoji}>{circle.emoji || '👥'}</Text>
                        <View style={styles.circleInfo}>
                          <Text style={styles.circleName}>{circle.name}</Text>
                          {circle.member_count !== undefined && (
                            <Text style={styles.circleMeta}>
                              {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
                            </Text>
                          )}
                        </View>
                      </View>

                      {isActive && (
                        <View style={styles.checkContainer}>
                          <Crown size={20} color="#FFD700" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  headerChevron: {
    marginLeft: 4,
  },

  headerUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: 'hidden',
  },

  circleSwitcherContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#000',
  },

  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 100,
  },
  
  statsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 8,
  },
  
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  section: {
    padding: 20,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  
  currentUserCard: {
    borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: 'rgba(255,215,0,0.05)',
  },
  
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  
  consistencyContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  percentageContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    textAlign: 'center',
  },

  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyLeaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
    marginBottom: 8,
  },

  emptyLeaderboardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  circleSwitcherOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },

  circleSwitcherSheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },

  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  sheetHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  sheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  sheetContent: {
    flex: 1,
  },

  sheetContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  circleItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  circleItemActive: {
    borderColor: 'rgba(255,215,0,0.3)',
  },

  circleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  circleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  circleEmoji: {
    fontSize: 32,
    marginRight: 16,
  },

  circleInfo: {
    flex: 1,
  },

  circleName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  circleMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },

  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000',
    gap: 8,
  },

  viewTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  viewTabActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },

  viewTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },

  viewTabTextActive: {
    color: '#FFD700',
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  challengeCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },

  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  challengeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },

  challengeInfo: {
    flex: 1,
  },

  challengeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  challengeMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  challengeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },

  createChallengeButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },

  createChallengeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },

  createChallengeButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    marginBottom: 16,
  },

  createChallengeButtonSmallText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },

  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
    flex: 1,
  },
});