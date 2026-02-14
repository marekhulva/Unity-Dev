import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, Pressable, Alert, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Users } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import * as Haptics from 'expo-haptics';
import { CreateCircleModal } from './CreateCircleModal';

interface JoinCircleModalProps {
  visible: boolean;
  onClose: () => void;
}

export const JoinCircleModal: React.FC<JoinCircleModalProps> = ({ visible, onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { joinCircle, fetchUserCircles } = useStore();

  const handleJoinCircle = async () => {
    if (inviteCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid invite code');
      return;
    }

    if (__DEV__) console.log('Attempting to join circle with code:', inviteCode);
    setLoading(true);
    try {
      const success = await joinCircle(inviteCode);
      if (__DEV__) console.log('Join circle result:', success);
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success!', 'You\'ve joined the circle!', [
          { text: 'OK', onPress: () => {
            onClose();
            setInviteCode(''); // Clear the code
            // joinCircle already handles loading circle data and refreshing feeds
          }}
        ]);
      } else {
        Alert.alert('Error', 'Invalid invite code or already a member');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Join circle error:', error);
      Alert.alert('Error', error.message || 'Failed to join circle');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = () => {
    // Open the create circle modal
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    // Refresh circles after successful creation
    fetchUserCircles();
    onClose(); // Close the join modal
  };

  return (
    <>
      <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'overFullScreen'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
        
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
            <Text style={styles.title}>Join a Circle</Text>
            <Text style={styles.subtitle}>
              Enter an invite code to join your team, group, or community
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter invite code"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
            />
          </View>

          <Pressable 
            style={[styles.joinButton, loading && styles.buttonDisabled]}
            onPress={handleJoinCircle}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.buttonText}>
              {loading ? 'Joining...' : 'Join Circle'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.createButton} onPress={handleCreateCircle}>
            <Text style={styles.createButtonText}>Create New Circle</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    {/* Create Circle Modal */}
    <CreateCircleModal
      visible={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      onSuccess={handleCreateSuccess}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 32,
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
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  joinButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 16,
  },
  createButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
});