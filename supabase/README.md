# Supabase (crpao-paytrack)

Backend ใช้ **Supabase Postgres + Auth** แทน Google Apps Script / Sheets

## 1) สร้างโปรเจกต์

1. ไปที่ [supabase.com](https://supabase.com) → New project  
2. รอฐานข้อมูลพร้อม  
3. **Project Settings → API** คัดลอก  
   - Project URL → `VITE_SUPABASE_URL`  
   - anon public → `VITE_SUPABASE_ANON_KEY`  
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (ใช้เฉพาะสคริปต์โอนข้อมูล ห้ามใส่ในเว็บ)

## 2) สร้างตาราง

เปิด **SQL Editor** แล้วรันไฟล์ [`migrations/001_schema.sql`](./migrations/001_schema.sql) ทั้งไฟล์

## 3) โอนข้อมูลจาก Google Sheets

ใส่ค่าใน `.env.local` (ดู `.env.example`) อย่างน้อย:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### วิธี A — ดึงจาก GAS (แนะนำถ้ายังเรียก API ได้)

```bash
npm run migrate:from-gas
```

ต้องมี `VITE_GAS_URL` ใน `.env.local` (ใช้ชั่วคราว)

### วิธี B — จาก CSV

1. Export ชีต `User` และ `Data` จาก Google Sheets เป็น CSV  
2. วางเป็น `scripts/sheet-export/User.csv` และ `Data.csv`  
3. รัน:

```bash
npm run migrate:from-csv
```

ลำดับคอลัมน์ `Data`: id, dikaNo, date, subject, amount, payee, department, assignee, status, timestamp, finishtime, notes  
ลำดับคอลัมน์ `User`: username, password, name, role

## 4) Login หลังย้าย

- ชื่อผู้ใช้ = **username เดิม** (เช่น `user001`)  
- รหัสผ่าน = **รหัสเดิมในชีต User** (ระบบสร้างบัญชี Auth อีเมล `{username}@paytrack.crpao.app`)

## 5) GitHub Pages

ตั้ง Secrets ใน repo:

| Secret | ค่า |
|--------|-----|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon key |

Workflow จะเขียน `public/config.json` ตอน build
