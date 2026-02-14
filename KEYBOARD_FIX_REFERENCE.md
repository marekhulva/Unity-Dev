# iOS Keyboard Overlap Fix Reference

## Problem
When opening modals with text input on iPhone, the keyboard can overlap the input field, making it impossible to see what you're typing.

## Solution Applied
We fixed this in `ShareComposer.tsx` using the following approach:

### 1. Import Required Components
```typescript
import { 
  Modal, 
  View, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform 
} from 'react-native';
```

### 2. Wrap Modal Content
```typescript
<Modal visible={shareOpen} transparent animationType="slide">
  <KeyboardAvoidingView 
    style={styles.overlay}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
  >
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Your modal content here */}
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>
```

### 3. Key Points
- **KeyboardAvoidingView**: Automatically adjusts view when keyboard appears
- **behavior="padding"**: For iOS, adds padding to push content up
- **ScrollView**: Allows scrolling when keyboard reduces available space
- **keyboardShouldPersistTaps="handled"**: Ensures taps work properly
- **animationType="slide"**: Better visual transition with keyboard

## When to Use This Pattern
- Any modal with text input
- Forms that might be covered by keyboard
- Bottom sheets with input fields
- Chat interfaces

## Alternative Solutions
1. **react-native-keyboard-aware-scroll-view**: Third-party package with more features
2. **Adjusting contentInset**: For ScrollView-based solutions
3. **Using Animated API**: For custom keyboard animations
4. **IQKeyboardManager**: iOS-specific native solution

## Files Using This Fix
- `/src/features/social/ShareComposer.tsx`