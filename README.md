# KHH Telemedicine 🏥
ระบบติดตามการส่งยาทางไกล เครือข่ายบริการปฐมภูมิ — ผู้ป่วยโรคเรื้อรัง

โปรเจ็กต์นี้ได้รับการแยกไฟล์ออกเป็นสถาปัตยกรรมแบบ **Fullstack** (Node.js Backend & React Frontend) เชื่อมต่อกับฐานข้อมูล **Supabase**

---

## 📂 โครงสร้างโปรเจ็กต์
```
khh-telemedicine/
├── backend/            # Express.js backend เชื่อมต่อ Supabase
│   ├── routes/         # REST API routesสำหรับผู้ป่วย
│   ├── db/             # สคริปต์ SQL สำหรับสร้างตาราง
│   └── supabase.js     # เชื่อมต่อ Supabase Client
├── frontend/           # Vite + React + Tailwind CSS
│   ├── src/
│   │   ├── components/ # คอมโพเนนต์ย่อยแยกการทำงาน
│   │   ├── pages/      # หน้า Dashboard และหน้าดูรายการผู้ป่วย
│   │   └── App.jsx     # จุดเชื่อมต่อของหน้าหลัก
└── package.json        # สคริปต์สำหรับรันทั้งระบบแบบ Concurrent
```

---

## 🚀 ขั้นตอนการติดตั้งและรันระบบ

### 1. ตั้งค่าฐานข้อมูล Supabase
1. ไปที่ [Supabase SQL Editor](https://supabase.com/dashboard/project/hxejooyqjjrdycxzgdkp/sql) ของโปรเจ็กต์คุณ
2. คัดลอกเนื้อหาทั้งหมดในไฟล์ [backend/db/setup.sql](file:///d:/website/khh-telemedicine/backend/db/setup.sql) ไปวางและกด **Run**
3. ตาราง `patients` จะถูกสร้างขึ้นมาพร้อมกับเปิดใช้งาน Row Level Security (RLS) และเพิ่ม Policy อัตโนมัติ

### 2. ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)
1. เปิดไฟล์ [backend/.env](file:///d:/website/khh-telemedicine/backend/.env)
2. แทนที่ค่า `YOUR_SUPABASE_ANON_KEY_HERE` ด้วย **Anon key** จริงที่คัดลอกมาจาก:
   * **Supabase Dashboard** -> **Project Settings** -> **API** -> **`anon public`**

### 3. รันโปรเจ็กต์
ในโฟลเดอร์หลัก (Root) ให้พิมพ์คำสั่งด้านล่างนี้ใน Terminal:

1. **ติดตั้งโมดูลและไลบรารีทั้งหมด (Backend & Frontend):**
   ```bash
   npm run install:all
   ```

2. **รันระบบทดสอบทั้ง Backend & Frontend ไปพร้อมกัน:**
   ```bash
   npm run dev
   ```

ระบบจะเปิดหน้าเว็บที่:
* **Frontend:** [http://localhost:5173](http://localhost:5173) (จะส่งผ่าน API ไปยัง Backend โดยตรง)
* **Backend:** [http://localhost:3001](http://localhost:3001)

---

## 🛠️ เทคโนโลยีที่ใช้
* **Frontend:** React, Tailwind CSS, Recharts (แสดงกราฟ), XLSX (นำเข้าไฟล์), Axios, Lucide React
* **Backend:** Node.js, Express.js, Supabase JS Client, CORS
* **Database:** Supabase PostgreSQL
