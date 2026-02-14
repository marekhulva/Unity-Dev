import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Send, MessageCircle } from 'lucide-react-native';
import { Comment } from '../../../state/slices/socialSlice';
import * as Haptics from 'expo-haptics';
import { isValidContent } from '../../../utils/contentValidation';

interface CommentSectionProps {
  postId: string;
  comments?: Comment[];
  isExpanded: boolean;
  onAddComment: (content: string) => void;
  onToggleExpand: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments = [],
  isExpanded,
  onAddComment,
  onToggleExpand,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const expandHeight = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    expandHeight.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isExpanded]);

  const containerStyle = useAnimatedStyle(() => ({
    maxHeight: expandHeight.value * 400,
    opacity: expandHeight.value,
  }));

  const handleSend = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const displayComments = isExpanded ? comments : comments.slice(-2);
  const hasMoreComments = comments.length > 2 && !isExpanded;

  if (!isExpanded && comments.length === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[styles.container, containerStyle]}
      layout={Layout.springify()}
    >
      {/* Comments List */}
      {displayComments.length > 0 && (
        <View style={styles.commentsList}>
          {hasMoreComments && (
            <Pressable onPress={onToggleExpand} style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>
                View all {comments.length} comments
              </Text>
            </Pressable>
          )}
          
          {displayComments.map((comment, index) => (
            <Animated.View
              key={comment.id}
              entering={FadeInDown.delay(index * 50).springify()}
              exiting={FadeOutUp}
              style={styles.commentItem}
            >
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.avatarEmoji}>{comment.avatar || '👤'}</Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{isValidContent(comment.content) ? comment.content : ''}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Comment Input */}
      {isExpanded && (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.inputContainer}
        >
          <BlurView intensity={30} tint="dark" style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, isFocused && styles.inputFocused]}
              placeholder="Add a supportive comment..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={commentText}
              onChangeText={setCommentText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              maxLength={200}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable 
              style={[
                styles.sendButton,
                commentText.trim() && styles.sendButtonActive
              ]}
              onPress={handleSend}
              disabled={!commentText.trim()}
            >
              <Send 
                size={18} 
                color={commentText.trim() ? '#FFD700' : 'rgba(255,255,255,0.3)'} 
              />
            </Pressable>
          </BlurView>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  commentsList: {
    marginBottom: 8,
  },
  viewMoreButton: {
    paddingVertical: 8,
  },
  viewMoreText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  commentItem: {
    marginVertical: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 14,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  commentText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  inputContainer: {
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    maxHeight: 80,
    minHeight: 32,
    paddingVertical: 4,
  },
  inputFocused: {
    color: '#FFFFFF',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
});