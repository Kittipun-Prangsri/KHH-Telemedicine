// KHH Telemedicine Primary Care Server
const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');
const patientsRouter = require('./routes/patients');
const settingsRouter = require('./routes/settings');
const { router: authRouter } = require('./routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger payloads for bulk import

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Patients API Router
app.use('/api/patients', patientsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Simple check on startup if patients table is ready in Supabase
async function checkDatabase() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (error) {
      console.warn('\n⚠️  แจ้งเตือน: ตาราง "patients" อาจจะยังไม่ได้ถูกสร้างในฐานข้อมูล Supabase');
      console.warn(`👉 ข้อผิดพลาด: ${error.message}`);
      console.warn('👉 วิธีแก้ไข: กรุณาคัดลอก SQL ในไฟล์ backend/db/setup.sql ไปรันบน Supabase SQL Editor\n');
    } else {
      console.log('✅ เชื่อมต่อกับ Supabase และพบตาราง "patients" เรียบร้อยแล้ว!');
    }
  } catch (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อกับ Supabase ได้:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server backend กำลังรันอยู่ที่ http://localhost:${PORT}`);
  checkDatabase();
});
