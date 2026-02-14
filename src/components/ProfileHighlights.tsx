import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Highlight {
  id: string;
  title: string;
  icon: string;
  color: string;
  count?: number;
}

interface ProfileHighlightsProps {
  highlights: Highlight[];
  onHighlightPress: (highlightId: string) => void;
}

export const ProfileHighlights: React.FC<ProfileHighlightsProps> = ({
  highlights,
  onHighlightPress,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {highlights.map((highlight, index) => (
          <Pressable
            key={highlight.id}
            style={styles.highlightItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onHighlightPress(highlight.id);
            }}
          >
            <View style={styles.highlightCircle}>
              <LinearGradient
                colors={[highlight.color, `${highlight.color}88`]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.innerCircle}>
                <Text style={styles.highlightIcon}>{highlight.icon}</Text>
                {highlight.count && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{highlight.count}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.highlightTitle} numberOfLines={1}>
              {highlight.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  highlightItem: {
    alignItems: 'center',
    width: 70,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    marginBottom: 8,
  },
  innerCircle: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  highlightIcon: {
    fontSize: 28,
  },
  highlightTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000',
  },
  countText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
});