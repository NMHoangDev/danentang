import { Request, Response, Router } from 'express';
import { sendError, sendSuccess } from '../../libs/ddd/api-response.js';

export const adminAuthRouter = Router();

// POST /api/v1/admin/login (Đăng nhập Phân hệ Admin theo đề bài)
adminAuthRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  
  // Tài khoản Admin mặc định cho đề thi phân hệ Admin
  if (
    (username === 'admin' && password === 'admin123') ||
    (username === 'admin' && password === 'admin')
  ) {
    return sendSuccess(
      res,
      {
        user: {
          username: 'admin',
          role: 'ADMIN',
          displayName: 'Quản Trị Viên Học Phần',
        },
        token: 'admin-auth-token-qlhocphan',
      },
      'Đăng nhập Admin thành công!',
    );
  }

  return sendError(res, 'Tên đăng nhập hoặc mật khẩu không chính xác! (Mặc định: admin / admin123)', 'INVALID_CREDENTIALS', 401);
});
