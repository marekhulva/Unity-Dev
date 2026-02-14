import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CIRCLE_SELECTOR_CONFIG } from './config';
import { CircleSelectorProps } from './CircleSelectorProps';
import { TabBarSelector } from './TabBarSelector';
import { DropdownSelector } from './DropdownSelector';
// Future implementations (uncomment when created):
// import { IconOnlySelector } from './IconOnlySelector';

/**
 * Main CircleSelector component
 * Switches between different implementations based on config
 * To change implementation, edit config.ts
 */
export const CircleSelector: React.FC<CircleSelectorProps> = (props) => {
  const { loading, error } = props;

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading circles...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading circles: {error}</Text>
      </View>
    );
  }

  // Switch implementation based on config
  switch (CIRCLE_SELECTOR_CONFIG.implementation) {
    case 'TAB_BAR':
      return <TabBarSelector {...props} />;

    case 'DROPDOWN':
      return <DropdownSelector {...props} />;

    case 'ICONS':
      if (__DEV__) console.warn('Icons selector not yet implemented, falling back to TabBar');
      return <TabBarSelector {...props} />;
      // return <IconOnlySelector {...props} />;

    default:
      return <TabBarSelector {...props} />;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
});

export default CircleSelector;