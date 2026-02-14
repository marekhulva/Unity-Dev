import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

export const ProgressRing: React.FC<{ size?: number; stroke?: number; progress: number; color?: string; }> = ({
  size=72, stroke=6, progress, color='#FFFFFF'
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, progress));
  const dash = (pct/100) * c;

  React.useEffect(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{}); }, [pct]);

  return (
    <View style={{ width:size, height:size, alignItems:'center', justifyContent:'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none"/>
        <Circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash}, ${c-dash}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
      <Text style={styles.label}>{Math.round(pct)}%</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  label:{
    position:'absolute',
    color:'#FFFFFF',
    fontWeight:'700',
    fontSize: 14,
  }
});