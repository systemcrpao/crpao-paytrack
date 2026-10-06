# Supabase — crpao-paytrack

Backend ปัจจุบันใช้ **Supabase Postgres + Auth** (ไม่ใช้ Google Apps Script / Sheets แล้ว)

## 1) สร้างโปรเจกต์

1. [supabase.com](https://supabase.com) → **New project**
2. รอฐานข้อมูลพร้อม
3. **Project Settings → API** คัดลอก:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (เฉพาะเครื่อง dev / สคริปต์ migrate)

## 2) สร้างตารางและ RLS

Dashboard → **SQL Editor** → วางและรันทั้งไฟล์ [`migrations/001_schema.sql`](./migrations/001_schema.sql)

### ตาราง `public.profiles`

| คอลัมน์ | ความหมาย (เทียบชีต User) |
|---------|---------------------------|
| `id` | UUID = `auth.users.id` |
| `username` | คอลัมน์ username |
| `name` | ชื่อ-นามสกุล |
| `role` | Admin / Manager / User |

### ตาราง `public.dika`

| คอลัมน์ DB | ฟิลด์ในแอป (ชีต Data) |
|------------|----------------------|
| `id` | id (เช่น DK-0001) |
| `dika_no` | dikaNo |
| `date` | date (ข้อความ dd/MM/yyyy พ.ศ.) |
| `subject` | subject |
| `amount` | amount |
| `payee` | payee |
| `department` | department |
| `assignee` | assignee |
| `status` | status |
| `created_at_display` | timestamp (วันที่บันทึก) |
| `finishtime` | finishtime |
| `notes` | notes |
| `updated_at` | อัปเดตอัตโนมัติฝั่ง API |

### RLS (สรุป)

- ต้อง **authenticated** (login แล้ว) จึงอ่าน `profiles` / `dika` และ insert/update `dika` ได้
- รายละเอียด policy อยู่ในไฟล์ migration

## 3) ตั้งค่า `.env.local`

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

ข้อควรระวัง:

- ใส่ key **เฉพาะค่า JWT** — **ห้าม** `# คอมเมนต์` ต่อท้ายบรรทัดเดียวกัน
- key ต้องขึ้นต้น `eyJ` (ถ้ามีตัวอักษรเกินหน้า `eyJ` ให้ลบ)

## 4) โอนข้อมูลจาก Google Sheets

### วิธี A — CSV (แนะนำ)

1. Export ชีต **User** และ **Data** เป็น CSV (UTF-8)
2. วางที่:
   - `scripts/sheet-export/User.csv`
   - `scripts/sheet-export/Data.csv`
3. รัน:

```bash
npm run migrate:from-csv
```

**Header แถวแรก (แนะนำ):**

- **User:** `username,password,name,role`
- **Data:** `id,dikaNo,date,subject,amount,payee,department,assignee,status,timestamp,finishtime,notes`

**รหัสผ่าน:** Supabase Auth ต้องการ **อย่างน้อย 6 ตัว** — ถ้าในชีตเป็น `12345` ให้ใช้ `123456` (หรือตั้ง min length ใน Dashboard) ก่อน migrate

### วิธี B — ดึงจาก GAS (ชั่วคราว)

ถ้ายังมี Web App `/exec` ที่อ่านข้อมูลได้:

```env
VITE_GAS_URL=https://script.google.com/macros/s/.../exec
```

```bash
npm run migrate:from-gas
```

สคริปต์จะลอง `getUsersChunk` / `getDikaChunk` ก่อน แล้ว fallback `getBootstrap`

## 5) บัญชี Auth หลัง migrate

สคริปต์สร้างผู้ใช้ใน Supabase Auth ด้วย:

- **Email (ภายใน):** `{username}@paytrack.crpao.app` (ตัวพิมพ์เล็ก)
- **Password:** ตาม CSV / ชีต
- แถวใน `profiles` ผูกกับ `auth.users`

ผู้ใช้ login ที่หน้าเว็บด้วย **username + password** เท่านั้น (แอปแปลงเป็น email ให้)

## 6) GitHub Pages

Repository Secrets:

| Secret | ค่า |
|--------|-----|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public |

Workflow `.github/workflows/deploy-pages.yml` จะ:

1. เขียน `public/config.json` จาก Secrets
2. Build ด้วย `VITE_*` เดียวกัน

ไม่ใช้ service_role ใน CI

## 7) แก้ปัญหา migrate ที่พบบ่อย

| อาการ | สาเหตุ / แก้ |
|--------|----------------|
| `ByteString ... 8212` | มี em-dash หรือคอมเมนต์ `#` ติดใน JWT ใน `.env.local` |
| `Password should be at least 6 characters` | รหัสผ่านใน CSV สั้นเกิน — ใช้อย่างน้อย 6 ตัว |
| Login ไม่ได้บน Pages | ตรวจ `/crpao-paytrack/config.json` และ Secrets ชื่อ `VITE_*` ตรงตัว |
