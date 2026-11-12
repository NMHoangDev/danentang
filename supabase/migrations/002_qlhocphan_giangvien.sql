-- ============================================================================
-- CƠ SỞ DỮ LIỆU: QLHocPhan
-- BẢNG / COLLECTION: GiangVien
-- QUY ĐỊNH BẮT BUỘC: CHỈ GỒM ĐÚNG 4 TRƯỜNG: IDGV, Fullname, Image, SumClass
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."GiangVien" (
  "IDGV" TEXT PRIMARY KEY,
  "Fullname" TEXT NOT NULL,
  "Image" TEXT NOT NULL,
  "SumClass" INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public."GiangVien" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for GiangVien" ON public."GiangVien";
CREATE POLICY "Allow all for GiangVien"
  ON public."GiangVien"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Dữ liệu mẫu (Seed Data)
INSERT INTO public."GiangVien" ("IDGV", "Fullname", "Image", "SumClass")
VALUES
  ('GV001', 'TS. Nguyễn Văn An', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 5),
  ('GV002', 'ThS. Trần Thị Mai', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', 8),
  ('GV003', 'PGS.TS. Lê Hoàng Nam', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 12),
  ('GV004', 'ThS. Phạm Thu Hà', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', 6),
  ('GV005', 'TS. Vũ Đức Minh', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 4)
ON CONFLICT ("IDGV") DO UPDATE 
SET "Fullname" = EXCLUDED."Fullname",
    "Image" = EXCLUDED."Image",
    "SumClass" = EXCLUDED."SumClass";
