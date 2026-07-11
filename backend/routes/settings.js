const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../.env');
const { authMiddleware } = require('./auth');

router.use(authMiddleware);

// ฟังก์ชันอ่านค่าจาก .env file
function readEnvFile() {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (key) env[key] = val;
    });
    return env;
  } catch (err) {
    return {};
  }
}

// ฟังก์ชันเขียนค่าลง .env file และ process.env
function writeEnvFile(updates) {
  let content = '';
  try {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  } catch (err) {
    content = '';
  }

  let lines = content.split('\n');

  Object.entries(updates).forEach(([key, value]) => {
    const idx = lines.findIndex(l => l.trim().startsWith(key + '='));
    const newLine = `${key}=${value}`;
    if (idx !== -1) {
      lines[idx] = newLine;
    } else {
      lines.push(newLine);
    }
    // อัปเดต process.env ทันทีโดยไม่ต้องรีสตาร์ท
    process.env[key] = value;
  });

  // ลบบรรทัดว่างซ้ำซ้อนออก
  const cleaned = lines.filter((l, i) => l.trim() !== '' || lines[i - 1]?.trim() !== '');
  fs.writeFileSync(ENV_PATH, cleaned.join('\n') + '\n');
}

// GET /api/settings - ดึงการตั้งค่าปัจจุบัน (ซ่อน sensitive keys บางส่วน)
router.get('/', (req, res) => {
  const env = readEnvFile();

  const anonKey = env.SUPABASE_ANON_KEY || '';
  const maskedKey = anonKey.length > 20
    ? anonKey.substring(0, 12) + '•'.repeat(16) + anonKey.slice(-8)
    : anonKey ? '•'.repeat(anonKey.length) : '';

  res.json({
    system: {
      port: env.PORT || process.env.PORT || '3001',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
    },
    supabase: {
      url: env.SUPABASE_URL || '',
      anonKeyMasked: maskedKey,
      isConfigured: !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE'),
    },
    googleSheets: {
      webappUrl: env.GOOGLE_SHEET_WEBAPP_URL || '',
      isConfigured: !!(
        env.GOOGLE_SHEET_WEBAPP_URL &&
        env.GOOGLE_SHEET_WEBAPP_URL !== 'YOUR_GOOGLE_SHEET_WEBAPP_URL_HERE' &&
        env.GOOGLE_SHEET_WEBAPP_URL.startsWith('http')
      ),
    }
  });
});

// PUT /api/settings - อัปเดตการตั้งค่า
router.put('/', (req, res) => {
  try {
    const { googleSheetWebappUrl } = req.body;

    const updates = {};
    if (typeof googleSheetWebappUrl !== 'undefined') {
      updates['GOOGLE_SHEET_WEBAPP_URL'] = googleSheetWebappUrl.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'ไม่มีข้อมูลที่ต้องการบันทึก' });
    }

    writeEnvFile(updates);

    console.log('⚙️ อัปเดตการตั้งค่าระบบสำเร็จ:', Object.keys(updates).join(', '));
    res.json({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ (มีผลทันทีโดยไม่ต้องรีสตาร์ท)' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้: ' + err.message });
  }
});

// GET /api/settings/test-sheet - ทดสอบการเชื่อมต่อ Google Sheets
router.get('/test-sheet', async (req, res) => {
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (!url || url === 'YOUR_GOOGLE_SHEET_WEBAPP_URL_HERE' || !url.startsWith('http')) {
    return res.status(400).json({
      success: false,
      message: 'ยังไม่ได้กำหนดค่า GOOGLE_SHEET_WEBAPP_URL หรือ URL ไม่ถูกต้อง'
    });
  }

  try {
    const testPayload = { action: 'upsert', data: { id: '_test_connection_' } };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return res.json({ success: false, message: `Google Sheets ตอบกลับ HTTP ${response.status}` });
    }

    const result = await response.json();
    if (result.success) {
      res.json({ success: true, message: 'เชื่อมต่อ Google Sheets สำเร็จ ✅' });
    } else {
      res.json({ success: false, message: `Google Sheets แจ้งข้อผิดพลาด: ${result.error || 'Unknown'}` });
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      res.json({ success: false, message: 'หมดเวลาเชื่อมต่อ (Timeout 8s) — ตรวจสอบ URL หรือสิทธิ์การเข้าถึง' });
    } else {
      res.json({ success: false, message: 'ไม่สามารถเชื่อมต่อได้: ' + err.message });
    }
  }
});

module.exports = router;
