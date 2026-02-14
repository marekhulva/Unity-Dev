import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Heart, MessageCircle, Share2, Play, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabaseService } from '../services/supabase.service';

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  audio_url?: string;
  type: 'text' | 'photo' | 'audio' | 'activity' | 'milestone';
  visibility: 'private' | 'circle' | 'followers';
  created_at: string;
  reactions?: any[];
  comments?: any[];
  activity_title?: string;
  is_celebration?: boolean;
  metadata?: any;
}

interface ProfilePostsTimelineProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const ProfilePostsTimeline: React.FC<ProfilePostsTimelineProps> = ({
  userId,
  isOwnProfile = false,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const { supabase } = await import('../services/supabase.service');

      // Fetch user's public posts
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // If not own profile, only show public/circle posts
      if (!isOwnProfile) {
        query = query.in('visibility', ['circle', 'followers']);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      if (__DEV__) console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diff = now.getTime() - postDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return postDate.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: Post }) => {
    const hasMedia = item.media_url || item.audio_url;
    const isActivity = item.type === 'activity' || item.type === 'milestone';

    return (
      <Pressable
        style={styles.postCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Handle post tap - could open detail view
        }}
      >
        {/* Post type indicator */}
        {isActivity && (
          <View style={styles.postTypeBar}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.postTypeText}>
              {item.type === 'milestone' ? '🎯 MILESTONE' : '✅ ACTIVITY'}
            </Text>
          </View>
        )}

        {/* Post content */}
        <View style={styles.postContent}>
          {item.activity_title && (
            <Text style={styles.activityTitle}>{item.activity_title}</Text>
          )}
          {item.content && (
            <Text style={styles.postText}>{item.content}</Text>
          )}

          {/* Media preview */}
          {item.media_url && (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: item.media_url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>
          )}

          {item.audio_url && (
            <Pressable style={styles.audioContainer}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Play size={20} color="#FFD700" />
              <Text style={styles.audioText}>Play Audio Note</Text>
              <Mic size={16} color="rgba(255,255,255,0.4)" />
            </Pressable>
          )}
        </View>

        {/* Post footer */}
        <View style={styles.postFooter}>
          <Text style={styles.postTime}>{formatTime(item.created_at)}</Text>
          <View style={styles.postActions}>
            <Pressable style={styles.actionButton}>
              <Heart size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.actionCount}>
                {item.reactions?.length || 0}
              </Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <MessageCircle size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.actionCount}>
                {item.comments?.length || 0}
              </Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Share2 size={16} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptySubtitle}>
          {isOwnProfile
            ? "Share your journey to inspire others"
            : "This user hasn't shared any posts yet"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={() => {
        setRefreshing(true);
        loadPosts();
      }}
      refreshing={refreshing}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContent: {
    paddingVertical: 16,
  },
  separator: {
    height: 12,
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  postTypeBar: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  postContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
  },
  postText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 12,
  },
  audioText: {
    flex: 1,
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});