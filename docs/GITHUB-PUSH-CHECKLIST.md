# ก่อน push ขึ้น GitHub

ใช้ checklist นี้ทุกครั้งก่อน `git push` เพื่อไม่ให้ข้อมูลสำคัญหลุดขึ้น repo สาธารณะ

## ห้าม commit / ห้ามเปิดเผยบน repo

| รายการ | เก็บที่ไหน |
|--------|------------|
| `.env.local` | เครื่อง dev (`.gitignore`: `.env.*`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` เท่านั้น — **ไม่** ใส่ใน workflow |
| `scripts/sheet-export/*.csv` | มีรหัสผ่าน (`.gitignore`) |
| Spreadsheet ID / GAS URL เก่า | ไม่ใช้แล้ว — อย่าใส่ใน source |

## GitHub Actions Secrets (สำหรับ deploy Pages)

| Secret | ใช้ใน workflow |
|--------|----------------|
| `VITE_SUPABASE_URL` | ใช่ |
| `VITE_SUPABASE_ANON_KEY` | ใช่ |
| `SUPABASE_SERVICE_ROLE_KEY` | **ไม่** — ลบจาก GitHub ได้หลัง migrate |
| `VITE_GAS_URL` | **ไม่** — ลบได้ |

## ตรวจก่อน commit / push

```powershell
git status
git diff --cached --name-only
```

ต้อง **ไม่เห็น**:

- `.env.local`
- `scripts/sheet-export/User.csv` หรือ `Data.csv`

`public/config.json` ใน repo ควรเป็น template ว่าง:

```json
{
  "supabaseUrl": "",
  "supabaseAnonKey": ""
}
```

CI จะเติมค่าจาก Secrets ตอน build — **อย่า** commit ไฟล์ที่ใส่ key จริงแล้ว

## Push และตรวจหลัง deploy

```powershell
git push origin main
```

1. **Actions** → **Deploy GitHub Pages** → สถานะเขียว  
2. เปิด https://systemcrpao.github.io/crpao-paytrack/config.json — ต้องมี URL และ anon key  
3. ทดสอบ login ที่ `/login`

## เอกสารที่เกี่ยวข้อง

- [`README.md`](../README.md) — ภาพรวมระบบ  
- [`SECURITY.md`](../SECURITY.md) — นโยบายความปลอดภัย  
- [`supabase/README.md`](../supabase/README.md) — DB + migrate
