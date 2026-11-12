import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { mobileEnv } from './env';

export interface SupabaseClientServices {
  isConfigured: boolean;
  client: SupabaseClient | null;
  projectUrl: string;
}

let cachedServices: SupabaseClientServices | null = null;

export function getSupabaseClient(): SupabaseClientServices {
  if (cachedServices) {
    return cachedServices;
  }

  const hasCredentials = Boolean(
    mobileEnv.supabase.url && mobileEnv.supabase.anonKey,
  );

  if (!hasCredentials) {
    cachedServices = {
      isConfigured: false,
      client: null,
      projectUrl: 'http://localhost:54321 (Chưa cấu hình SUPABASE_URL)',
    };
    return cachedServices;
  }

  const client = createClient(
    mobileEnv.supabase.url,
    mobileEnv.supabase.anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  cachedServices = {
    isConfigured: true,
    client,
    projectUrl: mobileEnv.supabase.url,
  };

  return cachedServices;
}
