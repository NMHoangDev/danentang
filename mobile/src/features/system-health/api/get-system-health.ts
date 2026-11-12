import { apiRequest } from '../../../lib/api-client';

export interface SystemHealthData {
  service: string;
  status: 'HEALTHY' | 'DEGRADED';
  uptimeSeconds: number;
  latencyMs: number;
  supabase: {
    connected: boolean;
    mode: string;
    projectUrl: string;
    databaseType: string;
    checkedAt: string;
  };
}

export async function getSystemHealth(): Promise<SystemHealthData> {
  const res = await apiRequest<SystemHealthData>('/health', {
    method: 'GET',
  });
  return res.data;
}
