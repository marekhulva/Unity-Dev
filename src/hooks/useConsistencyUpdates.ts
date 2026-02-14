import { useEffect, useState } from 'react';
import { useStore } from '../state/rootStore';
import { calculateConsistency } from '../utils/consistencyCalculator';
import { DayProgress } from '../types/progress';

interface UseConsistencyUpdatesOptions {
  goalId?: string;
  actionIds?: string[];
  refreshInterval?: number; // in milliseconds
}

export const useConsistencyUpdates = (options: UseConsistencyUpdatesOptions = {}) => {
  const { goalId, actionIds, refreshInterval = 5000 } = options;
  
  const actions = useStore(s => s.actions);
  const completedActions = useStore(s => s.completedActions);
  const fetchActions = useStore(s => s.fetchActions);
  const fetchCompletedActions = useStore(s => s.fetchCompletedActions);
  
  const [consistency, setConsistency] = useState({
    percentage: 0,
    completedTasks: 0,
    totalTasks: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  // Calculate consistency whenever actions or completions change
  const calculateCurrentConsistency = () => {
    // Filter actions based on options
    let relevantActions = actions;
    if (goalId) {
      relevantActions = actions.filter(a => a.goalId === goalId);
    } else if (actionIds && actionIds.length > 0) {
      relevantActions = actions.filter(a => actionIds.includes(a.id));
    }
    
    // Transform to DayProgress format
    const dayProgressMap = new Map<string, DayProgress>();
    const last30Days: string[] = [];
    const today = new Date();
    
    // Create entries for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push(dateStr);
      dayProgressMap.set(dateStr, {
        date: dateStr,
        tasks: []
      });
    }
    
    // Add actions to their respective days
    relevantActions.forEach(action => {
      last30Days.forEach(dateStr => {
        const dayProgress = dayProgressMap.get(dateStr);
        if (dayProgress) {
          // Check if action was completed on this specific day
          let isCompleted = false;
          
          // Check today's completion
          const todayStr = new Date().toISOString().split('T')[0];
          if (dateStr === todayStr && action.done) {
            isCompleted = true;
          }
          
          // Check historical completions
          const historicalCompletion = completedActions.find(ca => {
            if (goalId && ca.goalId !== goalId) return false;
            if (actionIds && !actionIds.includes(ca.actionId)) return false;
            
            const completedDateStr = new Date(ca.completedAt).toISOString().split('T')[0];
            return completedDateStr === dateStr && 
                   (ca.actionId === action.id || ca.title === action.title);
          });
          
          if (historicalCompletion) {
            isCompleted = true;
          }
          
          dayProgress.tasks.push({
            id: action.id,
            title: action.title,
            completed: isCompleted
          });
        }
      });
    });
    
    // Convert map to array and calculate
    const dayProgresses = Array.from(dayProgressMap.values());
    const result = calculateConsistency(dayProgresses);
    
    setConsistency(result);
    setLoading(false);
  };
  
  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchActions(),
        fetchCompletedActions()
      ]);
      calculateCurrentConsistency();
    };
    
    loadData();
  }, [goalId, actionIds?.join(',')]);
  
  // Recalculate when actions or completions change
  useEffect(() => {
    if (!loading) {
      calculateCurrentConsistency();
    }
  }, [actions, completedActions]);
  
  // Auto-refresh at interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchActions();
        fetchCompletedActions();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);
  
  return {
    consistency,
    loading,
    refresh: async () => {
      await Promise.all([
        fetchActions(),
        fetchCompletedActions()
      ]);
      calculateCurrentConsistency();
    }
  };
};