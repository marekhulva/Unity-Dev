import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  TextInput,
  Image,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  CheckCircle, 
  Trophy,
  Send,
  Calendar,
  Target,
  Flame,
  ChevronRight
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { Post } from '../../state/slices/socialSlice';
import * as Haptics from 'expo-haptics';

// Import existing modals and components
import { CircleMembersModal } from './CircleMembersModal';
import { JoinCircleModal } from './JoinCircleModal';
import { DiscoverUsersModal } from './DiscoverUsersModal';
import { ShareComposer } from './ShareComposer';

const { width } = Dimensions.get('window');

export const SocialScreenV2 = () => {
  const insets = useSafeAreaInsets();
  
  // All the same state and hooks from original
  const feedView = useStore(s => s.feedView);
  const setFeedView = useStore(s => s.setFeedView);
  const circle = useStore(s => s.circleFeed);
  const follow = useStore(s => s.followFeed);
  const completedActions = useStore(s => s.completedActions);
  const user = useStore(s => s.user);
  const circleId = useStore(s => s.circleId);
  const circleName = useStore(s => s.circleName);
  const loadCircleData = useStore(s => s.loadCircleData);
  const fetchFeeds = useStore(s => s.fetchFeeds);
  const loadFollowing = useStore(s => s.loadFollowing);
  const react = useStore(s => s.react);
  const addComment = useStore(s => s.addComment);
  const openShare = useStore(s => s.openShare);
  
  // Modal states
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showJoinCircleModal, setShowJoinCircleModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load data on mount
  useEffect(() => {
    loadCircleData();
    fetchFeeds();
    loadFollowing();
  }, []);
  
  // Combine posts with completed actions (same logic as original)
  const actionPosts: Post[] = completedActions.map(ca => ({
    id: `action-${ca.actionId}`,
    user: 'You',
    avatar: user?.avatar || '👤',
    content: ca.title,
    type: 'check-in' as const,
    reactions: {},
    time: new Date(ca.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: ca.completedAt,
    goalColor: '#FFD168',
    visibility: 'circle' as const,
  }));
  
  const combinedCircle = [...actionPosts, ...circle]
    .map(post => {
      if (post.user === 'You' || post.user === user?.name || post.user === user?.email) {
        return { ...post, avatar: user?.avatar || post.avatar || '👤' };
      }
      return post;
    })
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 20);
  
  const posts: Post[] = feedView === 'circle' ? combinedCircle : follow;
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFeeds();
    setIsRefreshing(false);
  };
  
  // Calculate group stats
  const todayActions = posts.filter(p => {
    const postDate = new Date(p.timestamp || '');
    const today = new Date();
    return postDate.toDateString() === today.toDateString();
  }).length;
  
  const groupStreak = 12; // This would come from backend ideally
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={styles.headerTitle}>Circle</Text>
        
        {/* Toggle Tabs */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, feedView === 'circle' && styles.tabActive]}
            onPress={() => {
              setFeedView('circle');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, feedView === 'circle' && styles.tabTextActive]}>
              Circle
            </Text>
          </Pressable>
          
          <Pressable 
            style={[styles.tab, feedView === 'following' && styles.tabActive]}
            onPress={() => {
              setFeedView('following');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, feedView === 'following' && styles.tabTextActive]}>
              Follow
            </Text>
          </Pressable>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFD168"
          />
        }
      >
        {/* Group Activity Summary Card */}
        {feedView === 'circle' && circleId && (
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.summaryCard}
          >
            <LinearGradient
              colors={['#FFD168', '#F5A623']}
              style={styles.summaryIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <CheckCircle size={28} color="#000" />
            </LinearGradient>
            
            <View style={styles.summaryContent}>
              <Text style={styles.summaryMainText}>
                {todayActions} friends completed actions today
              </Text>
              <Text style={styles.summarySecondaryText}>
                Longest group streak of {groupStreak} days
              </Text>
              
              {/* Mini avatars of active members */}
              <View style={styles.miniAvatarsRow}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarEmoji}>👤</Text>
                </View>
                <Text style={styles.miniAvatarName}>Michael</Text>
              </View>
            </View>
            
            <Pressable
              onPress={() => setShowMembersModal(true)}
              style={styles.summaryArrow}
            >
              <ChevronRight size={20} color="rgba(255,255,255,0.56)" />
            </Pressable>
          </Animated.View>
        )}
        
        {/* Join Circle Prompt if no circle */}
        {feedView === 'circle' && !circleId && (
          <Pressable 
            style={styles.joinPromptCard}
            onPress={() => setShowJoinCircleModal(true)}
          >
            <Users size={24} color="#FFD168" />
            <Text style={styles.joinPromptText}>Join a Circle</Text>
            <Text style={styles.joinPromptSubtext}>Connect with your team</Text>
          </Pressable>
        )}
        
        {/* Prompt Input */}
        <Pressable 
          style={styles.promptInput}
          onPress={() => openShare()}
        >
          <Image 
            source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
            style={styles.promptAvatar}
          />
          <Text style={styles.promptText}>What's your win today?</Text>
          <View style={styles.promptButton}>
            <Text style={styles.promptButtonText}>Use Prompt</Text>
          </View>
        </Pressable>
        
        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share!</Text>
          </View>
        ) : (
          posts.map((post, index) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onReact={react}
              onComment={addComment}
              delay={index * 100}
            />
          ))
        )}
        
        {/* Discover Users Button for Following tab */}
        {feedView === 'following' && (
          <Pressable
            style={styles.discoverButton}
            onPress={() => setShowDiscoverModal(true)}
          >
            <LinearGradient
              colors={['#FFD168', '#F5A623']}
              style={StyleSheet.absoluteFillObject}
            />
            <Users size={20} color="#000" />
            <Text style={styles.discoverButtonText}>Discover People</Text>
          </Pressable>
        )}
      </ScrollView>
      
      {/* ShareComposer for posting */}
      <ShareComposer />
      
      {/* Modals */}
      <CircleMembersModal 
        visible={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />
      
      <JoinCircleModal
        visible={showJoinCircleModal}
        onClose={() => setShowJoinCircleModal(false)}
      />
      
      <DiscoverUsersModal
        visible={showDiscoverModal}
        onClose={() => setShowDiscoverModal(false)}
      />
    </SafeAreaView>
  );
};

