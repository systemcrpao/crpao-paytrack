# crpao-paytrack

ระบบบริหารจัดการเรื่องเบิกจ่าย (ฎีกา) — Frontend React + Backend **Supabase**

Repository: [systemcrpao/crpao-paytrack](https://github.com/systemcrpao/crpao-paytrack)

## เทคโนโลยี

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, React Router, Zustand
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deploy เว็บ:** GitHub Pages

## ฟีเจอร์หลัก

- เข้าสู่ระบบตาม role: Admin, Manager, User
- Dashboard: ค้นหา, กรองปีงบประมาณ, สถานะ, รายละเอียดเรื่อง
- ภาพรวมระบบ (`/overview`): สรุปและกราฟ
- ปีงบประมาณจาก **วันรับเรื่อง**: 1 ต.ค. – 30 ก.ย.
- Cache bootstrap ในเบราว์เซอร์ (sessionStorage)

## เริ่มต้น (พัฒนาในเครื่อง)

```bash
npm install
cp .env.example .env.local
```

แก้ `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

ตั้งฐานข้อมูลและโอนข้อมูลจากชีตเดิม: ดู [`supabase/README.md`](supabase/README.md)

```bash
npm run dev
```

เปิด `http://localhost:5173`

## Deploy บน GitHub Pages

URL: `https://systemcrpao.github.io/crpao-paytrack/`

1. Repo → **Settings → Secrets → Actions**  
   - `VITE_SUPABASE_URL`  
   - `VITE_SUPABASE_ANON_KEY`
2. **Settings → Pages** → Source: **GitHub Actions**
3. Push ไป `main`

## โครงสร้างโปรเจกต์

```
src/
  services/api.js       เรียก Supabase
  services/supabaseClient.js
  store/                auth + cache ข้อมูลฎีกา
supabase/
  migrations/           SQL สร้างตาราง
  README.md             โอนข้อมูลจาก Sheets
scripts/
  migrate-from-gas.mjs
  migrate-from-csv.mjs
```

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | พัฒนา local |
| `npm run build` | build ไป `dist/` |
| `npm run migrate:from-gas` | โอนข้อมูลจาก GAS → Supabase |
| `npm run migrate:from-csv` | โอนจาก CSV ใน `scripts/sheet-export/` |

## ความปลอดภัย

อ่าน [`SECURITY.md`](SECURITY.md)
