import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import {
  globalErrorMiddleware,
  notFoundMiddleware,
} from './middlewares/error.middleware.js';
import { adminAuthRouter } from './modules/giangvien/admin.auth.controller.js';
import { giangVienRouter } from './modules/giangvien/giangvien.http.controller.js';
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
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));

  // API v1 Routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/items', itemRouter);

  // Phân hệ Admin Quản Lý Học Phần (QLHocPhan - GiangVien)
  app.use('/api/v1/admin', adminAuthRouter);
  app.use('/api/v1/giangvien', giangVienRouter);

  // Error Handling
  app.use(notFoundMiddleware);
  app.use(globalErrorMiddleware);

  return app;
}
