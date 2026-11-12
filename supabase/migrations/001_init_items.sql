-- ============================================================================
-- SUPABASE POSTGRESQL INITIAL MIGRATION: 001_init_items.sql
-- Project: DaNenTang Base (React Native + Express Clean Architecture + Supabase)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY DEFAULT ('item-' || encode(gen_random_bytes(6), 'hex')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'GENERAL',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast filtering & sorting
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items (status);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON public.items (updated_at DESC);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_items_updated_at ON public.items;
CREATE TRIGGER trg_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.set_items_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for all users" ON public.items;
CREATE POLICY "Allow read access for all users"
  ON public.items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow write access for authenticated and service_role" ON public.items;
CREATE POLICY "Allow write access for authenticated and service_role"
  ON public.items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Seed initial base records
INSERT INTO public.items (id, title, description, category, status, priority)
VALUES
  (
    'item-seed-001',
    'Khởi tạo Base React Native & Supabase PostgreSQL',
    'Kết nối thành công từ ứng dụng Mobile React Native tới Backend Express TypeScript và Supabase Database.',
    'ARCHITECTURE',
    'COMPLETED',
    'HIGH'
  ),
  (
    'item-seed-002',
    'Cấu hình Clean Architecture & DDD Repository',
    'Tách biệt rõ ràng Domain Entity, Repository Port, Supabase Adapter và HTTP Controller.',
    'BACKEND',
    'ACTIVE',
    'HIGH'
  ),
  (
    'item-seed-003',
    'Sẵn sàng nhận yêu cầu nghiệp vụ từ Master',
    'Base hệ thống Supabase đã chạy ổn định 100%, sẵn sàng mở rộng các bảng và module nghiệp vụ tiếp theo.',
    'MOBILE',
    'PENDING',
    'MEDIUM'
  )
ON CONFLICT (id) DO NOTHING;
