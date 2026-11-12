import { mobileEnv } from '../config/env';
import { getSupabaseClient } from '../config/supabase.client';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  code?: string;
  details?: unknown;
  timestamp: string;
}

let customBaseUrl: string | null = null;

export function setCustomApiBaseUrl(url: string | null): void {
  customBaseUrl = url ? url.trim().replace(/\/+$/, '') : null;
}

export function getActiveApiBaseUrl(): string {
  return customBaseUrl || mobileEnv.apiBaseUrl;
}

async function resolveAuthToken(): Promise<string> {
  const { client } = getSupabaseClient();
  if (client) {
    const { data } = await client.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  }
  return 'dev-master-token';
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const baseUrl = getActiveApiBaseUrl();
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanPath}`;
  const token = await resolveAuthToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const json = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message || `HTTP Error ${response.status}`);
  }
  return json;
}
