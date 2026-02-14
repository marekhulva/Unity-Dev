import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, Pressable, Image, TextInput, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Search, UserPlus, UserCheck, Users } from 'lucide-react-native';
import { backendService } from '../../services/backend.service';
import { useStore } from '../../state/rootStore';
import * as Haptics from 'expo-haptics';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
  circle_name?: string;
  is_following?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

interface DiscoverUsersModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DiscoverUsersModal: React.FC<DiscoverUsersModalProps> = ({
  visible,
  onClose
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const currentUserId = useStore(s => s.user?.id);
  const followUser = useStore(s => s.followUser);
  const unfollowUser = useStore(s => s.unfollowUser);

  useEffect(() => {
    if (visible) {
      loadSuggestedUsers();
      setSearchQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      loadSuggestedUsers();
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSuggestedUsers = async () => {
    setLoading(true);
    try {
      const usersResult = await backendService.getAllUsers(15);
      if (usersResult.success && usersResult.data) {
        const otherUsers = usersResult.data.filter(u => u.id !== currentUserId);
        setUsers(otherUsers);
      }

      const followingResult = await backendService.getFollowing();
      if (followingResult.success && followingResult.data) {
        const ids = new Set(followingResult.data.map(f => f.following_id));
        setFollowingIds(ids);
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to load suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearching(true);
    try {
      const searchResult = await backendService.searchUsers(query, 20);
      if (searchResult.success && searchResult.data) {
        const otherUsers = searchResult.data.filter(u => u.id !== currentUserId);
        setUsers(otherUsers);
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      if (followingIds.has(userId)) {
        // Unfollow
        await unfollowUser(userId);
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        // Follow
        await followUser(userId);
        setFollowingIds(prev => new Set([...prev, userId]));
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to toggle follow:', error);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isFollowing = followingIds.has(item.id);
    
    return (
      <Pressable style={styles.userItem}>
        <View style={styles.userLeft}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name || 'Unknown'}</Text>
            {item.username && (
              <Text style={styles.userUsername}>@{item.username}</Text>
            )}
            {item.circle_name && (
              <View style={styles.circleTag}>
                <Users size={10} color="#FFD700" />
                <Text style={styles.circleTagText}>{item.circle_name}</Text>
              </View>
            )}
          </View>
        </View>
        
        <Pressable 
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollowToggle(item.id)}
        >
          {isFollowing ? (
            <>
              <UserCheck size={14} color="#000" />
              <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
            </>
          ) : (
            <>
              <UserPlus size={14} color="#FFD700" />
              <Text style={styles.followButtonText}>Follow</Text>
            </>
          )}
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.content}>
          <LinearGradient
            colors={['rgba(255,215,0,0.05)', 'rgba(255,255,255,0.02)']}
            style={styles.gradient}
          />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <UserPlus size={24} color="#FFD700" />
              <Text style={styles.title}>Discover People</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && (
              <ActivityIndicator size="small" color="#FFD700" />
            )}
          </View>

          {/* Users List */}
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {loading || searching ? 'Loading...' :
                   searchQuery ? 'No users found. Try a different search.' : 'Start typing to search for users'}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        maxWidth: 430, // iPhone width
        maxHeight: 932, // iPhone height  
        margin: 'auto',
      },
    }),
  },
  content: {
    height: '85%',
    maxHeight: Platform.OS === 'web' ? 600 : undefined,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  userUsername: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  circleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  circleTagText: {
    fontSize: 11,
    color: '#FFD700',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  followingButton: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  followingButtonText: {
    color: '#000',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
});