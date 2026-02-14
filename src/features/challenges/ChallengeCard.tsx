import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Users, Clock, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface ChallengeCardProps {
  challenge: {
    id: string;
    title?: string;
    name?: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'upcoming' | 'active' | 'completed';
    icon?: string;
    min_activities: number;
    max_activities: number;
    challenge_activities?: any[];
  };
  isJoined: boolean;
  onJoin: () => void;
  onViewDetails: () => void;
  index: number;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  isJoined,
  onJoin,
  onViewDetails,
  index,
}) => {
  const getDaysRemaining = () => {
    const end = new Date(challenge.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusColor = () => {
    switch (challenge.status) {
      case 'upcoming': return '#4CAF50';
      case 'active': return '#FFD700';
      case 'completed': return '#9E9E9E';
      default: return '#FFD700';
    }
  };

  const getStatusText = () => {
    switch (challenge.status) {
      case 'upcoming':
        const start = new Date(challenge.start_date);
        const daysUntil = Math.ceil((start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return `Starts in ${daysUntil} days`;
      case 'active':
        const remaining = getDaysRemaining();
        return `${remaining} days remaining`;
      case 'completed':
        return 'Challenge completed';
      default:
        return '';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(255,215,0,0.05)', 'rgba(255,215,0,0.02)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.icon}>{challenge.icon || '🏆'}</Text>
          <View>
            <Text style={styles.title}>{challenge.title || challenge.name || 'Challenge'}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {challenge.description}
      </Text>
      
      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Users size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.infoText}>
            {challenge.challenge_activities?.length || 0} activities
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Trophy size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.infoText}>
            Pick {challenge.min_activities}-{challenge.max_activities}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Clock size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.infoText}>
            {Math.ceil((new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
          </Text>
        </View>
      </View>
      
      {/* Action Button */}
      {challenge.status === 'upcoming' || challenge.status === 'active' ? (
        isJoined ? (
          <Pressable
            style={styles.viewButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewDetails();
            }}
          >
            <Text style={styles.viewButtonText}>View Progress</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.joinButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onJoin();
            }}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.joinButtonText}>Join Challenge</Text>
          </Pressable>
        )
      ) : (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>Challenge Ended</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  joinButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
  },
  viewButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 1,
  },
  completedBadge: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
  },
});