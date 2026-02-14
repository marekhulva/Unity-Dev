import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LightGeometricBackground: React.FC = () => {
  // Create vertical lines with perspective - converging at bottom
  const lines = [];
  const numLines = 24; // Number of vertical lines
  const centerX = screenWidth / 2;
  const vanishingY = screenHeight * 1.5; // Vanishing point below screen
  
  for (let i = 0; i < numLines; i++) {
    // Distribute lines evenly across the top
    const startX = (screenWidth / (numLines - 1)) * i;
    
    // Calculate end position converging toward center
    const distanceFromCenter = startX - centerX;
    const convergenceFactor = 0.3; // How much lines converge
    const endX = centerX + (distanceFromCenter * convergenceFactor);
    
    // Vary line opacity based on distance from center for depth
    const opacity = 0.08 + (Math.abs(distanceFromCenter) / screenWidth) * 0.12;
    
    lines.push(
      <Line
        key={i}
        x1={startX}
        y1={0}
        x2={endX}
        y2={vanishingY}
        stroke={`rgba(0,0,0,${opacity})`}
        strokeWidth="0.5"
      />
    );
  }
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* White base */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FAFAFA' }]} />
      
      {/* SVG Pattern */}
      <Svg 
        style={StyleSheet.absoluteFillObject} 
        width={screenWidth} 
        height={screenHeight}
        viewBox={`0 0 ${screenWidth} ${screenHeight}`}
      >
        <Defs>
          {/* Subtle gradient overlay for depth */}
          <SvgLinearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="white" stopOpacity="0" />
            <Stop offset="70%" stopColor="white" stopOpacity="0" />
            <Stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Vertical perspective lines */}
        {lines}
        
        {/* Gradient overlay for fade effect at bottom */}
        <Rect 
          x="0" 
          y="0" 
          width={screenWidth} 
          height={screenHeight} 
          fill="url(#fadeGradient)" 
        />
      </Svg>
    </View>
  );
};