import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import { supabaseNotificationService } from '../../services/supabase.notifications.service';
import { supabase } from '../../services/supabase.service';
import type { PredeterminedActivity } from '../../types/challenges.types';

interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  onSuccess?: () => void;
}

export const CreateChallengeModal = ({
  visible,
  onClose,
  circleId,
  circleName,
  onSuccess,
}: CreateChallengeModalProps) => {
  const insets = useSafeAreaInsets();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [durationDays, setDurationDays] = useState('7');
  const [successThreshold, setSuccessThreshold] = useState('80');
  const [activities, setActivities] = useState<PredeterminedActivity[]>([
    { id: 'act1', title: '', emoji: '✅', frequency: 'daily' },
  ]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEmoji('🎯');
    setDurationDays('7');
    setSuccessThreshold('80');
    setActivities([{ id: 'act1', title: '', emoji: '✅', frequency: 'daily' }]);
  };

  const addActivity = () => {
    setActivities([
      ...activities,
      { id: `act${activities.length + 1}`, title: '', emoji: '✅', frequency: 'daily' },
    ]);
  };

  const removeActivity = (id: string) => {
    if (activities.length > 1) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const updateActivity = (id: string, field: keyof PredeterminedActivity, value: any) => {
    setActivities(activities.map(a => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a challenge name');
      return;
    }

    if (activities.some(a => !a.title.trim())) {
      Alert.alert('Error', 'Please fill in all activity names');
      return;
    }

    const durationNum = parseInt(durationDays);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 365) {
      Alert.alert('Error', 'Duration must be between 1 and 365 days');
      return;
    }

    const thresholdNum = parseInt(successThreshold);
    if (isNaN(thresholdNum) || thresholdNum < 1 || thresholdNum > 100) {
      Alert.alert('Error', 'Success threshold must be between 1 and 100%');
      return;
    }

    setIsCreating(true);

    try {
      // Create challenge
      const result = await supabaseChallengeService.createChallenge({
        circleId,
        name,
        description,
        emoji,
        durationDays: durationNum,
        successThreshold: thresholdNum,
        activities,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create challenge');
        setIsCreating(false);
        return;
      }

      if (__DEV__) console.log('✅ Challenge created successfully:', result.challengeId);

      const { data: circleMembers } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId);

      if (circleMembers && circleMembers.length > 0) {
        if (__DEV__) console.log(`📤 Sending notifications to ${circleMembers.length} circle members...`);

        await Promise.all(
          circleMembers.map(member =>
            supabaseNotificationService.createNotification({
              userId: member.user_id,
              type: 'circle_challenge_created',
              title: '🎯 New Circle Challenge!',
              body: `Your circle just started "${name}". Join now to participate!`,
              data: {
                challengeId: result.challengeId,
                circleName,
              },
              actionUrl: `/challenges/${result.challengeId}`,
            })
          )
        );

        if (__DEV__) console.log('✅ Notifications sent successfully');
      }

      Alert.alert('Success', `"${name}" challenge created!`, [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onClose();
            onSuccess?.();
          },
        },
      ]);
    } catch (error: any) {
      if (__DEV__) console.error('Error creating challenge:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#000000', '#000', '#000000']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Challenge</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Circle Info */}
          <Text style={styles.circleLabel}>For: {circleName}</Text>

          {/* Challenge Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Challenge Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="7-Day Cold Shower Challenge"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>

          {/* Emoji */}
          <View style={styles.field}>
            <Text style={styles.label}>Emoji</Text>
            <TextInput
              style={[styles.input, styles.emojiInput]}
              value={emoji}
              onChangeText={setEmoji}
              placeholder="🎯"
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={2}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this challenge about?"
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Duration */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Duration (days)</Text>
              <TextInput
                style={styles.input}
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="number-pad"
                placeholder="7"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Success Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={successThreshold}
                onChangeText={setSuccessThreshold}
                keyboardType="number-pad"
                placeholder="80"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>

          {/* Activities */}
          <View style={styles.field}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Activities</Text>
              <Pressable onPress={addActivity} style={styles.addButton}>
                <Plus size={16} color="#FFD700" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {activities.map((activity, index) => (
              <View key={activity.id} style={styles.activityRow}>
                <TextInput
                  style={[styles.input, styles.emojiInputSmall]}
                  value={activity.emoji}
                  onChangeText={value => updateActivity(activity.id, 'emoji', value)}
                  placeholder="🏃"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={activity.title}
                  onChangeText={value => updateActivity(activity.id, 'title', value)}
                  placeholder={`Activity ${index + 1}`}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
                {activities.length > 1 && (
                  <Pressable
                    onPress={() => removeActivity(activity.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color="#FF6B6B" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* Create Button */}
          <Pressable
            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={StyleSheet.absoluteFillObject}
            />
            {isCreating ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.createButtonText}>Create Challenge</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  circleLabel: {
    fontSize: 14,
    color: 'rgba(255,215,0,0.8)',
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emojiInput: {
    fontSize: 32,
    textAlign: 'center',
  },
  emojiInputSmall: {
    width: 60,
    fontSize: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  createButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
});
