import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../state/rootStore';
import { supabaseService } from '../../services/supabase.service';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { LogOut, ChevronRight, Trophy, Target, RefreshCw, Users, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { PushNotificationsService } from '../../services/pushNotifications.service';

// Consistency Circle Component (Memoized for performance)
const ConsistencyCircle = React.memo(({ percentage }: { percentage: number }) => {
  const rotation = (percentage / 100) * 360;

  return (
    <View style={styles.consistencyCircle}>
      <LinearGradient
        colors={['#E7B43A', 'rgba(231,180,58,0.3)']}
        style={[
          styles.consistencyProgress,
          { transform: [{ rotate: `${rotation}deg` }] }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.consistencyInner}>
        <Text style={styles.consistencyText}>{percentage}%</Text>
      </View>
    </View>
  );
});

// Activity Card Component (for What I'm Working On)
const ActivityCard = ({ item, type }: { item: any; type: 'challenge' | 'goal' | 'routine' }) => {
  const getIcon = () => {
    switch (type) {
      case 'challenge': return <Trophy size={20} color="#D4AF37" strokeWidth={2} />;
      case 'goal': return <Target size={20} color="#D4AF37" strokeWidth={2} />;
      case 'routine': return <RefreshCw size={20} color="#D4AF37" strokeWidth={2} />;
    }
  };

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityIcon}>
        {getIcon()}
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activitySubtitle}>
          {type.charAt(0).toUpperCase() + type.slice(1)} • {item.subtitle || 'In progress'}
        </Text>
      </View>

      <ConsistencyCircle percentage={item.consistency || 0} />
    </View>
  );
};

