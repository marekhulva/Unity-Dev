// State Persistence Manager
// Handles automatic persistence of Zustand state to AsyncStorage
//
// CHANGE LOG:
// 2026-02-10: Reduced debounce delay from 2000ms to 400ms (Issue #15)
//   - Minimizes data loss window if app is killed during save
//   - Still batches rapid changes to prevent excessive writes
//   - Data loss risk reduced from 2 seconds to 400ms

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateCreator } from 'zustand';
import { ErrorHandler, DataErrorHandler } from '../utils/errorHandler';

export interface PersistConfig {
  name: string;
  version?: number;
  whitelist?: string[];
  blacklist?: string[];
  migrate?: (persistedState: any, version: number) => any;
  storage?: {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
  };
}

const defaultStorage = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem,
};

export const createPersist = <T extends object>(
  config: PersistConfig,
  stateCreator: StateCreator<T>
): StateCreator<T> => {
  return (set, get, api) => {
    const {
      name,
      version = 1,
      whitelist,
      blacklist,
      migrate,
      storage = defaultStorage,
    } = config;

    // Load persisted state
    const loadPersistedState = async () => {
      try {
        const serializedState = await storage.getItem(name);
        if (!serializedState) return null;

        const parsedState = JSON.parse(serializedState);
        
        // Handle version migration
        if (parsedState._version !== version && migrate) {
          const migratedState = migrate(parsedState, parsedState._version || 0);
          return migratedState;
        }

        // Filter state based on whitelist/blacklist
        if (whitelist) {
          const filteredState: any = {};
          whitelist.forEach(key => {
            if (parsedState[key] !== undefined) {
              filteredState[key] = parsedState[key];
            }
          });
          return filteredState;
        }

        if (blacklist) {
          const filteredState = { ...parsedState };
          blacklist.forEach(key => {
            delete filteredState[key];
          });
          return filteredState;
        }

        return parsedState;
      } catch (error) {
        await DataErrorHandler.handleLoadError(error, `persisted state: ${name}`);
        return null;
      }
    };

    // Save state to storage
    const saveState = async (state: T) => {
      try {
        let stateToSave: any = { ...state };

        // Filter state based on whitelist/blacklist
        if (whitelist) {
          const filteredState: any = {};
          whitelist.forEach(key => {
            if (stateToSave[key] !== undefined) {
              filteredState[key] = stateToSave[key];
            }
          });
          stateToSave = filteredState;
        }

        if (blacklist) {
          blacklist.forEach(key => {
            delete stateToSave[key];
          });
        }

        // Add version
        stateToSave._version = version;

        const serializedState = JSON.stringify(stateToSave);
        await storage.setItem(name, serializedState);
      } catch (error) {
        await DataErrorHandler.handleSaveError(error, `state: ${name}`);
      }
    };

    // Debounced save - max 1 save per 400ms
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveState(get());
        saveTimeout = null;
      }, 400);
    };

    // Create state with persistence
    const state = stateCreator(
      (partial, replace) => {
        set(partial, replace);
        // Debounced save instead of immediate
        debouncedSave();
      },
      get,
      api
    );

    // Load initial state
    loadPersistedState().then(persistedState => {
      if (persistedState) {
        // Merge persisted state with initial state (don't replace functions)
        set(persistedState as any, false);
      }
    });

    return state;
  };
};

// Migration helpers
export const createMigration = (migrations: Record<number, (state: any) => any>) => {
  return (persistedState: any, version: number) => {
    let currentState = persistedState;
    
    // Apply migrations sequentially
    Object.keys(migrations)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(migrationVersion => {
        if (version < migrationVersion) {
          currentState = migrations[migrationVersion](currentState);
        }
      });

    return currentState;
  };
};

// Selective persistence utilities
export const createSelectivePersist = (keys: string[]) => ({
  whitelist: keys,
});

export const createBlacklistPersist = (keys: string[]) => ({
  blacklist: keys,
});

// Storage adapters
export const createMemoryStorage = () => {
  const storage = new Map<string, string>();
  
  return {
    getItem: (name: string) => storage.get(name) || null,
    setItem: (name: string, value: string) => {
      storage.set(name, value);
    },
    removeItem: (name: string) => {
      storage.delete(name);
    },
  };
};

export const createSecureStorage = () => {
  // For sensitive data, you might want to use react-native-keychain
  // or expo-secure-store instead of AsyncStorage
  return defaultStorage;
};

// Persistence patterns for different data types
export const PersistencePatterns = {
  // User preferences (persist everything except loading states)
  userPreferences: {
    blacklist: ['loading', 'error'],
  },

  // Authentication (persist token and user info)
  auth: {
    whitelist: ['token', 'user', 'isAuthenticated'],
  },

  // Goals (persist all goal data)
  goals: {
    whitelist: ['goals'],
    version: 2,
    migrate: createMigration({
      2: (state) => ({
        ...state,
        goals: state.goals?.map((goal: any) => ({
          ...goal,
          consistency: goal.consistency || 0,
          status: goal.status || 'On Track',
        })) || [],
      }),
    }),
  },

  // Daily actions (persist actions but not loading states)
  daily: {
    whitelist: ['actions', 'completedActions'],
  },

  // Social data (cache recent posts)
  social: {
    whitelist: ['circleFeed', 'followFeed'],
    blacklist: ['feedLoading', 'feedError'],
  },

  // UI state (persist minimal UI preferences)
  ui: {
    whitelist: ['feedView'],
  },
};