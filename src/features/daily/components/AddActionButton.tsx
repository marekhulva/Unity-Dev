import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

interface AddActionButtonProps {
  onPress: () => void;
}

export const AddActionButton: React.FC<AddActionButtonProps> = ({ onPress }) => {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Plus size={18} color="rgba(212,175,55,0.5)" strokeWidth={2} />
      <Text style={styles.text}>Add Action</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(212,175,55,0.5)',
  },
});
