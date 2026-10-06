# ก่อน push ขึ้น GitHub

## ห้าม commit / ห้องเปิดเผยบน repo สาธารณะ

| รายการ | เก็บที่ไหน |
|--------|------------|
| `.env.local` | เครื่อง dev เท่านั้น (ถูก `.gitignore`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` เท่านั้น — **ไม่** ใส่ใน workflow, **ไม่** commit |
| `scripts/sheet-export/*.csv` | มีรหัสผ่านผู้ใช้ (ถูก `.gitignore`) |
| Spreadsheet ID / GAS URL เก่า | ไม่จำเป็นแล้ว — อย่าใส่ในโค้ด |

## GitHub Actions Secrets (ใช้ตอน build Pages)

| Secret | ใช้ได้ |
|--------|--------|
| `VITE_SUPABASE_URL` | ใช่ |
| `VITE_SUPABASE_ANON_KEY` | ใช่ (anon public — ฝังในเว็บได้ตามดีไซน์ Supabase + RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **ไม่จำเป็น** สำหรับ deploy — ลบออกจาก GitHub Secrets ได้ถ้า migrate เสร็จแล้ว |

## ตรวจก่อน push

```powershell
git status
git diff --cached --name-only
```

ต้อง **ไม่เห็น** `.env.local`, ไฟล์ `.csv` ใน `sheet-export`

`public/config.json` ใน repo ควรว่าง (`supabaseUrl` / `supabaseAnonKey` เป็น `""`) — CI จะเขียนค่าจาก Secrets ตอน build

## Push

```powershell
git push origin main
```

จากนั้นดู Actions → Deploy GitHub Pages จนเขียว
