# crpao-paytrack

ระบบบริหารจัดการเรื่องเบิกจ่าย (ฎีกา) สำหรับ อบจ. เชียงราย — **React (GitHub Pages) + Supabase (PostgreSQL + Auth)**

| | |
|---|---|
| Repository | [systemcrpao/crpao-paytrack](https://github.com/systemcrpao/crpao-paytrack) |
| เว็บ production | https://systemcrpao.github.io/crpao-paytrack/ |
| Backend | Supabase project (ตั้งค่าใน Secrets / `.env.local`) |

## เทคโนโลยี

| ชั้น | รายการ |
|------|--------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7, Zustand |
| Backend | Supabase Postgres, Supabase Auth, Row Level Security |
| Deploy | GitHub Actions → GitHub Pages (`VITE_BASE_PATH=/crpao-paytrack/`) |

## ฟีเจอร์หลัก

- Login ด้วย **username + password** ( role: **Admin**, **Manager**, **User** )
- Dashboard (`/`): ค้นหา, กรองปีงบประมาณ, สถานะ, เพิ่ม/แก้ไขเรื่อง (ตามสิทธิ์)
- ภาพรวม (`/overview`): สรุปและกราฟ
- ปีงบประมาณจาก **วันรับเรื่อง** (ฟิลด์ `date`): 1 ต.ค. – 30 ก.ย.
- โหลดข้อมูลครั้งเดียวจาก Supabase + cache ใน `sessionStorage` (~10 นาที)

## สถาปัตยกรรม (ย่อ)

```
เบราว์เซอร์ (React)
  → Supabase Auth (login / session)
  → PostgREST (ตาราง dika, profiles) ด้วย anon key + JWT ของผู้ login
```

- ข้อมูลเรื่องเบิกจ่าย: ตาราง `public.dika`
- ชื่อ/role สำหรับ UI: ตาราง `public.profiles` (ผูก `auth.users`)
- รายละเอียดสคีมาและการ migrate: [`supabase/README.md`](supabase/README.md)

## เริ่มต้นพัฒนาในเครื่อง

```bash
npm install
cp .env.example .env.local
```

แก้ `.env.local` (คัดลอกจาก Supabase → **Project Settings → API**):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- **อย่า**ใส่ `# คำอธิบาย` ต่อท้าย key บนบรรทัดเดียวกัน (จะทำให้ JWT เสีย)
- สคริปต์โอนข้อมูลต้องการ `SUPABASE_SERVICE_ROLE_KEY` เพิ่ม (ดู `.env.example`)

ตั้งตาราง + โอนข้อมูลครั้งแรก: [`supabase/README.md`](supabase/README.md)

```bash
npm run dev
```

เปิด http://localhost:5173

## Deploy บน GitHub Pages

1. **Settings → Secrets and variables → Actions** (Repository secrets)

   | Secret | ใช้เมื่อ |
   |--------|----------|
   | `VITE_SUPABASE_URL` | build + เขียน `public/config.json` |
   | `VITE_SUPABASE_ANON_KEY` | build + เขียน `public/config.json` |

   ไม่ต้องใส่ `SUPABASE_SERVICE_ROLE_KEY` ใน GitHub (ใช้ migrate ในเครื่องเท่านั้น)

2. **Settings → Pages** → Source: **GitHub Actions**

3. Push branch `main` → ตรวจ workflow **Deploy GitHub Pages**

4. หลัง deploy ตรวจ https://systemcrpao.github.io/crpao-paytrack/config.json ว่ามี `supabaseUrl` / `supabaseAnonKey`

คู่มือก่อน push / ตรวจ secret: [`docs/GITHUB-PUSH-CHECKLIST.md`](docs/GITHUB-PUSH-CHECKLIST.md)

### Build แบบเดียวกับ Pages (ในเครื่อง)

PowerShell:

```powershell
$env:VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJ..."
$env:VITE_BASE_PATH="/crpao-paytrack/"
npm run build
npm run preview
```

## โครงสร้างโปรเจกต์

```
src/
  pages/                 Login, Dashboard, Overview
  services/
    api.js               CRUD + login ผ่าน Supabase
    supabaseClient.js    client + แปลง username → email Auth
    supabaseConfig.js    อ่าน env / public/config.json
  store/
    authStore.js         profile + persist (ร่วมกับ Supabase session)
    dikaStore.js         cache bootstrap
  utils/workflow.js      ปีงบประมาณ, สถานะ, สิทธิ์ตาม role
supabase/
  migrations/001_schema.sql
  README.md
scripts/
  migrate-from-csv.mjs   โอนจาก CSV
  migrate-from-gas.mjs   โอนจาก GAS (ถ้ายังมี URL เก่า)
  write-github-config.cjs
docs/
  GITHUB-PUSH-CHECKLIST.md
public/
  config.json            ใน repo ว่าง — CI เติมตอน build
  config.example.json
```

## สคริปต์ npm

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | พัฒนา local |
| `npm run build` | build → `dist/` |
| `npm run preview` | ดูผล build |
| `npm run migrate:from-csv` | โอน `scripts/sheet-export/*.csv` → Supabase |
| `npm run migrate:from-gas` | โอนจาก Web App GAS (ต้องมี `VITE_GAS_URL` ชั่วคราว) |

## การเข้าสู่ระบบ (หลังย้าย Supabase)

- ช่อง **ชื่อผู้ใช้** = `username` ในตาราง/ชีต User (เช่น `admin`, `user001`)
- ระบบ login กับ Supabase โดยใช้อีเมลภายใน `{username}@paytrack.crpao.app` (ผู้ใช้ไม่ต้องพิมพ์อีเมล)
- รหัสผ่าน: ตามที่ตั้งตอน migrate — **Supabase ต้องการอย่างน้อย 6 ตัว** (ถ้าเดิมในชีตเป็น 5 ตัว ต้องเพิ่มตอน migrate หรือใน Dashboard)

## ความปลอดภัย

อ่าน [`SECURITY.md`](SECURITY.md)

## ใบอนุญาต

โครงการภายในหน่วยงาน — ใช้และดัดแปลงตามนโยบาย อบจ. เชียงราย
