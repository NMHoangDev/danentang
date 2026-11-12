import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../libs/ddd/api-response.js';

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    'ROUTE_NOT_FOUND',
    404,
  );
}

export function globalErrorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      err.flatten().fieldErrors,
    );
    return;
  }

  const message =
    err instanceof Error ? err.message : 'Unexpected server error';
  sendError(res, message, 'INTERNAL_SERVER_ERROR', 500);
}
