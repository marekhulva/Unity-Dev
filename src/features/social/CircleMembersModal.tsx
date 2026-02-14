import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, Pressable, Image, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Users, UserPlus, Crown } from 'lucide-react-native';
import { backendService } from '../../services/backend.service';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface CircleMember {
  user_id: string;
  profiles: {
    name: string;
    username: string;
    avatar_url: string;
  };
  role?: string;
}

interface CircleMembersModalProps {
  visible: boolean;
  onClose: () => void;
  circleId?: string;
}

export const CircleMembersModal: React.FC<CircleMembersModalProps> = ({ 
  visible, 
  onClose,
  circleId 
}) => {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [circleName, setCircleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadCircleData();
    }
  }, [visible, circleId]);

  const loadCircleData = async () => {
    setLoading(true);
    try {
      // Get circle details
      const circleResult = await backendService.getMyCircle();
      if (__DEV__) console.log('Circle result:', circleResult);
      
      if (circleResult.success && circleResult.data) {
        const circle = circleResult.data;
        if (__DEV__) console.log('Circle data:', circle);
        setCircleName(circle.name);
        setInviteCode(circle.invite_code);
        
        // Get members
        const membersResult = await backendService.getCircleMembers(circle.id);
        if (__DEV__) console.log('Members result:', membersResult);
        const membersList = membersResult.success ? membersResult.data : [];
        if (__DEV__) console.log('Members list:', membersList);
        setMembers(membersList || []);
      } else {
        if (__DEV__) console.log('No circle found for user');
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to load circle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }: { item: CircleMember }) => (
    <Pressable style={styles.memberItem}>
      <View style={styles.memberLeft}>
        {item.profiles?.avatar_url ? (
          <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{item.profiles?.name || 'Unknown'}</Text>
            {item.role === 'admin' && (
              <Crown size={14} color="#FFD700" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text style={styles.memberUsername}>@{item.profiles?.username || 'user'}</Text>
        </View>
      </View>
      
      <Pressable style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </Pressable>
    </Pressable>
  );

  const handleShareInvite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement share functionality
    alert(`Invite Code: ${inviteCode}\n\nShare feature coming soon!`);
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
              <Users size={24} color="#FFD700" />
              <View style={styles.headerText}>
                <Text style={styles.title}>{circleName || 'Your Circle'}</Text>
                <Text style={styles.subtitle}>{members.length} members</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          {/* Invite Code Card */}
          <Pressable style={styles.inviteCard} onPress={handleShareInvite}>
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.inviteContent}>
              <UserPlus size={20} color="#FFD700" />
              <View style={styles.inviteText}>
                <Text style={styles.inviteLabel}>Invite Code</Text>
                <Text style={styles.inviteCode}>{inviteCode}</Text>
              </View>
              <Text style={styles.shareButton}>Share</Text>
            </View>
          </Pressable>

          {/* Members List */}
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.user_id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {loading ? 'Loading members...' : 'No members yet'}
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
  headerText: {
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  closeButton: {
    padding: 8,
  },
  inviteCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteText: {
    flex: 1,
  },
  inviteLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 2,
  },
  shareButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  memberItem: {
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
  memberLeft: {
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
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  memberUsername: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
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