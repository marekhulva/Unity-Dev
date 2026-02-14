// Error Boundary Component
// Catches JavaScript errors anywhere in the component tree and displays a fallback UI

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react-native';
import { LuxuryTheme } from '../design/luxuryTheme';
import { DesignTokens } from '../design/designTokens';
import { HapticManager } from '../utils/haptics';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Log error to crash reporting service
    if (__DEV__) console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Trigger haptic feedback for error
    HapticManager.error.strong();
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    HapticManager.interaction.premiumPress();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    HapticManager.navigation.pageChange();
    // Reset the error boundary and navigate to home
    this.setState({ hasError: false, error: null, errorInfo: null });
    // You would implement navigation to home screen here
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleRetry} 
          />
        );
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#000000', '#1A1A1A']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <Animated.View 
            entering={FadeIn.duration(600)}
            style={styles.content}
          >
            <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              <Animated.View 
                entering={SlideInDown.delay(200).springify()}
                style={styles.iconContainer}
              >
                <AlertTriangle size={64} color="#EF4444" strokeWidth={1.5} />
              </Animated.View>

              <Animated.View 
                entering={FadeIn.delay(400)}
                style={styles.textContainer}
              >
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.subtitle}>
                  We encountered an unexpected error. Don't worry, your data is safe.
                </Text>
                
                {__DEV__ && this.state.error && (
                  <View style={styles.errorDetails}>
                    <Text style={styles.errorTitle}>Error Details:</Text>
                    <Text style={styles.errorMessage}>{this.state.error.message}</Text>
                  </View>
                )}
              </Animated.View>

              <Animated.View 
                entering={SlideInDown.delay(600).springify()}
                style={styles.actions}
              >
                <Pressable
                  style={styles.retryButton}
                  onPress={this.handleRetry}
                >
                  <LinearGradient
                    colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <RotateCcw size={20} color="#000" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>

                <Pressable
                  style={styles.homeButton}
                  onPress={this.handleGoHome}
                >
                  <Home size={20} color={LuxuryTheme.colors.text.primary} />
                  <Text style={styles.homeButtonText}>Go Home</Text>
                </Pressable>
              </Animated.View>
            </BlurView>
          </Animated.View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Error fallback component for specific use cases
export const ErrorFallback: React.FC<{ 
  error: Error; 
  retry: () => void;
  title?: string;
  subtitle?: string;
}> = ({ 
  error, 
  retry, 
  title = "Oops! Something went wrong",
  subtitle = "We're working on fixing this issue." 
}) => {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.fallbackContainer}>
      <View style={styles.fallbackContent}>
        <AlertTriangle size={48} color="#EF4444" strokeWidth={1.5} />
        <Text style={styles.fallbackTitle}>{title}</Text>
        <Text style={styles.fallbackSubtitle}>{subtitle}</Text>
        
        <Pressable style={styles.fallbackButton} onPress={retry}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <RotateCcw size={16} color={LuxuryTheme.colors.primary.gold} />
          <Text style={styles.fallbackButtonText}>Retry</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: DesignTokens.borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  blurContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: DesignTokens.spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  title: {
    fontSize: DesignTokens.typography.sizes.xxl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: LuxuryTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    fontSize: DesignTokens.typography.sizes.md,
    color: LuxuryTheme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: DesignTokens.typography.sizes.md * 1.5,
  },
  errorDetails: {
    marginTop: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorTitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: '#EF4444',
    marginBottom: DesignTokens.spacing.xs,
  },
  errorMessage: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: LuxuryTheme.colors.text.muted,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.lg,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: '#000',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  homeButtonText: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: LuxuryTheme.colors.text.primary,
  },
  
  // Fallback component styles
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  fallbackContent: {
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: DesignTokens.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  fallbackTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: LuxuryTheme.colors.text.primary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
  },
  fallbackSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: LuxuryTheme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    overflow: 'hidden',
  },
  fallbackButtonText: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: LuxuryTheme.colors.primary.gold,
  },
});