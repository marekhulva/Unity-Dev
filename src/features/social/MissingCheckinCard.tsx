import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Clock, Flame, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface MissingCheckinCardProps {
  userName: string;
  userAvatar?: string;
  userId: string;
  lastSeen?: string;
  streak?: number;
  actionsCompleted: number;
  totalActions: number;
  type: 'missing' | 'streak-risk' | 'late';
  onMotivate?: () => void;
  onProfilePress?: (userId: string) => void;
}

export const MissingCheckinCard: React.FC<MissingCheckinCardProps> = ({
  userName,
  userId,
  lastSeen,
  streak,
  actionsCompleted,
  totalActions,
  type,
  onMotivate,
  onProfilePress,
}) => {
  const getCardConfig = () => {
    switch (type) {
      case 'streak-risk':
        return {
          icon: <Flame size={20} color="#FF6B6B" />,
          title: `${userName}'s ${streak}-day streak at risk!`,
          subtitle: lastSeen ? `Last seen ${lastSeen}` : `${actionsCompleted}/${totalActions} actions today`,
          gradientColors: ['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)'],
          borderColor: 'rgba(255,107,107,0.3)',
          iconBg: 'rgba(255,107,107,0.2)',
        };
      case 'late':
        return {
          icon: <Clock size={20} color="#FFA500" />,
          title: `${userName} usually checks in by now`,
          subtitle: `Still ${actionsCompleted}/${totalActions} actions today`,
          gradientColors: ['rgba(255,165,0,0.15)', 'rgba(255,165,0,0.05)'],
          borderColor: 'rgba(255,165,0,0.3)',
          iconBg: 'rgba(255,165,0,0.2)',
        };
      default: // 'missing'
        return {
          icon: <AlertTriangle size={20} color="#FFD700" />,
          title: `${userName} hasn't checked in today`,
          subtitle: `${actionsCompleted}/${totalActions} actions completed`,
          gradientColors: ['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)'],
          borderColor: 'rgba(255,215,0,0.3)',
          iconBg: 'rgba(255,215,0,0.2)',
        };
    }
  };

  const config = getCardConfig();

  const handleMotivate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMotivate?.();
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onProfilePress?.(userId);
  };

  return (
    <Pressable style={styles.container} onPress={handleProfilePress}>
      <LinearGradient
        colors={config.gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={[styles.border, { borderColor: config.borderColor }]} />
      
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
            {config.icon}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>
        </View>
        
        {onMotivate && (
          <Pressable 
            style={styles.motivateButton}
            onPress={handleMotivate}
          >
            <Send size={16} color="#FFD700" />
            <Text style={styles.motivateText}>Motivate</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  textContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  
  motivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  
  motivateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
});