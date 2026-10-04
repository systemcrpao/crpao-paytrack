# crpao-paytrack

ระบบบริหารจัดการเรื่องเบิกจ่าย (ฎีกา) — Frontend React + Backend Google Apps Script / Google Sheets

Repository: [systemcrpao/crpao-paytrack](https://github.com/systemcrpao/crpao-paytrack)

## เทคโนโลยี

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, React Router, Zustand
- **Backend:** Google Apps Script (Web App) + Google Sheets
- **Deploy เว็บ:** GitHub Pages (workflow ใน `.github/workflows/deploy-pages.yml`)

## ฟีเจอร์หลัก

- เข้าสู่ระบบตาม role: Admin, Manager, User
- Dashboard: ค้นหา, กรองปีงบประมาณ, สถานะ, รายละเอียดเรื่อง
- ภาพรวมระบบ (`/overview`): สรุปและกราฟ
- ปีงบประมาณจาก **วันรับเรื่อง**: 1 ต.ค. – 30 ก.ย. (เช่น 1 ต.ค. 2569 – 30 ก.ย. 2570 = ปีงบ 2570)
- Cache bootstrap 60 วินาที (`getBootstrap` จาก GAS)

## เริ่มต้น (พัฒนาในเครื่อง)

```bash
npm install
cp .env.example .env.local
```

แก้ `.env.local`:

```env
VITE_GAS_URL=https://script.google.com/macros/s/XXXX/exec
```

```bash
npm run dev
```

เปิด `http://localhost:5173`

## Backend (Google Apps Script)

ดูคู่มือละเอียดที่ [`GAS/README.md`](GAS/README.md) และโค้ดอ้างอิง [`GAS/gas.md`](GAS/gas.md)

## Deploy บน GitHub Pages

URL หลัง deploy (เมื่อเปิด Pages แล้ว):

`https://systemcrpao.github.io/crpao-paytrack/`

### ขั้นตอนที่ต้องทำบน GitHub (ครั้งแรก)

1. **Push โค้ด** ไป branch `main` (ดูด้านล่าง)
2. Repo → **Settings → Secrets and variables → Actions**  
   สร้าง secret ชื่อ **`VITE_GAS_URL`** = URL Web App GAS (`.../exec`)
3. **Settings → Pages**  
   - Source: **GitHub Actions** (ไม่ใช่ Deploy from branch)
4. Push หรือรัน workflow **Deploy GitHub Pages** จากแท็บ Actions

Workflow จะ build ด้วย `VITE_BASE_PATH=/crpao-paytrack/` และ copy `404.html` สำหรับ client-side routing

### ทดสอบ build แบบเดียวกับ Pages (ในเครื่อง)

PowerShell:

```powershell
$env:VITE_GAS_URL="https://script.google.com/macros/s/XXXX/exec"
$env:VITE_BASE_PATH="/crpao-paytrack/"
npm run build
npm run preview
```

## โครงสร้างโปรเจกต์

```
src/
  pages/          หน้า Login, Dashboard, Overview
  services/api.js เรียก GAS (อ่าน VITE_GAS_URL)
  store/          auth + cache ข้อมูลฎีกา
  utils/workflow.js ปีงบประมาณ, สถานะ, ค้นหา
GAS/
  gas.md          โค้ดอ้างอิงสำหรับ Code.gs
  README.md       วิธี deploy GAS
```

## ความปลอดภัย

อ่าน [`SECURITY.md`](SECURITY.md) — ห้าม commit URL GAS, Spreadsheet ID, หรือรหัสผ่าน  
ค่าจริงใช้ `.env.local` และ GitHub Secret `VITE_GAS_URL` เท่านั้น

## Push ขึ้น GitHub (ครั้งแรก)

รันในโฟลเดอร์โปรเจกต์ (ต้องมี [Git](https://git-scm.com/) และ login GitHub):

```powershell
git init -b main
git add .
git status
# ตรวจว่าไม่มี .env.local, node_modules, dist
git commit -m "Initial commit: crpao-paytrack"
git remote add origin https://github.com/systemcrpao/crpao-paytrack.git
git push -u origin main
```

ถ้า remote มีอยู่แล้ว ใช้ `git remote set-url origin ...` แทน `add`

Authentication: Personal Access Token หรือ GitHub CLI (`gh auth login`)

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | พัฒนา local |
| `npm run build` | build ไป `dist/` |
| `npm run preview` | ดูผล build |

## ใบอนุญาต

โครงการภายในหน่วยงาน — ใช้และดัดแปลงตามนโยบาย อบจ. เชียงราย
