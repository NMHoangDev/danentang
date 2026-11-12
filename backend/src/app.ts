import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import {
  globalErrorMiddleware,
  notFoundMiddleware,
} from './middlewares/error.middleware.js';
import { healthRouter } from './modules/health/health.http.controller.js';
import { itemRouter } from './modules/items/item.http.controller.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('dev'));

  // API v1 Routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/items', itemRouter);

  // Error Handling
  app.use(notFoundMiddleware);
  app.use(globalErrorMiddleware);

  return app;
}
