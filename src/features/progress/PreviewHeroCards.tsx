import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  OptionA_BalancedGrid, 
  OptionB_HeroStats, 
  OptionC_Dashboard 
} from './HeroCardDesigns';

export const PreviewHeroCards = () => {
  // Sample data
  const data = {
    consistency: 75,
    totalScore: 780,
    streak: 12,
    activeGoals: 3,
    todayCompleted: 2,
    todayTotal: 5
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Hero Card Design Options</Text>
        
        <View style={styles.optionContainer}>
          <Text style={styles.optionTitle}>Option A: Balanced Grid</Text>
          <OptionA_BalancedGrid {...data} />
        </View>
        
        <View style={styles.optionContainer}>
          <Text style={styles.optionTitle}>Option B: Hero + Stats Row</Text>
          <OptionB_HeroStats {...data} />
        </View>
        
        <View style={styles.optionContainer}>
          <Text style={styles.optionTitle}>Option C: Dashboard Style</Text>
          <OptionC_Dashboard {...data} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginVertical: 20,
  },
  optionContainer: {
    marginBottom: 40,
  },
  optionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    marginLeft: 20,
    opacity: 0.7,
  },
});