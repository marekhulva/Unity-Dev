import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';
import { memoryCache } from '../../utils/memoryCache';

export type Milestone = {
  id: string;
  title: string;
  targetDate: Date;
  targetValue?: number;
  unit?: string;
  completed: boolean;
  order: number;
};

export type Goal = {
  id: string; 
  title: string; 
  metric: string; 
  deadline: string; 
  why?: string;
  consistency: number; 
  status: 'On Track'|'Needs Attention'|'Critical';
  color: string;
  category?: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'other';
  type?: 'goal' | 'routine'; // NEW: Distinguish between goals and routines
  milestones?: Milestone[];
  created_at?: string; // Added to calculate days since start
};

export type GoalsSlice = {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (g: Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoalMilestones: (goalId: string, milestones: Milestone[]) => void;
  toggleMilestoneComplete: (goalId: string, milestoneId: string) => void;
  clearGoalsData: () => void;
};

export const createGoalsSlice: StateCreator<GoalsSlice> = (set, get) => ({
  goals: [],
  goalsLoading: false,
  goalsError: null,
  
  fetchGoals: async () => {
    if (__DEV__) console.log('🟦 [GOALS] fetchGoals called');
    set({ goalsLoading: true, goalsError: null });
    try {
      if (__DEV__) console.log('🟦 [GOALS] Fetching from backend...');
      const response = await backendService.getGoals();
      if (response.success) {
        const goals = response.data || [];
        if (__DEV__) console.log('🟢 [GOALS] Fetched', goals.length, 'goals:', goals.map(g => `${g.title} (${g.id.substring(0, 8)})`));
        memoryCache.set('goals', goals); // Save for next time
        set({ goals, goalsLoading: false });
      } else {
        if (__DEV__) console.error('🔴 [GOALS] Fetch failed:', response.error);
        set({ goalsError: response.error, goalsLoading: false });
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [GOALS] Exception:', error);
      set({ goalsError: error.message, goalsLoading: false });
    }
  },
  
  addGoal: async (goalData) => {
    if (__DEV__) console.log('🟦 [GOALS] addGoal called:', goalData.title, 'Type:', goalData.type || 'goal');
    try {
      const response = await backendService.createGoal({
        title: goalData.title || '',
        metric: goalData.metric || '',
        deadline: goalData.deadline || new Date().toISOString(),
        category: goalData.category,
        color: goalData.color || '#FFD700',
        why: goalData.why,
        type: goalData.type || 'goal' // Now supported in database after migration
      });
      
      if (response.success && response.data) {
        if (__DEV__) console.log('🟢 [GOALS] Goal added to store:', response.data.title, 'ID:', response.data.id);

        // Prevent duplicates - check if goal already exists
        set((state) => {
          const existingGoal = state.goals.find(g => g.id === response.data.id);
          if (existingGoal) {
            if (__DEV__) console.log('🟡 [GOALS] Goal already exists, not adding duplicate');
            return { goals: state.goals };
          }
          return { goals: [...state.goals, response.data] };
        });
        
        const currentGoals = get().goals;
        if (__DEV__) console.log('🟦 [GOALS] Current goals in store:', currentGoals.map(g => g.title));
        if (__DEV__) console.log('🟦 [GOALS] Goal IDs in store:', currentGoals.map(g => g.id));
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 [GOALS] Failed to add goal:', error);
    }
  },
  
  updateGoal: async (id, updates) => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const response = await backendService.updateGoal(id, updates);
      if (response.success && response.data) {
        set((state) => ({
          goals: state.goals.map(g => 
            g.id === id ? { ...g, ...response.data } : g
          ),
          goalsLoading: false
        }));
      } else {
        set({ goalsError: response.error, goalsLoading: false });
      }
    } catch (error: any) {
      set({ goalsError: error.message, goalsLoading: false });
    }
  },

  deleteGoal: async (id) => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const response = await backendService.deleteGoal(id);
      if (response.success) {
        set((state) => ({
          goals: state.goals.filter(g => g.id !== id),
          goalsLoading: false
        }));
      } else {
        set({ goalsError: response.error, goalsLoading: false });
      }
    } catch (error: any) {
      set({ goalsError: error.message, goalsLoading: false });
    }
  },

  updateGoalMilestones: (goalId, milestones) => 
    set((state) => ({
      goals: state.goals.map(g => 
        g.id === goalId ? { ...g, milestones } : g
      )
    })),
    
  toggleMilestoneComplete: (goalId, milestoneId) =>
    set((state) => ({
      goals: state.goals.map(g =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones?.map(m =>
                m.id === milestoneId ? { ...m, completed: !m.completed } : m
              )
            }
          : g
      )
    })),

  clearGoalsData: () => {
    if (__DEV__) console.log('🧹 Clearing all goals data');
    memoryCache.clear('goals');
    set({
      goals: [],
      goalsLoading: false,
      goalsError: null
    });
  },
});