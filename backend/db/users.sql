-- ตาราง users สำหรับระบบ Login ด้วย ProviderID
-- รันใน Supabase SQL Editor: https://supabase.com/dashboard/project/hxejooyqjjrdycxzgdkp/sql/new

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,     -- รหัสผู้ให้บริการ (เช่น KHH001)
  name TEXT NOT NULL,                   -- ชื่อ-สกุลผู้ใช้
  role TEXT NOT NULL DEFAULT 'viewer'  -- 'admin' หรือ 'viewer'
    CHECK (role IN ('admin', 'viewer')),
  password_hash TEXT NOT NULL,          -- bcrypt hashed password
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตเฉพาะ service_role (backend) เท่านั้น ไม่ให้ anon เข้าถึง
CREATE POLICY "Service role only" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Index ช่วยค้นหาเร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);

-- ตัวอย่าง: เพิ่ม Admin คนแรก (password: Admin@1234)
-- password_hash สร้างด้วย bcrypt rounds=10
-- ใช้ endpoint POST /api/auth/seed-admin เพื่อสร้าง admin คนแรกได้สะดวกกว่า
-- หรือสร้างด้วย node: require('bcryptjs').hashSync('Admin@1234', 10)

-- ตรวจสอบตาราง
SELECT * FROM users;
