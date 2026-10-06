# ความปลอดภัย (crpao-paytrack)

## สิ่งที่ไม่ควรอยู่ใน Repository

| รายการ | ที่เก็บที่ถูกต้อง |
|--------|-------------------|
| Supabase **anon** key | `.env.local`, GitHub Secret `VITE_SUPABASE_ANON_KEY`, `public/config.json` (generate ตอน CI) |
| Supabase **service_role** key | `.env.local` เท่านั้น — ใช้สคริปต์ migrate |
| รหัผ่านผู้ใช้ | Supabase Auth (ไม่เก็บ plain text ใน DB) |

ไฟล์ `.env.local` ถูก `.gitignore` แล้ว

## ข้อจำกัดสำคัญ

1. **anon key ใน static site** — ฝังใน bundle/Pages ได้ตามดีไซน์ Supabase แต่ต้องพึ่ง **Row Level Security** บนตาราง (มีใน migration)
2. **service_role** — มีสิทธิ์เต็ม ห้ามใส่ใน frontend หรือ GitHub Secrets ที่ build ฝังลงเว็บ
3. **GitHub Pages** — session จาก Supabase Auth ในเบราว์เซอร์; zustand เก็บ profile สำหรับ UI
4. **Repository สาธารณะ** — อย่า commit service_role, รหัสผ่าน, หรือ export CSV ที่มีรหัสผ่าน

## หากเคย commit secret แล้ว

1. Rotate keys ใน Supabase Dashboard  
2. อัปเดต Secrets และ `.env.local`  
3. พิจารณาลบ secret จากประวัติ Git ตาม [GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
