import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SimpleCheckinNotificationProps {
  userName: string;
  userId: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  onPress?: (userId: string) => void;
}

export const SimpleCheckinNotification: React.FC<SimpleCheckinNotificationProps> = ({
  userName,
  userId,
  timeOfDay,
  onPress,
}) => {
  const getMessage = () => {
    const currentHour = new Date().getHours();
    
    // Use provided timeOfDay or determine based on current time
    const period = timeOfDay || (
      currentHour < 12 ? 'morning' :
      currentHour < 17 ? 'afternoon' : 'evening'
    );
    
    switch (period) {
      case 'evening':
        return `${userName} hasn't checked in today`;
      case 'afternoon':
        return `${userName} hasn't checked in yet today`;
      default:
        return `${userName} hasn't checked in yet`;
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(userId);
    }
  };

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
      disabled={!onPress}
    >
      {/* Subtle gradient background */}
      <LinearGradient
        colors={['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <AlertCircle size={16} color="rgba(255,255,255,0.4)" />
        <Text style={styles.message}>{getMessage()}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 4, // Smaller margin for subtlety
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  
  message: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
});