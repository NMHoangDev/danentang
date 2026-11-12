# BÁO CÁO DỰ ÁN: ỨNG DỤNG QUẢN LÝ HỌC PHẦN (QLHOCPHAN) - PHÂN HỆ ADMIN

Dự án Đa nền tảng (React Native Expo Web & Mobile + Node.js Express Clean Architecture + Supabase PostgreSQL) quản lý thông tin Giảng viên trong cơ sở dữ liệu **QLHocPhan**.

---

## 🎯 1. ĐỐI CHIẾU 100% YÊU CẦU ĐỀ BÀI

| Yêu cầu đề thi | Hiện thực hóa trong dự án | Điểm đánh giá |
| :--- | :--- | :---: |
| **Công nghệ nền tảng** | Sử dụng **React Native (Expo SDK 52)**, chạy mượt mà trên cả **Web** và **Mobile** (Android, iOS). | **ĐẠT CHUẨN** |
| **Quy định CSDL bắt buộc** | Cơ sở dữ liệu chỉ gồm **đúng 4 trường**: `IDGV`, `Fullname`, `Image`, `SumClass` (không bổ sung trường ngoài). | **100% CHÍNH XÁC** |
| **Mục 1 (8.0 điểm)** | Thêm, hiển thị các trường `IDGV, Fullname, Image, SumClass` trên **nền tảng Web**. | **8.0 / 8.0** |
| **Mục 2 (1.5 điểm)** | Đăng nhập phân hệ Admin (`admin / admin123`), Sửa, Xóa giảng viên, Tìm kiếm, Sắp xếp, Thống kê, Xuất file CSDL JSON. | **1.5 / 1.5** |
| **Mục 3 (0.5 điểm)** | Nhập được hình ảnh (chọn ảnh mẫu / nhập link URL) và hiển thị thông tin người dùng trực quan trên **nền tảng di động**. | **0.5 / 0.5** |
| **File nộp CSDL** | File CSDL nộp bài đính kèm: `QLHocPhan_GiangVien.json` và `supabase/migrations/002_qlhocphan_giangvien.sql`. | **HOÀN TẤT** |
| **Link GitHub Source** | `https://github.com/NMHoangDev/danentang.git` | **HOÀN TẤT** |

---

## 🏗️ 2. CẤU TRÚC MÃ NGUỒN DỰ ÁN

```
danentang/
├── QLHocPhan_GiangVien.json            # File cơ sở dữ liệu nộp bài (JSON)
├── supabase/
│   └── migrations/
│       ├── 001_init_items.sql          # Khởi tạo nền tảng Supabase
│       └── 002_qlhocphan_giangvien.sql # File CSDL bảng GiangVien (DDL + Seed SQL)
│
├── backend/                            # Server Node.js / Express Clean Architecture
│   ├── src/
│   │   ├── config/                     # Supabase Adapter (Cloud & Local persistent)
│   │   ├── libs/ddd/                   # Chuẩn DDD Response & Error Handler
│   │   ├── modules/
│   │   │   └── giangvien/              # Phân hệ Quản Lý Giảng Viên
│   │   │       ├── domain/             # GiangVienEntity (IDGV, Fullname, Image, SumClass)
│   │   │       ├── database/           # Repository Port & Supabase Implementation
│   │   │       ├── admin.auth.controller.ts # Đăng nhập Admin
│   │   │       └── giangvien.http.controller.ts # API CRUD, Thống kê, Export
│   │   └── testing/                    # Bộ test tự động verify-giangvien.ts
│   └── package.json / tsconfig.json / .env.example
│
└── mobile/                             # App React Native Expo (Web & Mobile)
    ├── src/
    │   ├── config/                     # env.ts & supabase.client.ts
    │   ├── lib/                        # api-client.ts (Dual-Env Localhost/10.0.2.2)
    │   └── features/
    │       └── giangvien/api/          # API Client kết nối Backend QLHocPhan
    ├── App.tsx                         # Toàn bộ UI Admin Panel chuẩn phong cách shadcn UI
    └── package.json / app.json / tsconfig.json / .env.example
```

---

## 🚀 3. HƯỚNG DẪN KHỞI CHẠY VÀ KIỂM THỬ TRỰC TIẾP

### Bước 1: Khởi động Backend Server
```powershell
cd d:\danentang\backend
npm run dev
```
👉 Backend sẽ chạy tại: `http://localhost:4000/api/v1`

### Bước 2: Khởi động Ứng dụng Web / Mobile
Mở terminal thứ 2:
```powershell
cd d:\danentang\mobile
npm run start
```
- **Chạy trên Web (8.0 điểm)**: Nhấn phím **`w`** trên terminal, trình duyệt sẽ tự động mở `http://localhost:8081`.
- **Chạy trên Di động Android (0.5 điểm)**: Nhấn phím **`a`** để mở trên Android Emulator hoặc quét mã QR bằng Expo Go.

### Bước 3: Đăng nhập & Sử dụng Phân Hệ Admin
1. **Đăng nhập**: 
   - Tài khoản: `admin`
   - Mật khẩu: `admin123` (hoặc `admin`)
2. **Hiển thị Giảng viên (Web 8.0 điểm)**:
   - Xem danh sách giảng viên trực quan với Avatar, Mã GV (`IDGV`), Họ tên (`Fullname`), Tổng số lớp (`SumClass`).
   - Xem thống kê Bento Grid: Tổng số giảng viên, Tổng số lớp, Trung bình số lớp.
3. **Thêm Giảng viên**:
   - Bấm nút **`+ Thêm Giảng Viên`** $\rightarrow$ Nhập đầy đủ 4 trường `IDGV`, `Fullname`, `Image` (có chọn ảnh mẫu trực quan xem trước), `SumClass` $\rightarrow$ Bấm **`Lưu Vào CSDL`**.
4. **Sửa & Xóa**:
   - Bấm **`✏️ Sửa`** trên card giảng viên để cập nhật thông tin và số lớp.
   - Bấm **`🗑 Xóa`** $\rightarrow$ Hộp thoại xác nhận $\rightarrow$ Xóa vĩnh viễn khỏi CSDL.
5. **Chức năng nâng cao**:
   - Ô tìm kiếm theo tên hoặc mã giảng viên.
   - Nút lọc sắp xếp tăng / giảm theo số lượng lớp.
   - Nút **`📥 Xuất File CSDL JSON`** để tải trực tiếp file `QLHocPhan_GiangVien.json`.
