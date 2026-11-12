import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EnvConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    allowLocalFallback: boolean;
  };
}

export const env: EnvConfig = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supabase: {
    url: (process.env.SUPABASE_URL || '').trim(),
    anonKey: (process.env.SUPABASE_ANON_KEY || '').trim(),
    serviceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    allowLocalFallback:
      (process.env.SUPABASE_ALLOW_LOCAL_FALLBACK || 'true').toLowerCase() ===
      'true',
  },
};
