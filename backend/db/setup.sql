-- ============================================================
-- KHH Telemedicine - Database Setup
-- รันไฟล์นี้ใน Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/hxejooyqjjrdycxzgdkp/sql
-- ============================================================

-- สร้างตาราง patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  hn TEXT NOT NULL,
  name TEXT NOT NULL,
  clinic_tags TEXT[] DEFAULT '{}',
  bp TEXT DEFAULT '',
  fbs TEXT DEFAULT '',
  rights TEXT DEFAULT '',
  order_date DATE,
  next_appt DATE,
  facility TEXT DEFAULT '',
  sent_to TEXT DEFAULT '',
  dispatch_date DATE,
  pharmacist TEXT DEFAULT '',
  injection TEXT DEFAULT '',
  received_by TEXT DEFAULT '',
  patient_received_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิดใช้งาน Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตทุก operation (ปรับได้ตามความต้องการ)
DROP POLICY IF EXISTS "Allow all operations" ON patients;
CREATE POLICY "Allow all operations" ON patients
  FOR ALL USING (true) WITH CHECK (true);

-- ตรวจสอบผลลัพธ์
SELECT 'ตาราง patients สร้างสำเร็จ ✅' AS status;
