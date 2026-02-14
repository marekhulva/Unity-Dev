import { useState, useCallback } from 'react';
import { backendService } from '../services/api.service';

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction(...args);
        setData(response.data || response);
        return response;
      } catch (err: any) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const result = await backendService.login(email, password);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await backendService.register(email, password, name);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await backendService.logout();
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    login,
    register,
    logout,
  };
}

export function useGoals() {
  const { loading, error, data, execute } = useApi(backendService.getGoals.bind(apiService));

  return {
    goals: data,
    loading,
    error,
    fetchGoals: execute,
    createGoal: backendService.createGoal.bind(apiService),
    updateGoal: backendService.updateGoal.bind(apiService),
    deleteGoal: backendService.deleteGoal.bind(apiService),
  };
}

export function useDailyActions() {
  const { loading, error, data, execute } = useApi(backendService.getDailyActions.bind(apiService));

  return {
    actions: data,
    loading,
    error,
    fetchActions: execute,
    createAction: backendService.createAction.bind(apiService),
    completeAction: backendService.completeAction.bind(apiService),
  };
}