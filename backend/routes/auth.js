const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'khh-telemedicine-secret-2024';
const JWT_EXPIRES = '8h'; // Session หมดอายุใน 8 ชั่วโมง

// รหัสผ่านกลางที่ใช้เข้าสู่ระบบ (สามารถกำหนดใน .env ได้)
const DEFAULT_PASSWORD = process.env.PROVIDER_PASSWORD || 'KHH@1234';
const DEFAULT_PIN = process.env.PROVIDER_PIN || '123456';

// รายชื่อผู้ใช้แบบ Static
const STATIC_USERS = {
  'KHH001': { name: 'เจ้าหน้าที่เภสัชกรรม KHH', role: 'admin' },
  'KHH002': { name: 'เจ้าหน้าที่ รพ.สต. ปฐมภูมิ 1', role: 'viewer' },
  'KHH003': { name: 'เจ้าหน้าที่ รพ.สต. ปฐมภูมิ 2', role: 'viewer' },
  'ADMIN': { name: 'ผู้ดูแลระบบ KHH', role: 'admin' }
};

// Middleware: ตรวจสอบ JWT Token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่มีสิทธิ์เข้าถึง — กรุณาเข้าสู่ระบบ' });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token หมดอายุหรือไม่ถูกต้อง — กรุณาเข้าสู่ระบบใหม่' });
  }
}

// POST /api/auth/login — เข้าสู่ระบบด้วย ProviderID + Password
router.post('/login', async (req, res) => {
  try {
    const { providerId, password } = req.body;

    if (!providerId || !password) {
      return res.status(400).json({ error: 'กรุณาระบุ ProviderID และรหัสผ่าน' });
    }

    const cleanId = providerId.trim().toUpperCase();

    // ตรวจสอบความถูกต้อง
    // 1. ค้นหาใน STATIC_USERS หรืออนุญาตถ้ารูปแบบขึ้นต้นด้วย KHH และตามด้วยตัวเลข
    let userDetail = STATIC_USERS[cleanId];
    
    if (!userDetail && /^KHH\d+$/.test(cleanId)) {
      userDetail = { name: `ผู้ให้บริการ ${cleanId}`, role: 'viewer' };
    }

    if (!userDetail) {
      return res.status(401).json({ error: 'ไม่พบ ProviderID ที่ลงทะเบียนในระบบ' });
    }

    // 2. ตรวจสอบรหัสผ่านกลาง หรือ PIN กลาง
    if (password !== DEFAULT_PASSWORD && password !== DEFAULT_PIN) {
      return res.status(401).json({ error: 'รหัสผ่านหรือ PIN ไม่ถูกต้อง' });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        id: cleanId,
        providerId: cleanId,
        name: userDetail.name,
        role: userDetail.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`✅ Login สำเร็จ (Static): ${cleanId} (${userDetail.name}) role=${userDetail.role}`);

    res.json({
      token,
      user: {
        id: cleanId,
        providerId: cleanId,
        name: userDetail.name,
        role: userDetail.role,
      },
      expiresIn: JWT_EXPIRES,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
});

// GET /api/auth/me — ตรวจสอบ token ปัจจุบัน
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout — Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
});

// GET /api/auth/users — คืนค่าผู้ใช้ทั้งหมดที่มีสิทธิ์
router.get('/users', authMiddleware, (req, res) => {
  const usersList = Object.entries(STATIC_USERS).map(([id, info]) => ({
    provider_id: id,
    name: info.name,
    role: info.role,
    is_active: true
  }));
  res.json(usersList);
});

module.exports = { router, authMiddleware };
