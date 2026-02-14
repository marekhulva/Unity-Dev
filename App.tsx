import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppWithAuth } from './src/AppWithAuth';
import { WebContainer } from './src/components/WebContainer';
import { ProfileTimelineDemo } from './src/demos/ProfileTimelineDemo';

export default function App() {
  // Check for demo mode via URL param (web only)
  let isDemoMode = false;
  try {
    isDemoMode = typeof window !== 'undefined' &&
                 window.location &&
                 window.location.search &&
                 window.location.search.includes('demo=timeline');
  } catch (error) {
    // Silently ignore - we're not in a web environment
    isDemoMode = false;
  }

  if (isDemoMode) {
    return (
      <SafeAreaProvider>
        <View style={{ flex:1, backgroundColor: '#000' }}>
          <StatusBar barStyle="light-content" />
          <ProfileTimelineDemo />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WebContainer>
          <View style={{ flex:1 }}>
            <StatusBar barStyle="light-content" />
            <AppWithAuth />
          </View>
        </WebContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}