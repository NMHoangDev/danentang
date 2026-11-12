import { Request, Response, Router } from 'express';
import { getSupabaseAdapter } from '../../config/supabase.config.js';
import { sendSuccess } from '../../libs/ddd/api-response.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const started = Date.now();
  const adapter = getSupabaseAdapter();
  const supabaseStatus = await adapter.ping();
  const latencyMs = Date.now() - started;

  sendSuccess(
    res,
    {
      service: 'danentang-backend',
      status: supabaseStatus.connected ? 'HEALTHY' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      latencyMs,
      supabase: supabaseStatus,
    },
    'Backend & Supabase PostgreSQL Database connection is healthy',
  );
});