// Post Card Component
const PostCard: React.FC<{
  post: Post;
  onReact: (id: string, emoji: string, which: 'circle' | 'follow') => void;
  onComment: (postId: string, content: string, which: 'circle' | 'follow') => void;
  delay: number;
}> = ({ post, onReact, onComment, delay }) => {
  const getTagStyle = (type: string) => {
    switch(type) {
      case 'check-in':
        return { label: 'Check-In', gradient: ['#6C63FF', '#9F7AEA'] };
      case 'goal':
        return { label: 'Goal Announced', gradient: ['#6C63FF', '#9F7AEA'] };
      case 'milestone':
        return { label: 'Milestone', gradient: ['#FFD168', '#F5A623'] };
      default:
        return { label: 'Update', gradient: ['#6C63FF', '#9F7AEA'] };
    }
  };
  
  const tag = getTagStyle(post.type);
  const reactionCount = Object.keys(post.reactions || {}).length;
  const commentCount = post.comments?.length || 0;
  
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(400)}
      style={styles.postCard}
    >
      {/* Header */}
      <View style={styles.postHeader}>
        <Image 
          source={{ uri: post.avatar || 'https://via.placeholder.com/40' }}
          style={styles.postAvatar}
        />
        <View style={styles.postHeaderText}>
          <Text style={styles.postUsername}>{post.user}</Text>
          <Text style={styles.postTime}>{post.time || '2h ago'}</Text>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.postContent}>
        <Text style={styles.postMainText}>{post.content}</Text>
        
        {/* Tag */}
        <View style={styles.postTag}>
          <LinearGradient
            colors={tag.gradient}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.postTagText}>{tag.label}</Text>
        </View>
        
        {/* Additional text if exists */}
        {post.goalTitle && (
          <Text style={styles.postSecondaryText}>{post.goalTitle}</Text>
        )}
      </View>
      
      {/* Footer */}
      <View style={styles.postFooter}>
        <Pressable 
          style={styles.postAction}
          onPress={() => onReact(post.id, '❤️', post.visibility)}
        >
          <Heart 
            size={18} 
            color={post.userReacted ? '#FFD168' : 'rgba(255,255,255,0.56)'} 
            fill={post.userReacted ? '#FFD168' : 'transparent'}
          />
          {reactionCount > 0 && (
            <Text style={styles.postActionText}>{reactionCount}</Text>
          )}
        </Pressable>
        
        <Pressable 
          style={styles.postAction}
          onPress={() => {
            // Would open comment modal
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <MessageCircle size={18} color="rgba(255,255,255,0.56)" />
          {commentCount > 0 && (
            <Text style={styles.postActionText}>{commentCount}</Text>
          )}
        </Pressable>
        
        <View style={styles.postDate}>
          <Text style={styles.postDateText}>
            {new Date(post.timestamp || '').toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.96)',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.56)',
  },
  tabTextActive: {
    color: 'rgba(255,255,255,0.96)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.96)',
    marginBottom: 4,
  },
  summarySecondaryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 12,
  },
  miniAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniAvatarEmoji: {
    fontSize: 12,
  },
  miniAvatarName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  summaryArrow: {
    padding: 8,
  },
  joinPromptCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  joinPromptText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.96)',
    marginTop: 12,
  },
  joinPromptSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.56)',
    marginTop: 4,
  },
  promptInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    marginBottom: 20,
  },
  promptAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 12,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.56)',
  },
  promptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  promptButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.96)',
  },
  postTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.56)',
    marginTop: 2,
  },
  postContent: {
    marginBottom: 12,
  },
  postMainText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.96)',
    lineHeight: 22,
    marginBottom: 12,
  },
  postTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  postTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postSecondaryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    marginTop: 8,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  postActionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.56)',
    marginLeft: 6,
  },
  postDate: {
    marginLeft: 'auto',
  },
  postDateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.56)',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.56)',
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
    alignSelf: 'center',
  },
  discoverButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
});