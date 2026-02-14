import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const GradientText: React.FC<{children:string|number; size?:number}> = ({children, size=28}) => {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#FFFFFF','#BFC3CC']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.grad, {height:size}]}/>
      <Text style={[styles.text,{fontSize:size}]}>{children}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  wrap:{ position:'relative' },
  grad:{ position:'absolute', width:'100%', opacity:0.35 },
  text:{ color:'#FFFFFF', fontWeight:'700' }
});