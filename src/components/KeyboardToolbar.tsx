import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  InputAccessoryView,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface KeyboardToolbarProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitText?: string;
  submitDisabled?: boolean;
  nativeID?: string; // For iOS InputAccessoryView
  children?: React.ReactNode; // Optional additional controls
}

export const KeyboardToolbar: React.FC<KeyboardToolbarProps> = ({
  onCancel,
  onSubmit,
  submitText = 'Share',
  submitDisabled = false,
  nativeID,
  children,
}) => {
  const insets = useSafeAreaInsets();

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onCancel?.();
  };

  const handleSubmit = () => {
    if (!submitDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSubmit?.();
    }
  };

  const ToolbarContent = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(20,20,20,0.98)']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {/* Cancel button */}
        <Pressable
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        {/* Optional middle content */}
        {children && (
          <View style={styles.middleContent}>
            {children}
          </View>
        )}

        {/* Submit button */}
        <Pressable
          style={[styles.submitButton, submitDisabled && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitDisabled}
        >
          <LinearGradient
            colors={submitDisabled
              ? ['rgba(100,100,100,0.5)', 'rgba(80,80,80,0.5)']
              : ['#FFD700', '#FFA500']
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={[styles.submitText, submitDisabled && styles.submitTextDisabled]}>
            {submitText}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // iOS: Use native InputAccessoryView
  if (Platform.OS === 'ios' && nativeID) {
    return (
      <InputAccessoryView nativeID={nativeID}>
        <ToolbarContent />
      </InputAccessoryView>
    );
  }

  // Android/Web: Return toolbar content to be positioned manually
  return <ToolbarContent />;
};

// Hook to handle keyboard toolbar positioning on Android
export const useKeyboardToolbar = () => {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    toolbarStyle: {
      position: 'absolute' as const,
      bottom: keyboardHeight,
      left: 0,
      right: 0,
      zIndex: 999,
    },
  };
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  middleContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  submitButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  submitTextDisabled: {
    color: 'rgba(0,0,0,0.5)',
  },
});