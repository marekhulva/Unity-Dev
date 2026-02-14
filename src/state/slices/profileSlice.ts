import { StateCreator } from 'zustand';

export interface ProfileStats {
  totalGoals: number;
  completedGoals: number;
  currentStreak: number;
  totalActions: number;
}

export interface ProfileSlice {
  stats: ProfileStats;
  isLoading: boolean;
  updateStats: (stats: Partial<ProfileStats>) => void;
  clearProfileData: () => void;
}

export const createProfileSlice: StateCreator<ProfileSlice> = (set) => ({
  stats: {
    totalGoals: 0,
    completedGoals: 0,
    currentStreak: 0,
    totalActions: 0,
  },
  isLoading: false,
  updateStats: (stats) => set((state) => ({
    stats: { ...state.stats, ...stats }
  })),
  clearProfileData: () => {
    if (__DEV__) console.log('🧹 Clearing all profile data');
    set({
      stats: {
        totalGoals: 0,
        completedGoals: 0,
        currentStreak: 0,
        totalActions: 0,
      },
      isLoading: false
    });
  },
});