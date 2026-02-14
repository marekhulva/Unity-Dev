import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

interface PromptChipsProps {
  onPick: (text: string) => void;
}

export const PromptChips: React.FC<PromptChipsProps> = ({ onPick }) => {
  const prompts = [
    "What's your biggest insight today?",
    "The hardest thing about today was...",
    "A small win I'm proud of...",
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {prompts.map((p) => (
        <Pressable
          key={p}
          onPress={() => onPick(p)}
          style={({ pressed }) => [
            styles.chip,
            pressed && styles.chipPressed
          ]}
        >
          <Text style={styles.chipText}>{p}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipPressed: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
});