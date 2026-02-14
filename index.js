import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';
import App from './App';

console.log('🟢 index.js loaded');

// Global error handler to catch errors before React renders
const originalErrorHandler = global.ErrorUtils?.getGlobalHandler();

if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🔴 GLOBAL ERROR:', error);
    console.error('🔴 IS FATAL:', isFatal);
    console.error('🔴 STACK:', error.stack);

    setTimeout(() => {
      Alert.alert(
        '❌ App Startup Error',
        `Error: ${error.toString()}\n\nStack: ${error.stack?.substring(0, 300)}...`,
        [{ text: 'OK' }]
      );
    }, 100);

    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);