// Circle Card Component (for My Circles section)
const CircleCard = ({ circle }: { circle: any }) => {
  // Deterministic color selection based on circle ID or name
  // Uses black and gold theme with subtle variations
  const getGradientForCircle = (circleId: string, circleName: string) => {
    const gradients = [
      ['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)'],   // Gold
      ['rgba(255, 255, 255, 0.12)', 'rgba(212, 175, 55, 0.08)'], // Silver to gold
      ['rgba(212, 175, 55, 0.15)', 'rgba(255, 255, 255, 0.08)'], // Gold to silver
    ];

    // Create deterministic index from circle ID or name hash
    const hashString = circleId || circleName || '';
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      hash = ((hash << 5) - hash) + hashString.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <View style={styles.circleCard}>
      <View style={styles.circleIcon}>
        <Text style={styles.circleIconText}>🟡</Text>
      </View>

      <View style={styles.circleInfo}>
        <Text style={styles.circleName}>{circle.name}</Text>
        <Text style={styles.circleMeta}>
          {circle.member_count || 0} members
          {circle.active_challenges ? ` • ${circle.active_challenges} active challenge${circle.active_challenges !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>
    </View>
  );
};

interface ProfileScreenProps {
  userId?: string;
  isInModal?: boolean;
  source?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId, isInModal, source }) => {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.user);
  const goals = useStore(s => s.goals);
  const activeChallenges = useStore(s => s.activeChallenges);
  const fetchMyActiveChallenges = useStore(s => s.fetchMyActiveChallenges);
  const following = useStore(s => s.following);
  const followers = useStore(s => s.followers);
  const loadFollowing = useStore(s => s.loadFollowing);
  const logout = useStore(s => s.logout);
  const updateAvatar = useStore(s => s.updateAvatar);

  const isOwnProfile = !userId || userId === currentUser?.id;

  const [profileData, setProfileData] = useState<any>(null);
  const [circles, setCircles] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [showFullJourney, setShowFullJourney] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string>('');

  // Get push token for debugging
  useEffect(() => {
    if (isOwnProfile) {
      Notifications.getExpoPushTokenAsync({
        projectId: '45fa4417-6061-4661-9881-0ee7cf571b4e',
      }).then(tokenData => {
        setPushToken(tokenData.data);
      }).catch(err => {
        console.log('Token error:', err);
      });
    }
  }, [isOwnProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setUploading(true);
      try {
        await updateAvatar(base64Image);
      } finally {
        setUploading(false);
      }
    }
  };

  // Timeline entry type for My Journey
  interface TimelineEntry {
    id: string;
    type: 'post' | 'action';
    date: string;
    post?: any;
    action?: {
      actionId: string;
      title: string;
      goalTitle?: string;
      goalColor?: string;
      completedAt: string;
      streak: number;
      progressDate?: string;
    };
  }

  // Expand daily_progress posts into individual action entries
  const expandTimelineEntries = (posts: any[]): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    posts.forEach(post => {
      if (post.is_daily_progress && post.completed_actions?.length > 0) {
        post.completed_actions.forEach(action => {
          entries.push({
            id: `action-${action.actionId}-${action.completedAt}`,
            type: 'action',
            date: action.completedAt,
            action: {
              ...action,
              progressDate: post.progress_date,
            }
          });
        });
      } else {
        entries.push({
          id: post.id,
          type: 'post',
          date: post.created_at,
          post: post,
        });
      }
    });

    return entries.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Cache for preventing double-fetch on tab switch
  const [dataCache, setDataCache] = useState<{
    circles: any[] | null;
    posts: any[] | null;
    lastFetch: number | null;
  }>({
    circles: null,
    posts: null,
    lastFetch: null,
  });

  // Fetch user circles, posts, and challenges (OPTIMIZED: Parallel + Cached)
  useEffect(() => {
    const fetchData = async () => {
      const startTime = Date.now();

      try {
        if (!isOwnProfile && userId) {
          if (__DEV__) console.log('[PROFILE-VISION] Fetching other user profile:', userId);
          const [data, userCircles, userChallenges] = await Promise.all([
            supabaseService.getUserProfile(userId),
            supabaseService.getCirclesForUser(userId),
            supabaseChallengeService.getActiveChallengesForUser(userId),
          ]);
          setProfileData({ ...data, challenges: userChallenges });
          setUserPosts(data.posts || []);
          setCircles(userCircles || []);
          setLoading(false);
          return;
        }

        // Check cache (5 minute expiry)
        const cacheAge = Date.now() - (dataCache.lastFetch || 0);
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        if (cacheAge < CACHE_DURATION && dataCache.circles && dataCache.posts) {
          // Use cached data
          if (__DEV__) console.log('[PROFILE-VISION] Using cached data');
          setCircles(dataCache.circles);
          setUserPosts(dataCache.posts);
          setLoading(false);
          return;
        }

        // Fetch ALL data in parallel (not sequential)
        if (__DEV__) console.log('[PROFILE-VISION] Fetching fresh data in parallel...');

        const [challengesResult, userCircles, posts] = await Promise.all([
          fetchMyActiveChallenges().catch(err => {
            if (__DEV__) console.error('[PROFILE-VISION] Error fetching challenges:', err);
            return null;
          }),
          supabaseService.getUserCircles().catch(err => {
            if (__DEV__) console.error('[PROFILE-VISION] Error fetching circles:', err);
            return [];
          }),
          currentUser?.id
            ? supabaseService.getUserPosts(currentUser.id, 5).catch(err => {
                if (__DEV__) console.error('[PROFILE-VISION] Error fetching posts:', err);
                return [];
              })
            : Promise.resolve([]),
        ]);

        // Load followers/following separately (can happen in background)
        loadFollowing().catch(err => {
          if (__DEV__) console.error('[PROFILE-VISION] Error loading following:', err);
        });

        // Update state
        setCircles(userCircles || []);
        setUserPosts(posts || []);

        // Update cache
        setDataCache({
          circles: userCircles || [],
          posts: posts || [],
          lastFetch: Date.now(),
        });

        const endTime = Date.now();
        if (__DEV__) console.log(`[PROFILE-VISION] Profile data loaded in ${endTime - startTime}ms`);
      } catch (error) {
        if (__DEV__) console.error('[PROFILE-VISION] Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser?.id]);

  // Determine display user info
  const displayUser = isOwnProfile
    ? { name: currentUser?.name, avatar: currentUser?.avatar, bio: null }
    : { name: profileData?.profile?.name || profileData?.profile?.username, avatar: profileData?.profile?.avatar_url, bio: profileData?.profile?.bio };

  const displayGoals = isOwnProfile ? goals : (profileData?.goals || []);
  const displayStats = isOwnProfile
    ? { followers: followers.length, following: following.length, circles: circles.length }
    : { followers: profileData?.stats?.postsCount || 0, following: 0, circles: 0 };

  // Separate goals by type and add subtitles
  const regularGoals = displayGoals.filter((g: any) => g.type === 'goal').map((goal: any) => ({
    ...goal,
    subtitle: goal.metric || goal.deadline ?
      `${goal.metric || 'Goal'}${goal.deadline ? ` • ${new Date(goal.deadline).toLocaleDateString()}` : ''}` :
      'In progress'
  }));

  const routines = displayGoals.filter((g: any) => g.type === 'routine').map((routine: any) => ({
    ...routine,
    subtitle: 'Daily routine'
  }));

  // Transform challenges to match ActivityCard interface
  const transformedChallenges = isOwnProfile
    ? activeChallenges.map(challenge => ({
        id: challenge.id,
        title: challenge.name,
        subtitle: challenge.my_participation
          ? `Day ${challenge.my_participation.current_day}/${challenge.duration_days}`
          : `${challenge.duration_days} days`,
        consistency: challenge.my_participation?.completion_percentage || 0,
      }))
    : (profileData?.challenges || []);

  // Render helper for action entries (from daily_progress cards)
  const renderActionEntry = (action: any) => {
    return (
      <View style={styles.timelineContent}>
        <View style={styles.timelineText}>
          <Text style={styles.timelineDate}>
            {new Date(action.completedAt).toLocaleDateString()}
          </Text>

          <Text style={styles.timelineTitle}>
            {action.title}
          </Text>
        </View>
      </View>
    );
  };

  // Render helper for regular post entries
  const renderPostEntry = (post: any, index: number) => {
    const hasPhoto = post.media_url;

    return (
      <View style={styles.timelineContent}>
        {hasPhoto ? (
          <View style={styles.timelinePhoto}>
            <Image
              source={{ uri: post.media_url }}
              style={styles.photoImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.photoOverlay}
            >
              <Text style={styles.photoDate}>
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
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
            <Text style={styles.timelineDate}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.timelineTitle}>
              {post.action_title || post.content || 'Post'}
            </Text>
            {post.content && post.action_title &&
             post.content !== 'Completed' &&
             post.content !== `Completed: ${post.action_title}` && (
              <Text style={styles.timelineReflection}>{post.content}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E7B43A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
          {/* Avatar with Consistency Ring */}
          <Pressable
            style={styles.avatarSection}
            onPress={isOwnProfile ? pickImage : undefined}
            disabled={!isOwnProfile || uploading}
          >
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={['#E7B43A', 'rgba(231,180,58,0.3)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.avatarInner}>
                {displayUser.avatar ? (
                  <Image
                    source={{ uri: displayUser.avatar }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Text style={styles.avatarText}>{displayUser.name?.charAt(0) || 'U'}</Text>
                )}
                {uploading && (
                  <View style={styles.avatarUploadOverlay}>
                    <ActivityIndicator size="small" color="#E7B43A" />
                  </View>
                )}
              </View>
            </View>
            {isOwnProfile && !uploading && (
              <View style={styles.cameraBadge}>
                <Camera size={14} color="#000" strokeWidth={2.5} />
              </View>
            )}
          </Pressable>

          {/* Username */}
          <Text style={styles.username}>{displayUser.name || 'User'}</Text>

          {/* Bio */}
          {displayUser.bio ? (
            <Text style={styles.bio}>{displayUser.bio}</Text>
          ) : null}

          {/* Push Token Display (Temporary for Testing) */}
          {isOwnProfile && pushToken && (
            <View style={{ backgroundColor: 'rgba(231,180,58,0.1)', padding: 12, borderRadius: 8, marginTop: 16 }}>
              <Text style={{ color: '#E7B43A', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>
                📱 PUSH TOKEN (for testing):
              </Text>
              <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'monospace' }} selectable>
                {pushToken}
              </Text>
            </View>
          )}

          {/* Social Stats removed for MVP */}
        </View>

        {/* What I'm Working On */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isOwnProfile ? 'What I\'m Working On' : 'Working On'}</Text>

          {transformedChallenges.map(challenge => (
            <ActivityCard key={challenge.id} item={challenge} type="challenge" />
          ))}

          {regularGoals.map(goal => (
            <ActivityCard key={goal.id} item={goal} type="goal" />
          ))}

          {routines.map(routine => (
            <ActivityCard key={routine.id} item={routine} type="routine" />
          ))}

          {displayGoals.length === 0 && transformedChallenges.length === 0 && (
            <Text style={styles.emptyText}>No active goals yet</Text>
          )}
        </View>

        {/* My Journey */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithSubtitle}>
            <Text style={styles.sectionHeader}>{isOwnProfile ? 'My Journey' : 'Journey'}</Text>
            <Text style={styles.sectionSubtitle}>Recent activity</Text>
          </View>

          {userPosts.length > 0 ? (
            <>
              <View style={styles.journeyTimeline}>
                {/* Timeline vertical line */}
                <LinearGradient
                  colors={['#E7B43A', 'rgba(231,180,58,0)']}
                  style={styles.timelineLine}
                />

                {(() => {
                  const allEntries = expandTimelineEntries(userPosts);
                  const PREVIEW_COUNT = 5;
                  const visibleEntries = showFullJourney ? allEntries : allEntries.slice(0, PREVIEW_COUNT);

                  return visibleEntries.map((entry, index) => {
                    const isFirstEntry = index === 0;

                    return (
                      <View key={entry.id} style={styles.timelineEvent}>
                        <View style={isFirstEntry ? styles.timelineMilestone : styles.timelineDot}>
                          {isFirstEntry && <Text style={styles.milestoneIcon}>🏆</Text>}
                        </View>

                        {entry.type === 'action'
                          ? renderActionEntry(entry.action!)
                          : renderPostEntry(entry.post!, index)
                        }
                      </View>
                    );
                  });
                })()}
              </View>

              {expandTimelineEntries(userPosts).length > 5 && (
                <Pressable
                  style={styles.viewAllButton}
                  onPress={() => setShowFullJourney(!showFullJourney)}
                >
                  <Text style={styles.viewAllText}>
                    {showFullJourney ? 'Show Less' : `View Full Journey (${expandTimelineEntries(userPosts).length} entries) →`}
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>No posts yet</Text>
          )}
        </View>

        {/* Circles */}
        {circles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{isOwnProfile ? 'My Circles' : 'Circles'}</Text>

            {circles.map(circle => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Logout Button - only on own profile */}
      {isOwnProfile && (
        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          }}
        >
          <LogOut size={20} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231,180,58,0.1)',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    overflow: 'hidden',
  },
  avatarInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E7B43A',
  },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E7B43A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  socialStats: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  socialStat: {
    alignItems: 'center',
  },
  socialNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  socialLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  // Sections
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E7B43A',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeaderWithSubtitle: {
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },

  // Activity Cards (What I'm Working On)
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  // Consistency Circle
  consistencyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  consistencyProgress: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  consistencyInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consistencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E7B43A',
  },

  // Timeline (My Journey)
  journeyTimeline: {
    position: 'relative',
    paddingLeft: 40,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    width: 2,
  },
  timelineEvent: {
    position: 'relative',
    marginBottom: 20,
  },
  timelineDot: {
    position: 'absolute',
    left: -33,
    top: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E7B43A',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.6,
    zIndex: 2,
  },
  timelineMilestone: {
    position: 'absolute',
    left: -36,
    top: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E7B43A',
    shadowColor: '#E7B43A',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.8,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIcon: {
    fontSize: 10,
  },
  timelineContent: {
    backgroundColor: 'rgba(231,180,58,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.2)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timelinePhoto: {
    position: 'relative',
    height: 180,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(231,180,58,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  photoDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  photoMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricText: {
    fontSize: 11,
    color: '#E7B43A',
  },
  timelineText: {
    padding: 12,
  },
  timelineDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  timelineReflection: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  viewAllButton: {
    backgroundColor: 'rgba(231,180,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.3)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E7B43A',
  },

  // Circle Cards (My Circles)
  circleCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: '#E7B43A',
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  circleIconText: {
    fontSize: 20,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  circleMeta: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  // Empty States
  emptyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Logout Button
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
