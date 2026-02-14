// App Configuration
// Switch between different backend implementations

export const AppConfig = {
  // Set to 'supabase' to use Supabase BaaS
  // Set to 'custom' to use custom Node.js backend
  backend: 'supabase' as 'supabase' | 'custom',
  
  // Supabase configuration (use environment variables)
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Custom backend configuration (no longer used)
  customBackend: {
    url: 'https://freestyle-backend-production.up.railway.app',
  },
};

// Helper to check which backend is active
export const isSupabaseBackend = () => AppConfig.backend === 'supabase';
export const isCustomBackend = () => AppConfig.backend === 'custom';