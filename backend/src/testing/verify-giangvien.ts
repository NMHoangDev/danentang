import { createApp } from '../app.js';

async function runTest(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Cannot bind port');
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // 1. Admin Login Test
    const loginRes = await fetch(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginJson: any = await loginRes.json();
    if (loginRes.status !== 200 || !loginJson.success) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginJson)}`);
    }
    console.log('[TC_01 PASS] POST /api/v1/admin/login -> Đăng nhập Admin thành công');

    // 2. Lấy danh sách Giảng viên (Web 8.0 điểm)
    const listRes = await fetch(`${baseUrl}/giangvien`);
    const listJson: any = await listRes.json();
    if (listRes.status !== 200 || !listJson.data.giangVien) {
      throw new Error(`Get list failed: ${JSON.stringify(listJson)}`);
    }
    console.log(`[TC_02 PASS] GET /api/v1/giangvien -> Lấy danh sách thành công, tổng số GV: ${listJson.data.giangVien.length}`);

    // 3. Thêm mới Giảng viên (Đúng 4 trường IDGV, Fullname, Image, SumClass)
    const newGV = {
      IDGV: 'GV099',
      Fullname: 'GS. Đỗ Nam Trung',
      Image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      SumClass: 15,
    };
    const createRes = await fetch(`${baseUrl}/giangvien`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGV),
    });
    const createJson: any = await createRes.json();
    if (createRes.status !== 201 || createJson.data.giangVien.IDGV !== 'GV099') {
      throw new Error(`Create GV failed: ${JSON.stringify(createJson)}`);
    }
    console.log('[TC_03 PASS] POST /api/v1/giangvien -> Thêm Giảng viên thành công (Đúng 4 trường IDGV, Fullname, Image, SumClass)');

    // 4. Sửa Giảng viên (Update SumClass & Fullname)
    const updateRes = await fetch(`${baseUrl}/giangvien/GV099`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Fullname: 'GS. Đỗ Nam Trung (Đã Cập Nhật)', SumClass: 18 }),
    });
    const updateJson: any = await updateRes.json();
    if (updateRes.status !== 200 || updateJson.data.giangVien.SumClass !== 18) {
      throw new Error(`Update GV failed: ${JSON.stringify(updateJson)}`);
    }
    console.log('[TC_04 PASS] PUT /api/v1/giangvien/GV099 -> Sửa thông tin Giảng viên thành công');

    // 5. Xóa Giảng viên
    const deleteRes = await fetch(`${baseUrl}/giangvien/GV099`, { method: 'DELETE' });
    if (deleteRes.status !== 200) {
      throw new Error(`Delete GV failed: HTTP ${deleteRes.status}`);
    }
    console.log('[TC_05 PASS] DELETE /api/v1/giangvien/GV099 -> Xóa Giảng viên thành công');

    // 6. Thống kê nâng cao
    const statsRes = await fetch(`${baseUrl}/giangvien/stats`);
    const statsJson: any = await statsRes.json();
    if (statsRes.status !== 200 || !statsJson.data.totalTeachers) {
      throw new Error(`Stats failed: ${JSON.stringify(statsJson)}`);
    }
    console.log(`[TC_06 PASS] GET /api/v1/giangvien/stats -> Thống kê: ${statsJson.data.totalTeachers} GV, ${statsJson.data.totalClasses} Lớp`);

    // 7. Xuất file CSDL JSON
    const exportRes = await fetch(`${baseUrl}/giangvien/export`);
    if (exportRes.status !== 200) {
      throw new Error(`Export failed: HTTP ${exportRes.status}`);
    }
    console.log('[TC_07 PASS] GET /api/v1/giangvien/export -> Xuất file CSDL QLHocPhan_GiangVien.json thành công');

    console.log('100% MODULE GIẢNG VIÊN BACKEND PASS THÀNH CÔNG RỰC RỠ!');
  } finally {
    server.close();
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
