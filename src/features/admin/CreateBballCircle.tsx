import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { supabaseService } from '../../services/supabase.service';
import * as Haptics from 'expo-haptics';

export const CreateBballCircle: React.FC = () => {
  const [creating, setCreating] = useState(false);
  const [circleInfo, setCircleInfo] = useState<any>(null);

  const createBballCircle = async () => {
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // First check if Bball circle already exists
      const { data: existingCircles } = await supabaseService.supabase
        .from('circles')
        .select('*')
        .eq('name', 'Bball');
      
      if (existingCircles && existingCircles.length > 0) {
        const existing = existingCircles[0];
        Alert.alert(
          'Circle Already Exists',
          `The Bball circle already exists!\n\nInvite Code: ${existing.invite_code}\n\nShare this code with others to join.`,
          [{ text: 'OK' }]
        );
        setCircleInfo(existing);
        return;
      }
      
      // Generate invite code
      const inviteCode = 'BBALL' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      // Get current user
      const { data: { user } } = await supabaseService.supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a circle');
        return;
      }
      
      // Create the circle
      const { data: circle, error } = await supabaseService.supabase
        .from('circles')
        .insert({
          name: 'Bball',
          description: 'Basketball enthusiasts unite! Share your hoops journey, training sessions, and game highlights. 🏀',
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Auto-join creator
      await supabaseService.supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: user.id,
          role: 'admin'
        });
      
      // Update user's profile with circle
      await supabaseService.supabase
        .from('profiles')
        .update({ circle_id: circle.id })
        .eq('id', user.id);
      
      // Create default challenges
      const challenges = [
        {
          circle_id: circle.id,
          name: '30-Day Shooting Challenge',
          description: 'Make 100 shots every day for 30 days! 🎯',
          type: 'streak',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: user.id
        },
        {
          circle_id: circle.id,
          name: 'Weekly Pickup Games',
          description: 'Play at least 2 games per week! 🏆',
          type: 'recurring',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: user.id
        }
      ];
      
      for (const challenge of challenges) {
        await supabaseService.supabase
          .from('challenges')
          .insert(challenge);
      }
      
      setCircleInfo(circle);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        '🏀 Success!',
        `Bball circle created!\n\nInvite Code: ${circle.invite_code}\n\nShare this code with other players to join your circle.`,
        [{ text: 'Awesome!' }]
      );
      
    } catch (error: any) {
      if (__DEV__) console.error('Error creating Bball circle:', error);
      Alert.alert('Error', error.message || 'Failed to create circle');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={createBballCircle}
        disabled={creating}
      >
        <LinearGradient
          colors={['#FF6B35', '#FF8E53']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Users size={24} color="#FFF" />
        <Text style={styles.buttonText}>
          {creating ? 'Creating...' : 'Create Bball Circle 🏀'}
        </Text>
      </TouchableOpacity>
      
      {circleInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Circle Created!</Text>
          <Text style={styles.infoText}>Name: {circleInfo.name}</Text>
          <Text style={styles.infoText}>Invite Code: {circleInfo.invite_code}</Text>
          <Text style={styles.infoDescription}>{circleInfo.description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontStyle: 'italic',
  },
});