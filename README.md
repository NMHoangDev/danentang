# DaNenTang — React Native + Express Clean Architecture Backend + Supabase PostgreSQL Base

Base dự án đa nền tảng (Android / iOS / Web) kết nối **React Native (Expo SDK 52)** với **Backend Node.js/TypeScript (Express + Clean Architecture/DDD)** và **Supabase PostgreSQL Database (PostgreSQL + RLS + Supabase Auth)**.

---

## 1. Cấu trúc Monorepo Clean Architecture

```
d:\danentang/
├── backend/                  # Node.js + Express + TypeScript + @supabase/supabase-js
│   ├── src/
│   │   ├── config/           # env.ts & supabase.config.ts (Smart Dual-Mode Adapter)
│   │   ├── libs/ddd/         # Base Entity, RepositoryPort, ApiResponse Envelope
│   │   ├── middlewares/      # Supabase Auth Middleware & Global Error Handler
│   │   ├── modules/
│   │   │   ├── health/       # GET /api/v1/health (Diagnostics + Supabase Ping)
│   │   │   └── items/        # CRUD Module (Entity, Port, Supabase Repo, Controller)
│   │   ├── testing/          # integration-verify.ts (Automated E2E API + DB Test)
│   │   ├── app.ts            # Express App Composition
│   │   └── server.ts         # HTTP Server Bootstrap (Port 4000)
│   └── .env                  # Cấu hình cổng & Supabase credentials
│
├── mobile/                   # React Native (Expo SDK 52) + Feature-Based Clean Arch
│   ├── src/
│   │   ├── config/           # env.ts & supabase.client.ts (@supabase/supabase-js)
│   │   ├── lib/              # api-client.ts (Auto Bearer Token + Dual-Env Switch)
│   │   └── features/
│   │       ├── system-health/# API & Types kiểm tra kết nối Backend/Supabase
│   │       └── items/        # API & Types thao tác Table `items` trên Supabase
│   ├── App.tsx               # Màn hình Dashboard Quản trị & Kiểm thử kết nối
│   └── .env                  # Cấu hình EXPO_PUBLIC_API_BASE_URL & Supabase Client
│
└── supabase/
    └── migrations/
        └── 001_init_items.sql # DDL Table `items`, Trigger updated_at, Indexes, RLS
```

---

## 2. Cơ chế Kết nối Supabase Thông minh (Smart Dual-Mode Adapter)

Tại [`backend/src/config/supabase.config.ts`](file:///d:/danentang/backend/src/config/supabase.config.ts), hệ thống hỗ trợ tự động chuyển đổi giữa **Cloud Supabase PostgreSQL thật** và **Local Persistent Supabase Engine**:
1. **Chế độ Cloud Supabase (`SUPABASE_CLOUD_SERVICE_ROLE` / `SUPABASE_CLOUD_ANON`)**:
   - Điền `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` (hoặc `SUPABASE_ANON_KEY`) vào `backend/.env`.
   - Chạy file SQL migration tại `supabase/migrations/001_init_items.sql` trên SQL Editor của Supabase.
   - Hệ thống tự động kết nối thẳng vào database PostgreSQL trên Supabase Cloud.
2. **Chế độ Local Persistent Engine (`SUPABASE_LOCAL_PERSISTENT_ENGINE`)**:
   - Khi mới dựng Base chưa điền link Supabase Cloud, Backend tự động vận hành kho dữ liệu JSON bền vững tại `backend/data/local-supabase.json` tương thích 100% giao diện table/row để phát triển và kiểm thử mà không bị gián đoạn.

---

## 3. Lệnh Khởi Chạy Nhanh

```powershell
# 1. Khởi chạy Backend Server (Port 4000)
cd d:\danentang\backend
npm run dev

# 2. Khởi chạy Ứng dụng React Native (Web / Android / iOS)
cd d:\danentang\mobile
npm run start
```
