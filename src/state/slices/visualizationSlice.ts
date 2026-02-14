import { StateCreator } from 'zustand';

export interface VisualizationSlice {
  selectedGoalId: string | null;
  timeRange: 'week' | 'month' | 'year';
  setSelectedGoalId: (id: string | null) => void;
  setTimeRange: (range: 'week' | 'month' | 'year') => void;
}

export const createVisualizationSlice: StateCreator<VisualizationSlice> = (set) => ({
  selectedGoalId: null,
  timeRange: 'week',
  setSelectedGoalId: (id) => set({ selectedGoalId: id }),
  setTimeRange: (range) => set({ timeRange: range }),
});