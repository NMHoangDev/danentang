import { Response } from 'express';

export interface ApiSuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  timestamp: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const payload: ApiSuccessPayload<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  statusCode = 500,
  details?: unknown,
): Response {
  const payload: ApiErrorPayload = {
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}
