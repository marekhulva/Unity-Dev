import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';

export interface Circle {
  id: string;
  name: string;
  emoji?: string;  // Circle icon/emoji
  description?: string;  // Circle description
  category?: string;  // Category (fitness, work, social, etc)
  is_private?: boolean;  // Privacy setting
  member_count: number;
  created_by: string;
  created_at: string;
  joined_at?: string;
  invite_code?: string;
  join_code?: string;  // Alternative field name used in DB
}

export interface CirclesSlice {
  // State
  userCircles: Circle[];
  activeCircleId: string | null; // null means "All Circles"
  circlesLoading: boolean;
  circlesError: string | null;
  joinModalVisible: boolean;

  // Actions
  fetchUserCircles: () => Promise<void>;
  setActiveCircle: (circleId: string | null) => void;
  joinCircle: (inviteCode: string) => Promise<boolean>;
  leaveCircle: (circleId: string) => Promise<boolean>;
  createCircle: (name: string, emoji?: string, description?: string) => Promise<{ success: boolean; data?: Circle; error?: string }>;
  setJoinModalVisible: (visible: boolean) => void;
  clearCirclesError: () => void;
  clearCirclesData: () => void;
}

export const createCirclesSlice: StateCreator<CirclesSlice> = (set, get) => ({
  // Initial state
  userCircles: [],
  activeCircleId: null, // Start with "All Circles"
  circlesLoading: false,
  circlesError: null,
  joinModalVisible: false,

  // Fetch all circles the user belongs to
  fetchUserCircles: async () => {
    if (__DEV__) console.log('🔵 [CIRCLES] Fetching user circles');
    set({ circlesLoading: true, circlesError: null });

    try {
      const response = await backendService.getUserCircles();

      if (response.success && response.data) {
        if (__DEV__) console.log('✅ [CIRCLES] Fetched', response.data.length, 'circles');
        set({
          userCircles: response.data,
          circlesLoading: false
        });
      } else {
        throw new Error(response.error || 'Failed to fetch circles');
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [CIRCLES] Error fetching circles:', error);
      set({
        circlesError: error.message,
        circlesLoading: false
      });
    }
  },

  // Set the active circle for filtering
  setActiveCircle: (circleId) => {
    if (__DEV__) console.log('🔵 [CIRCLES] Setting active circle:', circleId || 'All Circles');
    set({ activeCircleId: circleId });

    // Persist selection to AsyncStorage for app restarts
    if (typeof window !== 'undefined' && window.localStorage) {
      if (circleId) {
        window.localStorage.setItem('activeCircleId', circleId);
      } else {
        window.localStorage.removeItem('activeCircleId');
      }
    }
  },

  // Join a new circle with invite code
  joinCircle: async (inviteCode) => {
    if (__DEV__) console.log('🔵 [CIRCLES] Joining circle with code:', inviteCode);
    set({ circlesLoading: true, circlesError: null });

    try {
      const response = await backendService.joinCircleByCode(inviteCode);

      if (response.success && response.data) {
        if (__DEV__) console.log('✅ [CIRCLES] Successfully joined circle:', response.data.name);

        // Refresh all circles to get accurate member counts
        await get().fetchUserCircles();

        // Set the newly joined circle as active
        get().setActiveCircle(response.data.id);

        set({ joinModalVisible: false });

        return true;
      } else {
        set({
          circlesError: response.error || 'Invalid invite code',
          circlesLoading: false
        });
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [CIRCLES] Error joining circle:', error);
      set({
        circlesError: error.message,
        circlesLoading: false
      });
      return false;
    }
  },

  // Leave a circle
  leaveCircle: async (circleId) => {
    if (__DEV__) console.log('🔵 [CIRCLES] Leaving circle:', circleId);
    set({ circlesLoading: true, circlesError: null });

    try {
      const response = await backendService.leaveCircle(circleId);

      if (response.success) {
        if (__DEV__) console.log('✅ [CIRCLES] Successfully left circle');

        // Remove circle from list
        set((state) => ({
          userCircles: state.userCircles.filter(c => c.id !== circleId),
          circlesLoading: false,
          // If this was the active circle, reset to "All Circles"
          activeCircleId: state.activeCircleId === circleId ? null : state.activeCircleId
        }));

        return true;
      } else {
        set({
          circlesError: response.error || 'Failed to leave circle',
          circlesLoading: false
        });
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [CIRCLES] Error leaving circle:', error);
      set({
        circlesError: error.message,
        circlesLoading: false
      });
      return false;
    }
  },

  // Create a new circle
  createCircle: async (name, emoji, description) => {
    if (__DEV__) console.log('🔵 [CIRCLES] Creating new circle:', name, 'with emoji:', emoji);
    set({ circlesLoading: true, circlesError: null });

    try {
      const response = await backendService.createCircle({
        name,
        emoji,
        description
      });

      if (response.success && response.data) {
        if (__DEV__) console.log('✅ [CIRCLES] Circle created:', response.data.id);

        // Add new circle to list
        set((state) => ({
          userCircles: [...state.userCircles, response.data],
          circlesLoading: false
        }));

        // Set as active circle
        get().setActiveCircle(response.data.id);

        return { success: true, data: response.data };
      } else {
        set({
          circlesError: response.error || 'Failed to create circle',
          circlesLoading: false
        });
        return {
          success: false,
          error: response.error || 'Failed to create circle'
        };
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [CIRCLES] Error creating circle:', error);
      set({
        circlesError: error.message,
        circlesLoading: false
      });
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Toggle join modal visibility
  setJoinModalVisible: (visible) => {
    set({ joinModalVisible: visible });
  },

  // Clear error messages
  clearCirclesError: () => {
    set({ circlesError: null });
  },

  // Clear all circles data
  clearCirclesData: () => {
    if (__DEV__) console.log('🧹 Clearing all circles data');
    // Also clear from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('activeCircleId');
    }
    set({
      userCircles: [],
      activeCircleId: null,
      circlesLoading: false,
      circlesError: null,
      joinModalVisible: false
    });
  }
});