import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../../state/rootStore';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  
  const { login, register, loading, error, clearError } = useStore();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isRegistering && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    let success = false;
    if (isRegistering) {
      if (__DEV__) console.log('🎯 [LOGIN-SCREEN] Calling register for new user:', email);
      success = await register(email, password, name);
      if (__DEV__) console.log('🎯 [LOGIN-SCREEN] Register result:', success);
      
      // Force a small delay to ensure state updates propagate
      if (success) {
        if (__DEV__) console.log('🎯 [LOGIN-SCREEN] Registration successful, waiting for state update...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      success = await login(email, password);
    }

    if (success) {
      // Navigation will be handled by the app's auth state
      if (__DEV__) console.log('🎯 [LOGIN-SCREEN] Auth successful, navigation should happen automatically');
      // Don't show alert for registration - let onboarding take over
      if (!isRegistering) {
        Alert.alert('Success', 'Welcome back!');
      }
    } else if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Unity</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Create your account' : 'Welcome back'}
        </Text>

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? 'Sign Up' : 'Log In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => {
            setIsRegistering(!isRegistering);
            clearError();
          }}
        >
          <Text style={styles.switchText}>
            {isRegistering 
              ? 'Already have an account? Log in' 
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>

        {/* Test Account Info */}
        {__DEV__ && (
          <View style={styles.testInfo}>
            <Text style={styles.testText}>Test Account:</Text>
            <Text style={styles.testCredentials}>Email: first@user.com</Text>
            <Text style={styles.testCredentials}>Password: test123</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  testInfo: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  testText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: '#666',
  },
  testCredentials: {
    fontSize: 11,
    color: '#999',
  },
});