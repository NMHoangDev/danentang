import { NextFunction, Request, Response } from 'express';
import { getSupabaseAdapter } from '../config/supabase.config.js';
import { sendError } from '../libs/ddd/api-response.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    mode: string;
  };
}

export async function optionalSupabaseAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const adapter = getSupabaseAdapter();
    const decoded = await adapter.verifyAccessToken(token);
    req.user = decoded;
  } catch {
    // Optional auth: ignore invalid token and proceed as guest
  }
  next();
}

export async function requireSupabaseAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(
      res,
      'Missing Authorization Bearer token',
      'UNAUTHORIZED',
      401,
    );
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const adapter = getSupabaseAdapter();
    const decoded = await adapter.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    sendError(
      res,
      err instanceof Error ? err.message : 'Invalid Supabase Access Token',
      'INVALID_TOKEN',
      401,
    );
  }
}
