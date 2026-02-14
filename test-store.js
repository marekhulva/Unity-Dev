// Quick test to see if store initializes without errors
try {
  console.log('Testing store initialization...');
  const { useStore } = require('./src/state/rootStore');
  console.log('Store created successfully!');
  console.log('Store keys:', Object.keys(useStore.getState()));
} catch (error) {
  console.error('Store initialization failed:', error);
  console.error('Stack:', error.stack);
}
