import { apiRequest } from '../../../lib/api-client';

export interface GiangVienItem {
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
}

export interface AdminLoginResponse {
  user: {
    username: string;
    role: string;
    displayName: string;
  };
  token: string;
}

export interface TeacherStats {
  totalTeachers: number;
  totalClasses: number;
  avgClasses: number;
}

// 1. Đăng nhập Phân hệ Admin
export async function loginAdmin(username: string, password: string): Promise<AdminLoginResponse> {
  const res = await apiRequest<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return res.data;
}

// 2. Lấy danh sách Giảng viên
export async function getGiangVienList(search?: string): Promise<GiangVienItem[]> {
  const query = search && search.trim().length > 0 ? `?search=${encodeURIComponent(search.trim())}` : '';
  const res = await apiRequest<{ giangVien: GiangVienItem[] }>(`/giangvien${query}`, {
    method: 'GET',
  });
  return res.data.giangVien;
}

// 3. Thêm mới Giảng viên (Đúng 4 trường)
export async function createGiangVien(item: GiangVienItem): Promise<GiangVienItem> {
  const res = await apiRequest<{ giangVien: GiangVienItem }>('/giangvien', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  return res.data.giangVien;
}

// 4. Cập nhật thông tin Giảng viên
export async function updateGiangVien(
  idgv: string,
  data: Partial<Omit<GiangVienItem, 'IDGV'>>,
): Promise<GiangVienItem> {
  const res = await apiRequest<{ giangVien: GiangVienItem }>(`/giangvien/${idgv}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data.giangVien;
}

// 5. Xóa Giảng viên
export async function deleteGiangVien(idgv: string): Promise<string> {
  const res = await apiRequest<{ deletedId: string }>(`/giangvien/${idgv}`, {
    method: 'DELETE',
  });
  return res.data.deletedId;
}

// 6. Lấy thống kê nâng cao
export async function getTeacherStats(): Promise<TeacherStats> {
  const res = await apiRequest<TeacherStats>('/giangvien/stats', {
    method: 'GET',
  });
  return res.data;
}
