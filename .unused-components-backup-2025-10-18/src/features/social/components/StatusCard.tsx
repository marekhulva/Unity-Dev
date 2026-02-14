import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Heart, Sparkles } from 'lucide-react-native';
import { PostCardBase } from './PostCardBase';
import { Post } from '../../../../state/slices/socialSlice';

interface StatusCardProps {
  post: Post;
  onReact: (emoji: string) => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ post, onReact }) => {
  // Determine mood/vibe from content
  const getMoodColor = () => {
    const content = post.content?.toLowerCase() || '';
    if (content.includes('excited') || content.includes('amazing')) return '#FFD700';
    if (content.includes('grateful') || content.includes('thankful')) return '#FF69B4';
    if (content.includes('focused') || content.includes('productive')) return '#06FFA5';
    if (content.includes('tired') || content.includes('struggling')) return '#87CEEB';
    return '#C0C0C0';
  };

  const moodColor = getMoodColor();

  return (
    <PostCardBase
      post={post}
      onReact={onReact}
      borderColor={`${moodColor}30`}
      glowColor={`${moodColor}20`}
    >
      {/* Status content with larger text */}
      <View style={styles.statusContent}>
        <Text style={styles.statusText}>{post.content}</Text>
        
        {/* Mood indicator */}
        <View style={[styles.moodIndicator, { backgroundColor: `${moodColor}15` }]}>
          <Sparkles size={12} color={moodColor} />
          <Text style={[styles.moodText, { color: moodColor }]}>
            {post.mood || 'Reflecting'}
          </Text>
        </View>
      </View>

      {/* Engagement hints */}
      {post.socialProof && post.socialProof.inspired && post.socialProof.inspired > 0 && (
        <View style={styles.engagementRow}>
          <View style={styles.engagementItem}>
            <Heart size={12} color="#FF69B4" />
            <Text style={styles.engagementText}>
              {post.socialProof.inspired} inspired
            </Text>
          </View>
          
          {post.comments && post.comments > 0 && (
            <View style={styles.engagementItem}>
              <MessageCircle size={12} color="#C0C0C0" />
              <Text style={styles.engagementText}>
                {post.comments} replies
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Call to action for community */}
      {post.question && (
        <View style={styles.questionBox}>
          <LinearGradient
            colors={['rgba(255,215,0,0.05)', 'rgba(255,215,0,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.questionText}>💭 {post.question}</Text>
        </View>
      )}
    </PostCardBase>
  );
};

const styles = StyleSheet.create({
  statusContent: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  engagementRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  questionBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  questionText: {
    fontSize: 13,
    color: '#F7E7CE',
    fontStyle: 'italic',
  },
});