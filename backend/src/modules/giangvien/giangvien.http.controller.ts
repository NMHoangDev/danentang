import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { sendError, sendSuccess } from '../../libs/ddd/api-response.js';
import { GiangVienSupabaseRepository } from './database/giangvien.supabase.repository.js';
import { GiangVienEntity } from './domain/giangvien.entity.js';

const giangVienSchema = z.object({
  IDGV: z.string().min(1, 'Mã Giảng viên (IDGV) bắt buộc'),
  Fullname: z.string().min(2, 'Họ và tên (Fullname) bắt buộc'),
  Image: z.string().optional().default('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
  SumClass: z.coerce.number().min(0, 'Tổng số lớp (SumClass) phải là số >= 0').default(0),
});

const updateGiangVienSchema = z.object({
  Fullname: z.string().min(2).optional(),
  Image: z.string().optional(),
  SumClass: z.coerce.number().min(0).optional(),
});

export const giangVienRouter = Router();
const repository = new GiangVienSupabaseRepository();

// GET /api/v1/giangvien (Hiển thị & Tìm kiếm Giảng viên)
giangVienRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const list = await repository.findAll(search);
    const data = list.map((item) => item.toData());
    sendSuccess(res, { giangVien: data }, 'Lấy danh sách Giảng viên thành công', 200, {
      total: data.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/giangvien/stats (Thống kê nâng cao)
giangVienRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await repository.getStats();
    sendSuccess(res, stats, 'Thống kê giảng viên và lớp học');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/giangvien/export (Xuất file CSDL nộp bài JSON)
giangVienRouter.get('/export', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await repository.findAll();
    const data = list.map((item) => item.toData());
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="QLHocPhan_GiangVien.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/giangvien/:id (Chi tiết Giảng viên)
giangVienRouter.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await repository.findById(String(req.params.id));
    if (!item) {
      sendError(res, `Không tìm thấy giảng viên có IDGV: ${req.params.id}`, 'NOT_FOUND', 404);
      return;
    }
    sendSuccess(res, { giangVien: item.toData() }, 'Chi tiết giảng viên');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/giangvien (Thêm Giảng viên - chỉ gồm đúng 4 trường IDGV, Fullname, Image, SumClass)
giangVienRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = giangVienSchema.parse(req.body);
    const existing = await repository.findById(parsed.IDGV);
    if (existing) {
      sendError(res, `Mã giảng viên (IDGV) '${parsed.IDGV}' đã tồn tại trong CSDL!`, 'DUPLICATE_IDGV', 400);
      return;
    }

    const entity = new GiangVienEntity(parsed);
    const saved = await repository.save(entity);
    sendSuccess(res, { giangVien: saved.toData() }, 'Thêm giảng viên vào CSDL QLHocPhan thành công', 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/giangvien/:id (Sửa Giảng viên)
giangVienRouter.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await repository.findById(id);
    if (!existing) {
      sendError(res, `Không tìm thấy giảng viên ${id}`, 'NOT_FOUND', 404);
      return;
    }

    const parsed = updateGiangVienSchema.parse(req.body);
    existing.updateDetails(parsed);
    const updated = await repository.update(existing);
    sendSuccess(res, { giangVien: updated.toData() }, 'Cập nhật thông tin giảng viên thành công');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/giangvien/:id (Xóa Giảng viên)
giangVienRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const deleted = await repository.delete(id);
    if (!deleted) {
      sendError(res, `Không tìm thấy giảng viên ${id} để xóa`, 'NOT_FOUND', 404);
      return;
    }
    sendSuccess(res, { deletedId: id }, `Đã xóa giảng viên ${id} khỏi CSDL QLHocPhan`);
  } catch (err) {
    next(err);
  }
});
