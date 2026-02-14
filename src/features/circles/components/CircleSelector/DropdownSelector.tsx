import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleSelectorProps } from './CircleSelectorProps';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DropdownSelector: React.FC<CircleSelectorProps> = ({
  circles,
  activeCircleId,
  onCircleSelect,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelect = (circleId: string | null) => {
    onCircleSelect(circleId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const activeCircle = circles.find(c => c.id === activeCircleId);
  const displayName = activeCircle?.name || 'ALL CIRCLES';

  return (
    <View style={[styles.container, style, { position: 'relative', zIndex: 9999 }]}>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        {/* Subtle gold gradient border */}
        <View style={styles.borderTop}>
          <LinearGradient
            colors={[
              'rgba(212, 175, 55, 0.3)',
              'rgba(184, 134, 11, 0.3)',
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        <View style={styles.borderBottom}>
          <LinearGradient
            colors={[
              'rgba(212, 175, 55, 0.3)',
              'rgba(184, 134, 11, 0.3)',
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        <View style={styles.borderLeft}>
          <LinearGradient
            colors={[
              'rgba(212, 175, 55, 0.3)',
              'rgba(184, 134, 11, 0.3)',
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        <View style={styles.borderRight}>
          <LinearGradient
            colors={[
              'rgba(212, 175, 55, 0.3)',
              'rgba(184, 134, 11, 0.3)',
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        <View style={styles.triggerContent}>
          <Text style={styles.triggerText}>{displayName}</Text>
          <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Dropdown Menu */}
      {isExpanded && (
        <View style={styles.menu}>
          {/* Gold gradient border for menu */}
          <View style={styles.menuBorderTop}>
            <LinearGradient
              colors={[
                'rgba(212, 175, 55, 0.4)',
                'rgba(184, 134, 11, 0.4)',
              ]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>

          <View style={styles.menuBorderBottom}>
            <LinearGradient
              colors={[
                'rgba(212, 175, 55, 0.4)',
                'rgba(184, 134, 11, 0.4)',
              ]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>

          <View style={styles.menuBorderLeft}>
            <LinearGradient
              colors={[
                'rgba(212, 175, 55, 0.4)',
                'rgba(184, 134, 11, 0.4)',
              ]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>

          <View style={styles.menuBorderRight}>
            <LinearGradient
              colors={[
                'rgba(212, 175, 55, 0.4)',
                'rgba(184, 134, 11, 0.4)',
              ]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>

          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* All Circles option */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeCircleId === null && styles.menuItemActive,
              ]}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.menuItemText,
                  activeCircleId === null && styles.menuItemTextActive,
                ]}
              >
                ALL CIRCLES
              </Text>
            </TouchableOpacity>

            {/* Individual circles */}
            {circles.map((circle) => (
              <TouchableOpacity
                key={circle.id}
                style={[
                  styles.menuItem,
                  circle.id === activeCircleId && styles.menuItemActive,
                ]}
                onPress={() => handleSelect(circle.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    circle.id === activeCircleId && styles.menuItemTextActive,
                  ]}
                >
                  {circle.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  trigger: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
    alignSelf: 'center',
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.75,
    zIndex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0.75,
    zIndex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0.75,
    zIndex: 1,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
  },
  borderRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 0.75,
    zIndex: 1,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  triggerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  arrow: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    overflow: 'hidden',
    maxHeight: 300,
    minWidth: 200,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 99999,
  },
  menuBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.75,
    zIndex: 1,
  },
  menuBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0.75,
    zIndex: 1,
  },
  menuBorderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0.75,
    zIndex: 1,
  },
  menuBorderRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 0.75,
    zIndex: 1,
  },
  menuScroll: {
    padding: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemText: {
    fontSize: 13,
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
