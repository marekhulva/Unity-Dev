import { supabase } from './supabase.service';

interface FeatureFlags {
  social_pressure_cards: boolean;
  motivation_buttons: boolean;
  streak_tracking: boolean;
  [key: string]: boolean;
}

class FeatureFlagService {
  private flags: FeatureFlags = {
    social_pressure_cards: false, // DEFAULT: OFF for MVP
    motivation_buttons: false,
    streak_tracking: true,
  };

  private lastFetch: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getFlags(): Promise<FeatureFlags> {
    const now = Date.now();

    if (now - this.lastFetch < this.CACHE_DURATION) {
      if (__DEV__) console.log('🔍 [FeatureFlags] Using cached flags (age: ' + Math.round((now - this.lastFetch) / 1000) + 's)');
      return this.flags;
    }

    if (__DEV__) console.log('🔍 [FeatureFlags] Fetching flags from database...');

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('name, enabled');

      if (__DEV__) console.log('🔍 [FeatureFlags] DB query result:', {
        hasData: !!data,
        isArray: Array.isArray(data),
        dataLength: data?.length,
        hasError: !!error,
        error: error,
        rawData: data
      });

      if (!error && data && Array.isArray(data)) {
        const flagsFromDb: FeatureFlags = { ...this.flags };
        data.forEach((row: any) => {
          if (row.name && typeof row.enabled === 'boolean') {
            flagsFromDb[row.name] = row.enabled;
          }
        });
        this.flags = flagsFromDb;
        this.lastFetch = now;
        if (__DEV__) console.log('📊 [FeatureFlags] Loaded flags from database:', this.flags);
      } else {
        if (__DEV__) console.log('⚠️ [FeatureFlags] Condition failed - error:', error, 'data:', data, 'isArray:', Array.isArray(data));
      }
    } catch (err) {
      if (__DEV__) console.log('⚠️ [FeatureFlags] Using default feature flags, error:', err);
    }

    return this.flags;
  }

  async isEnabled(flag: keyof FeatureFlags): Promise<boolean> {
    if (__DEV__) console.log('🔍 [FeatureFlags] isEnabled called for:', flag);

    // TEMPORARY: Hardcoded to true while testing Living Progress Cards
    if (flag === 'use_living_progress_cards') {
      if (__DEV__) console.log('🔍 [FeatureFlags] HARDCODED: use_living_progress_cards = true');
      return true;
    }

    const flags = await this.getFlags();
    if (__DEV__) console.log('🔍 [FeatureFlags] Current flags:', flags);
    const result = flags[flag] ?? false;
    if (__DEV__) console.log('🔍 [FeatureFlags] Result for', flag, ':', result);
    return result;
  }

  // For testing - force refresh
  clearCache() {
    this.lastFetch = 0;
  }
}

export const featureFlags = new FeatureFlagService();