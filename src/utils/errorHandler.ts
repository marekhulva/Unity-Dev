// Comprehensive Error Handling System
// Provides consistent error handling, retry mechanisms, and user-friendly messages

import { HapticManager } from './haptics';

export interface ErrorContext {
  action: string;
  component?: string;
  userId?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  triggerHaptic?: boolean;
  logError?: boolean;
  retryConfig?: Partial<RetryConfig>;
  fallbackMessage?: string;
}

export type ErrorType = 
  | 'network'
  | 'authentication' 
  | 'validation'
  | 'server'
  | 'unknown'
  | 'permission'
  | 'timeout'
  | 'parse'
  | 'storage';

export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = 'unknown',
    public code?: string,
    public context?: ErrorContext,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorHandler = {
  // DEFAULT CONFIGURATIONS
  defaultRetryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
  } as RetryConfig,

  // ERROR CLASSIFICATION
  classifyError: (error: any): ErrorType => {
    if (!error) return 'unknown';
    
    // Network errors
    if (error.message?.includes('Network') || 
        error.code === 'NETWORK_ERROR' ||
        error.name === 'TypeError' && error.message?.includes('fetch')) {
      return 'network';
    }
    
    // Authentication errors
    if (error.status === 401 || error.code === 'AUTH_ERROR') {
      return 'authentication';
    }
    
    // Validation errors
    if (error.status === 400 || error.code === 'VALIDATION_ERROR') {
      return 'validation';
    }
    
    // Server errors
    if (error.status >= 500 || error.code === 'SERVER_ERROR') {
      return 'server';
    }
    
    // Permission errors
    if (error.status === 403 || error.code === 'PERMISSION_ERROR') {
      return 'permission';
    }
    
    // Timeout errors
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return 'timeout';
    }
    
    // Parse errors
    if (error instanceof SyntaxError || error.code === 'PARSE_ERROR') {
      return 'parse';
    }
    
    // Storage errors
    if (error.code === 'STORAGE_ERROR' || error.message?.includes('storage')) {
      return 'storage';
    }
    
    return 'unknown';
  },

  // USER-FRIENDLY ERROR MESSAGES
  getUserMessage: (error: any, fallback?: string): string => {
    const errorType = ErrorHandler.classifyError(error);
    
    const messages = {
      network: "Looks like you're offline. Please check your internet connection and try again.",
      authentication: "Your session has expired. Please log in again.",
      validation: "Please check your input and try again.",
      server: "Our servers are experiencing issues. We're working to fix this.",
      permission: "You don't have permission to perform this action.",
      timeout: "The request took too long. Please try again.",
      parse: "Something went wrong processing the data. Please try again.",
      storage: "Unable to save data locally. Please check your device storage.",
      unknown: "Something unexpected happened. Please try again.",
    };
    
    return fallback || messages[errorType] || messages.unknown;
  },

  // RETRY MECHANISM
  createRetryFunction: <T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ) => {
    const retryConfig = { ...ErrorHandler.defaultRetryConfig, ...config };
    
    return async (attempt: number = 1): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (attempt >= retryConfig.maxAttempts) {
          throw error;
        }
        
        // Check if error is retryable
        const isRetryable = ErrorHandler.isRetryableError(error);
        if (!isRetryable) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        let delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
          retryConfig.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        if (retryConfig.jitter) {
          delay += Math.random() * 1000;
        }
        
        if (__DEV__) console.log(`Retrying attempt ${attempt + 1} after ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return ErrorHandler.createRetryFunction(fn, config)(attempt + 1);
      }
    };
  },

  // CHECK IF ERROR IS RETRYABLE
  isRetryableError: (error: any): boolean => {
    const errorType = ErrorHandler.classifyError(error);
    const retryableTypes: ErrorType[] = ['network', 'server', 'timeout'];
    
    // Don't retry authentication or validation errors
    if (['authentication', 'validation', 'permission'].includes(errorType)) {
      return false;
    }
    
    return retryableTypes.includes(errorType);
  },

  // HANDLE ERROR WITH OPTIONS
  handleError: async (
    error: any,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      triggerHaptic = true,
      logError = true,
      fallbackMessage,
    } = options;
    
    // Create structured error
    const appError = new AppError(
      ErrorHandler.getUserMessage(error, fallbackMessage),
      ErrorHandler.classifyError(error),
      error.code,
      context,
      ErrorHandler.isRetryableError(error)
    );
    
    // Log error
    if (logError) {
      ErrorHandler.logError(appError, context);
    }
    
    // Trigger haptic feedback
    if (triggerHaptic) {
      const errorType = ErrorHandler.classifyError(error);
      if (errorType === 'network') {
        HapticManager.warning.attention();
      } else if (errorType === 'validation') {
        HapticManager.error.light();
      } else {
        HapticManager.error.shake();
      }
    }
    
    // Show toast notification (would implement with your toast library)
    if (showToast) {
      if (__DEV__) console.log('Toast:', appError.message); // Replace with actual toast
    }
    
    return appError;
  },

  // LOGGING
  logError: (error: AppError, context: ErrorContext) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack,
        isRetryable: error.isRetryable,
      },
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
      url: typeof window !== 'undefined' && window.location ? window.location.href : 'mobile-app',
    };
    
    // Log to console in development
    if (__DEV__) {
      if (__DEV__) console.error('Error logged:', logEntry);
    }
    
    // In production, send to crash reporting service
    // crashReporting.log(logEntry);
  },

  // ASYNC ERROR WRAPPER
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: Omit<ErrorContext, 'timestamp'>,
    options: ErrorHandlerOptions = {}
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        const fullContext = {
          ...context,
          timestamp: new Date(),
        };
        
        const handledError = await ErrorHandler.handleError(error, fullContext, options);
        throw handledError;
      }
    };
  },

  // ASYNC ERROR WRAPPER WITH RETRY
  withErrorHandlingAndRetry: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: Omit<ErrorContext, 'timestamp'>,
    options: ErrorHandlerOptions = {}
  ) => {
    const retryFn = ErrorHandler.createRetryFunction(
      () => fn(...arguments as any),
      options.retryConfig
    );
    
    return ErrorHandler.withErrorHandling(retryFn, context, options);
  },

  // SAFE ASYNC EXECUTION
  safeAsync: async <T>(
    promise: Promise<T>,
    fallback?: T
  ): Promise<{ data?: T; error?: AppError }> => {
    try {
      const data = await promise;
      return { data };
    } catch (error) {
      const context: ErrorContext = {
        action: 'safeAsync',
        timestamp: new Date(),
      };
      
      const handledError = await ErrorHandler.handleError(error, context, {
        showToast: false,
        triggerHaptic: false,
      });
      
      return { error: handledError, data: fallback };
    }
  },
};

// SPECIALIZED ERROR HANDLERS
export const NetworkErrorHandler = {
  handleApiError: async (error: any, endpoint: string) => {
    const context: ErrorContext = {
      action: 'API_CALL',
      component: 'ApiService',
      timestamp: new Date(),
      additionalData: { endpoint },
    };
    
    return ErrorHandler.handleError(error, context, {
      retryConfig: { maxAttempts: 3, baseDelay: 1000 },
    });
  },

  handleOfflineError: () => {
    const context: ErrorContext = {
      action: 'OFFLINE_DETECTED',
      timestamp: new Date(),
    };
    
    return ErrorHandler.handleError(
      new AppError('You appear to be offline', 'network'),
      context,
      { showToast: true, triggerHaptic: true }
    );
  },
};

export const AuthErrorHandler = {
  handleAuthError: async (error: any) => {
    const context: ErrorContext = {
      action: 'AUTHENTICATION',
      timestamp: new Date(),
    };
    
    // Clear auth state, redirect to login
    return ErrorHandler.handleError(error, context, {
      fallbackMessage: 'Please log in again to continue',
    });
  },
};

export const DataErrorHandler = {
  handleSaveError: async (error: any, dataType: string) => {
    const context: ErrorContext = {
      action: 'DATA_SAVE',
      timestamp: new Date(),
      additionalData: { dataType },
    };
    
    return ErrorHandler.handleError(error, context, {
      retryConfig: { maxAttempts: 2, baseDelay: 500 },
      fallbackMessage: `Failed to save ${dataType}. Your changes may be lost.`,
    });
  },

  handleLoadError: async (error: any, dataType: string) => {
    const context: ErrorContext = {
      action: 'DATA_LOAD',
      timestamp: new Date(),
      additionalData: { dataType },
    };
    
    return ErrorHandler.handleError(error, context, {
      retryConfig: { maxAttempts: 3, baseDelay: 1000 },
      fallbackMessage: `Failed to load ${dataType}. Please try again.`,
    });
  },
};