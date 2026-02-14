import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, User, ChevronRight, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useStore } from '../../state/rootStore';
import { supabase } from '../../services/supabase.service';

const { width, height } = Dimensions.get('window');

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const { user, updateAvatar, updateBio } = useStore();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const bioInputRef = useRef<View>(null);
  
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Auto-scroll to bio input when keyboard appears
        setTimeout(() => {
          bioInputRef.current?.measureInWindow((x, y, width, height) => {
            const screenHeight = Dimensions.get('window').height;
            const keyboardTop = screenHeight - e.endCoordinates.height;
            const inputBottom = y + height;
            
            if (inputBottom > keyboardTop - 100) {
              scrollViewRef.current?.scrollTo({
                y: inputBottom - keyboardTop + 150,
                animated: true
              });
            }
          });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(base64Image);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(base64Image);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    buttonScale.value = withSpring(0.95, { damping: 10 });

    try {
      let savedSuccessfully = true;

      if (profileImage) {
        if (__DEV__) console.log('🔵 [PROFILE-SETUP] Saving profile image...');
        const avatarSuccess = await updateAvatar(profileImage);
        if (!avatarSuccess) {
          if (__DEV__) console.log('🔴 [PROFILE-SETUP] Failed to save avatar');
          savedSuccessfully = false;
        } else {
          if (__DEV__) console.log('✅ [PROFILE-SETUP] Avatar saved successfully');
        }
      }

      if (bio.trim()) {
        if (__DEV__) console.log('🔵 [PROFILE-SETUP] Saving bio:', bio);
        const bioSuccess = await updateBio(bio);
        if (!bioSuccess) {
          if (__DEV__) console.log('🔴 [PROFILE-SETUP] Failed to save bio');
          savedSuccessfully = false;
        } else {
          if (__DEV__) console.log('✅ [PROFILE-SETUP] Bio saved successfully');
        }
      }

      if (!savedSuccessfully) {
        Alert.alert('Warning', 'Some information could not be saved, but you can update it later in your profile.');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (__DEV__) console.log('🟢 [PROFILE-SETUP] Profile setup complete, proceeding to onboarding');
      onComplete();
    } catch (error) {
      if (__DEV__) console.error('🔴 [PROFILE-SETUP] Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. You can update it later in your profile settings.');
      onComplete();
    } finally {
      setIsLoading(false);
      buttonScale.value = withSpring(1, { damping: 10 });
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can always add a photo and bio later from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            if (__DEV__) console.log('🟡 [PROFILE-SETUP] User skipped profile setup');
            onComplete();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          bounces={true}
        >
          <Animated.View 
            entering={FadeInUp.delay(100).springify()}
            style={styles.headerSection}
          >
            <View style={styles.iconContainer}>
              <Sparkles size={32} color="#FFD700" />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Add a photo and tell us a bit about yourself
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(200).springify()}
            style={styles.avatarSection}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.avatarRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={48} color="rgba(255,255,255,0.5)" />
                  </View>
                )}
              </View>
            </LinearGradient>

            <View style={styles.photoButtons}>
              <Pressable style={styles.photoButton} onPress={takePhoto}>
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </Pressable>
              <Pressable style={styles.photoButton} onPress={pickImage}>
                <Image 
                  source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                  style={{ width: 20, height: 20 }}
                />
                <Text style={styles.photoButtonText}>Choose Photo</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(300).springify()}
            style={styles.bioSection}
            ref={bioInputRef}
          >
            <Text style={styles.bioLabel}>Your Bio</Text>
            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                placeholder="Tell us about yourself... (optional)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={bio}
                onChangeText={setBio}
                maxLength={60}
                multiline
                numberOfLines={2}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                onFocus={() => {
                  // Scroll to bio input when focused
                  setTimeout(() => {
                    bioInputRef.current?.measureInWindow((x, y, width, height) => {
                      scrollViewRef.current?.scrollTo({
                        y: y - 100,
                        animated: true
                      });
                    });
                  }, 300);
                }}
              />
              <Text style={styles.charCount}>{bio.length}/60</Text>
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            style={styles.buttonSection}
          >
            <Animated.View style={buttonStyle}>
              <Pressable
                style={styles.continueButton}
                onPress={handleContinue}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.continueButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <>
                      <Text style={styles.continueButtonText}>Continue</Text>
                      <ChevronRight size={20} color="#000000" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 3,
    marginBottom: 24,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 63,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bioSection: {
    marginBottom: 40,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bioInputContainer: {
    position: 'relative',
  },
  bioInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 32,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 80,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  buttonSection: {
    gap: 12,
  },
  continueButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});