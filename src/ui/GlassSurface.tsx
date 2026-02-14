import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../design/theme';

type Props = ViewProps & { 
  intensity?: number; 
  border?: boolean; 
  tint?: 'light'|'dark'|'default';
  neonGlow?: 'blue' | 'green' | 'purple' | 'pink' | 'none';
};

export const GlassSurface: React.FC<Props> = ({ 
  style, 
  children, 
  intensity=20, 
  border=true, 
  tint='dark',
  neonGlow='none',
  ...rest 
}) => {
  const getNeonColor = () => {
    if (neonGlow === 'none') return 'transparent';
    const neonColors = {
      blue: theme.colors.glowGoalDim,
      green: theme.colors.glowPerformanceDim,
      purple: theme.colors.glowCommitmentDim,
      pink: '#FF006E80', // Pink dim color
    };
    return neonColors[neonGlow];
  };

  const neonColor = getNeonColor();
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          borderColor: neonGlow !== 'none' ? neonColor : (border ? theme.colors.glassBorder : 'transparent'),
          shadowColor: neonGlow !== 'none' ? neonColor : 'transparent',
        }, 
        neonGlow !== 'none' && styles.neonShadow,
        style
      ]} 
      {...rest}
    >
      <BlurView tint={tint} intensity={intensity} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.fill, { backgroundColor: theme.colors.glassFill }]} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    borderWidth: 1, 
    overflow: 'hidden', 
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fill: { 
    ...StyleSheet.absoluteFillObject,
  },
  neonShadow: {
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});