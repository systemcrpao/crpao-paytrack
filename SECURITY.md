# ความปลอดภัย (crpao-paytrack)

เอกสารนี้อธิบายว่าข้อมูลสำคัญเก็บที่ไหน และข้อจำกัดของระบบหลังย้ายมา **Supabase**

## สิ่งที่ห้าม commit / ห้ามเปิดเผยใน repo

| รายการ | ที่เก็บที่ถูกต้อง |
|--------|-------------------|
| Supabase **anon** key | `.env.local`, GitHub Secret `VITE_SUPABASE_ANON_KEY`; บน Pages อยู่ใน bundle และ `config.json` หลัง build |
| Supabase **service_role** key | `.env.local` เท่านั้น — สคริปต์ `migrate:*` |
| รหัผ่านผู้ใช้ | Supabase Auth (hash) — ไม่เก็บ plain text ใน Postgres |
| Export CSV ชีต User | `scripts/sheet-export/*.csv` (ถูก `.gitignore`) |

ไฟล์ที่ ignore แล้ว: `.env.local`, `.env.*` (ยกเว้น `.env.example`), `scripts/sheet-export/*.csv`, `public/config.local.json`

## ค่าที่ฝังในเว็บ static (GitHub Pages)

- `VITE_SUPABASE_URL` และ **anon key** ถูก embed ใน JavaScript หลัง build — **ถือว่าเป็นสาธารณะต่อผู้ใช้เว็บ**
- การป้องกันหลัก: **Row Level Security (RLS)** บนตาราง `dika` และ `profiles` — ต้อง **login** (JWT ของ Supabase) ก่อนอ่าน/เขียน
- **service_role** มีสิทธิ์ bypass RLS — **ห้าม** ใส่ใน frontend, workflow build, หรือ GitHub Secrets ที่ถูก inject ลง artifact

## การยืนยันตัวตนและ session

1. Login ผ่าน Supabase Auth (`signInWithPassword`)
2. Session/token เก็บโดย Supabase client ในเบราว์เซอร์
3. Zustand (`authStore`) เก็บ `username`, `name`, `role` ใน `localStorage` สำหรับ UI — ออกจากระบบเมื่อกด logout หรือ session หมดอายุ
4. สามารถ login หลายเครื่องพร้อมกันได้

## ข้อจำกัด / สิ่งที่ควรรู้

1. **RLS ปัจจุบัน** — ผู้ใช้ที่ login แล้วสามารถ SELECT/INSERT/UPDATE `dika` ได้ (สอดคล้องกับ Web App GAS แบบ Anyone เดิม) — การจำกัดตาม Admin/Manager/User ยังทำที่ **frontend** (`workflow.js`, หน้า Dashboard)
2. **anon key รั่ว** — ถ้ามีคนดึง anon key จากเว็บ ยังต้องมีบัญชีและรหัสผ่านที่ถูกต้องจึงจะเรียก API ได้ (ภายใต้ RLS)
3. **`.env.local`** — ห้ามใส่คอมเมนต์ `# ...` ต่อท้าย JWT บนบรรทัดเดียวกัน (เคยทำให้ migrate/login ล้มเหลว)
4. **Repository สาธารณะ** — โค้ด frontend อ่านได้ทั้งหมด อย่าใส่ service_role หรือ CSV รหัสผ่าน

## GitHub Actions Secrets ที่แนะนำ

| Secret | จำเป็นสำหรับ Pages |
|--------|---------------------|
| `VITE_SUPABASE_URL` | ใช่ |
| `VITE_SUPABASE_ANON_KEY` | ใช่ |
| `SUPABASE_SERVICE_ROLE_KEY` | **ไม่** (ลบออกจาก GitHub ได้หลัง migrate เสร็จ) |
| `VITE_GAS_URL` (เก่า) | **ไม่** — ลบได้ |

## หาก secret รั่วหรือ commit ผิด

1. Supabase Dashboard → **Settings → API** → หมุน (rotate) keys  
2. อัปเดต `.env.local` และ GitHub Secrets  
3. Redeploy GitHub Pages (push หรือ re-run workflow)  
4. ถ้า commit ขึ้น repo สาธารณะแล้ว พิจารณา [ลบข้อมูลอ่อนไหจากประวัติ Git](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## แนวทางเสริม (ยังไม่ implement)

- จำกัด INSERT/UPDATE บน `dika` ตาม `profiles.role` ใน RLS  
- นโยบายรหัสผ่าน / เปลี่ยนรหัสผ่านในแอป  
- Audit log การแก้ไขเรื่อง
