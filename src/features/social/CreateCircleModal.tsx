import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Users, Plus } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import * as Haptics from 'expo-haptics';

interface CreateCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Emoji categories with popular options
const EMOJI_CATEGORIES = {
  Popular: ['🔵', '🟢', '🔴', '🟡', '🟣', '⭐', '🔥', '💎', '🌟', '✨'],
  Sports: ['🏀', '⚽', '🏈', '🎾', '🏐', '🏓', '⛳', '🥊', '🏋️', '🚴'],
  Fitness: ['💪', '🏃', '🧘', '🤸', '🏊', '🚶', '🧗', '🤺', '🏇', '🎿'],
  Work: ['💼', '📊', '💻', '📱', '🎯', '📈', '🚀', '💡', '⚡', '🔧'],
  Creative: ['🎨', '🎸', '🎬', '📸', '🎭', '🎪', '🎤', '🎧', '🎮', '✏️'],
  Study: ['📚', '📖', '📝', '🔬', '🧮', '🧬', '🔭', '🗂️', '📐', '🖊️'],
  Social: ['🎉', '🎊', '🍻', '☕', '🍔', '🌮', '🍕', '🎂', '🥳', '🤝'],
  Nature: ['🌲', '🏔️', '🌊', '🌅', '🏖️', '⛰️', '🌺', '🌸', '🍀', '🌴'],
  Zen: ['🧘', '🕉️', '☮️', '☯️', '🔮', '🌙', '⭐', '✨', '💫', '🌈'],
};

export const CreateCircleModal: React.FC<CreateCircleModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const { createCircle } = useStore();

  const handleCreateCircle = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    if (name.length < 3) {
      Alert.alert('Error', 'Circle name must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await createCircle(
        name.trim(),
        selectedEmoji,
        description.trim() || undefined
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success with invite code
        const inviteCode = result.data?.join_code || result.data?.invite_code || 'N/A';
        Alert.alert(
          '🎉 Circle Created!',
          `Your circle "${name}" has been created successfully!\n\nInvite Code: ${inviteCode}\n\nShare this code with friends to invite them.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                onSuccess?.();
                // Reset form
                setName('');
                setDescription('');
                setSelectedEmoji('');
                setIsPrivate(false);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create circle');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create circle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'overFullScreen'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.gradient}
            />

            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#fff" />
            </Pressable>

            <View style={styles.header}>
              <Users size={32} color="#FFD700" />
              <Text style={styles.title}>Create New Circle</Text>
              <Text style={styles.subtitle}>
                Start your own community and invite friends to join
              </Text>
            </View>

            {/* Emoji Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose an Icon</Text>
              <View style={styles.selectedEmojiContainer}>
                <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiCategories}
              >
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(
                      selectedCategory === category ? null : category
                    )}
                  >
                    <Text style={styles.categoryText}>{category}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {selectedCategory && (
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        selectedEmoji === emoji && styles.emojiButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedEmoji(emoji);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Circle Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Circle Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter circle name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={name}
                onChangeText={setName}
                maxLength={30}
              />
              <Text style={styles.charCount}>{name.length}/30</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What's this circle about?"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{description.length}/200</Text>
            </View>

            {/* Privacy Toggle */}
            <View style={styles.section}>
              <Pressable
                style={styles.privacyToggle}
                onPress={() => setIsPrivate(!isPrivate)}
              >
                <View>
                  <Text style={styles.sectionTitle}>Privacy</Text>
                  <Text style={styles.privacyDescription}>
                    {isPrivate
                      ? 'Private - Requires approval to join'
                      : 'Public - Anyone with the code can join'}
                  </Text>
                </View>
                <View style={[styles.toggle, isPrivate && styles.toggleActive]}>
                  <View
                    style={[
                      styles.toggleDot,
                      isPrivate && styles.toggleDotActive,
                    ]}
                  />
                </View>
              </Pressable>
            </View>

            {/* Create Button */}
            <Pressable
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleCreateCircle}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Plus size={20} color="#000" />
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : 'Create Circle'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
  },
  selectedEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  selectedEmoji: {
    fontSize: 40,
  },
  emojiCategories: {
    flexGrow: 0,
    marginBottom: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: '#FFD700',
  },
  categoryText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  emojiButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  emojiText: {
    fontSize: 24,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 4,
  },
  privacyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleDotActive: {
    transform: [{ translateX: 22 }],
    backgroundColor: '#FFD700',
  },
  createButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});