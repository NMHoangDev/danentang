import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { sendError, sendSuccess } from '../../libs/ddd/api-response.js';
import { optionalSupabaseAuthMiddleware } from '../../middlewares/auth.middleware.js';
import { ItemSupabaseRepository } from './database/item.supabase.repository.js';
import { ItemEntity } from './domain/item.entity.js';

const createItemSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(1000).optional().default(''),
  category: z.string().max(50).optional().default('GENERAL'),
  status: z
    .enum(['PENDING', 'ACTIVE', 'COMPLETED'])
    .optional()
    .default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
});

const updateItemSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const itemRouter = Router();
const itemRepo = new ItemSupabaseRepository();

itemRouter.use(optionalSupabaseAuthMiddleware);

// GET /api/v1/items
itemRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statusFilter =
        typeof req.query.status === 'string'
          ? req.query.status.toUpperCase()
          : '';
      const entities = statusFilter
        ? await itemRepo.findByStatus(statusFilter)
        : await itemRepo.findAll();
      const records = entities.map((e) => e.toRecord());
      sendSuccess(
        res,
        { items: records },
        'Fetched items from Supabase PostgreSQL Database',
        200,
        {
          total: records.length,
        },
      );
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/items/:id
itemRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.id);
      const entity = await itemRepo.findById(itemId);
      if (!entity) {
        sendError(res, `Item '${itemId}' not found`, 'ITEM_NOT_FOUND', 404);
        return;
      }
      sendSuccess(res, { item: entity.toRecord() }, 'Fetched item detail');
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/items
itemRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createItemSchema.parse(req.body);
      const entity = ItemEntity.create(input);
      const saved = await itemRepo.save(entity);
      sendSuccess(
        res,
        { item: saved.toRecord() },
        'Created item in Supabase PostgreSQL Database',
        201,
      );
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/items/:id
itemRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.id);
      const input = updateItemSchema.parse(req.body);
      const existing = await itemRepo.findById(itemId);
      if (!existing) {
        sendError(res, `Item '${itemId}' not found`, 'ITEM_NOT_FOUND', 404);
        return;
      }
      existing.updateDetails(input);
      const saved = await itemRepo.save(existing);
      sendSuccess(
        res,
        { item: saved.toRecord() },
        'Updated item in Supabase PostgreSQL Database',
      );
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/items/:id
itemRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.id);
      const deleted = await itemRepo.delete(itemId);
      if (!deleted) {
        sendError(res, `Item '${itemId}' not found`, 'ITEM_NOT_FOUND', 404);
        return;
      }
      sendSuccess(
        res,
        { deletedId: itemId },
        'Deleted item from Supabase PostgreSQL Database',
      );
    } catch (err) {
      next(err);
    }
  },
);
