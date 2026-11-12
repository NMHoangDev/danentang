import { Platform } from 'react-native';

declare const process: {
  env: Record<string, string | undefined>;
};

function resolveDefaultApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured && configured.trim().length > 0) {
    if (Platform.OS === 'android' && configured.includes('localhost')) {
      return configured.replace('localhost', '10.0.2.2');
    }
    return configured.trim();
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api/v1'
    : 'http://localhost:4000/api/v1';
}

export const mobileEnv = {
  apiBaseUrl: resolveDefaultApiBaseUrl(),
  supabase: {
    url: (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim(),
    anonKey: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
  },
};
