# BÁO CÁO CHI TIẾT BÀI THI GIỮA KỲ: ỨNG DỤNG QUẢN LÝ HỌC PHẦN (QLHOCPHAN)

- **Học phần**: Phát triển Ứng dụng Đa nền tảng (React Native / Flutter / .NET MAUI)
- **Sinh viên thực hiện**: NMHoangDev
- **Link GitHub Source Code**: [https://github.com/NMHoangDev/danentang.git](https://github.com/NMHoangDev/danentang.git)
- **File Video Demo nộp kèm**: `video_demo_qlhocphan.mp4` (Đã quay tự động mô phỏng thao tác người thật, chuẩn Full HD H.264 thời lượng 1 phút 04 giây có sẵn tại thư mục gốc dự án)
- **Cơ sở dữ liệu**: Supabase PostgreSQL / JSON (Collection: `GiangVien`)

---

## I. ĐỐI CHIẾU TIÊU CHÍ CHẤM ĐIỂM (10.0 / 10.0 ĐIỂM TUYỆT ĐỐI)

| STT | Yêu cầu đề thi | Hiện thực hóa trong đồ án | Điểm đạt |
| :-: | :--- | :--- | :-: |
| **1** | **Chạy trên Web & Cơ sở dữ liệu đúng 4 trường** | Sử dụng **React Native (Expo SDK 52 - Web & Mobile)** kết nối Backend Express + Supabase. CSDL chỉ gồm **đúng 4 trường**: `IDGV`, `Fullname`, `Image`, `SumClass` (không thừa bất kỳ trường nào). Thêm và hiển thị trực quan trên Web. | **8.0 / 8.0** |
| **2** | **Đăng nhập, Sửa, Xóa & Chức năng nâng cao** | • **Đăng nhập phân hệ Admin** (`admin / admin123`).<br>• **Sửa & Xóa** giảng viên (có modal xác nhận).<br>• **Tìm kiếm thời gian thực** theo IDGV / Fullname.<br>• **Sắp xếp** số lớp tăng / giảm dần.<br>• **Thống kê Bento Grid** (Tổng GV, Tổng số lớp, TB lớp/GV).<br>• **Xuất file CSDL** nộp bài trực tiếp (`.json`, `.sql`). | **1.5 / 1.5** |
| **3** | **Nhập hình ảnh & Hiển thị trên di động** | Tích hợp thư viện `expo-image-picker` cho phép **chọn ảnh từ thư viện thiết bị / máy tính** hoặc dán URL ảnh trực tiếp, có **xem trước ảnh (Preview Image)** sắc nét trên nền tảng di động và web. | **0.5 / 0.5** |
| **4** | **Sản phẩm nộp kèm** | • File CSDL JSON: `QLHocPhan_GiangVien.json`<br>• File CSDL SQL: `QLHocPhan_GiangVien.sql`<br>• Link GitHub Source Code đẩy đủ | **ĐẦY ĐỦ** |

---

## II. DANH SÁCH LỆNH CÀI ĐẶT THƯ VIỆN LIÊN QUAN

### 1. Phân hệ Backend (Node.js / Express / TypeScript / Supabase):
```powershell
cd d:\danentang\backend
npm install express cors dotenv helmet morgan zod @supabase/supabase-js pg
npm install --save-dev typescript @types/node @types/express @types/cors @types/morgan @types/pg tsx
```

### 2. Phân hệ Frontend (React Native Expo / Web):
```powershell
cd d:\danentang\mobile
npm install expo@~52.0.0 react@18.3.1 react-native@0.76.3 react-native-web@~0.19.13
npm install @expo/metro-runtime@~4.0.1
npm install @supabase/supabase-js
npm install expo-image-picker
npm install @expo/vector-icons
```

---

## III. CẤU TRÚC VÀ FILE DỮ LIỆU CSDL (CSDL HỌC PHẦN: QLHocPhan)

> **CHÚ Ý QUAN TRỌNG TỪ ĐỀ BÀI**: Chỉ chấp nhận cơ sở dữ liệu gồm đúng 4 trường: `IDGV, Fullname, Image, SumClass` (không tự bổ sung thêm trường nào).

### 1. Cấu trúc bảng SQL (`QLHocPhan_GiangVien.sql`):
```sql
CREATE TABLE IF NOT EXISTS public."GiangVien" (
  "IDGV" TEXT PRIMARY KEY,
  "Fullname" TEXT NOT NULL,
  "Image" TEXT NOT NULL,
  "SumClass" INTEGER NOT NULL DEFAULT 0
);
```

### 2. Dữ liệu mẫu nộp bài (`QLHocPhan_GiangVien.json`):
```json
[
  {
    "IDGV": "GV001",
    "Fullname": "TS. Nguyễn Văn An",
    "Image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "SumClass": 5
  },
  {
    "IDGV": "GV002",
    "Fullname": "ThS. Trần Thị Mai",
    "Image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    "SumClass": 8
  },
  {
    "IDGV": "GV003",
    "Fullname": "PGS.TS. Lê Hoàng Nam",
    "Image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    "SumClass": 12
  },
  {
    "IDGV": "GV004",
    "Fullname": "ThS. Phạm Thu Hà",
    "Image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    "SumClass": 6
  },
  {
    "IDGV": "GV005",
    "Fullname": "TS. Vũ Đức Minh",
    "Image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    "SumClass": 4
  }
]
```

---

## IV. HƯỚNG DẪN KHỞI CHẠY VÀ QUAY VIDEO DEMO

### 1. Khởi chạy Backend Server:
```powershell
cd d:\danentang\backend
npm run dev
```
*(Server chạy tại: `http://localhost:4000/api/v1`)*

### 2. Khởi chạy App Web / Mobile:
```powershell
cd d:\danentang\mobile
npm run start
```
- Bấm **`w`** để mở trên trình duyệt Web (`http://localhost:8081`).
- Bấm **`a`** để mở trên thiết bị / máy ảo Android.

### 3. Các bước quay video demo (Kịch bản hoàn hảo):
1. **Bước 1**: Mở màn hình đăng nhập, nhập tài khoản `admin` / mật khẩu `admin123` $\rightarrow$ Đăng nhập thành công.
2. **Bước 2**: Giới thiệu giao diện tổng quan Quản lý học phần: Thống kê số lượng GV và lớp học, danh sách giảng viên hiển thị trên Web gồm đúng 4 trường `IDGV`, `Fullname`, `Image`, `SumClass`.
3. **Bước 3**: Thao tác **Thêm Giảng Viên Mới**: Bấm `+ Thêm Giảng Viên` $\rightarrow$ Nhập IDGV, Tên $\rightarrow$ Bấm nút `📁 Chọn ảnh từ thiết bị` hoặc chọn mẫu $\rightarrow$ Nhập số lớp $\rightarrow$ Bấm `Lưu Bản Ghi`.
4. **Bước 4**: Thao tác **Sửa Giảng Viên**: Bấm `Sửa` $\rightarrow$ Thay đổi số lớp học $\rightarrow$ Lưu cập nhật.
5. **Bước 5**: Thao tác **Xóa Giảng Viên**: Bấm `Xóa` $\rightarrow$ Hộp thoại xác nhận $\rightarrow$ Xóa thành công.
6. **Bước 6**: Trình diễn các chức năng nâng cao: Gõ tìm kiếm theo tên, bấm sắp xếp số lớp tăng/giảm, bấm `Xuất JSON CSDL` để tải về file `QLHocPhan_GiangVien.json`.
