# ความปลอดภัย (crpao-paytrack)

เอกสารนี้อธิบายข้อจำกัดของสถาปัตยกรรมปัจจุบันและสิ่งที่ **ห้าม** เปิดเผยใน GitHub

## สิ่งที่ไม่ควรอยู่ใน Repository

| รายการ | ที่เก็บที่ถูกต้อง |
|--------|-------------------|
| URL Web App GAS (`/exec`) | `.env.local` (เครื่อง dev) และ GitHub **Repository secret** `VITE_GAS_URL` |
| Google Spreadsheet ID | เฉพาะใน Apps Script บน Google (หรือ `GAS/gas.private.md` ในเครื่อง) |
| รหัผ่านผู้ใช้ | ชีต `User` บน Google — **ไม่** เก็บใน repo |

ไฟล์ `.env.local`, `.env`, และ `GAS/gas.private.md` ถูก `.gitignore` แล้ว

## ข้อจำกัดสำคัญ

1. **Web App แบบ Anyone** — ใครที่มี URL GAS สามารถเรียก API ได้ (อ่าน/เขียนตามที่สคริปต์อนุญาต)  
   URL จะถูกฝังใน bundle ของเว็บที่ deploy แล้ว ดังนั้น **อย่า** ถือว่า URL เป็นความลับจากผู้ใช้ทั่วไป — จำกัดสิทธิ์ที่ชีต Google และพิจารณาใช้ Google Workspace / การตรวจสอบเพิ่มเติมใน GAS หากต้องการความปลอดภัยสูงขึ้น

2. **รหัผ่านในชีต** — ระบบ login เปรียบเทียบรหัสผ่านแบบ plain text ในชีต ไม่เหมาะกับข้อมูลที่มีความอ่อนไหสูง ควรใช้รหัสผ่านเฉพาะระบบนี้ และจำกัดการแชร์ชีต

3. **GitHub Pages เป็น static site** — ไม่มี server-side session; สถานะ login เก็บใน `localStorage` ของเบราว์เซอร์ (ออกจากระบบเมื่อกด logout เท่านั้น — login ได้หลายเครื่องพร้อมกัน)

4. **Repository สาธารณะ** — โค้ด frontend ทั้งหมดอ่านได้ อย่าใส่ API key, token, หรือข้อมูลส่วนตัวใน source

## หากเคย commit URL หรือ Spreadsheet ID แล้ว

1. เปลี่ยน / จำกัดการแชร์ Google Sheet ตามนโยบายหน่วยงาน  
2. สร้าง **deployment ใหม่** ของ Web App GAS (ได้ URL ใหม่) แล้วอัปเดต `VITE_GAS_URL`  
3. พิจารณา `git filter-repo` หรือลบไฟล์จากประวัติ Git หาก repo สาธารณะแล้ว — GitHub มีคู่มือ [Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## แนวทางที่แนะนำเพิ่มเติม (ไม่ได้ implement ใน repo)

- จำกัดสิทธิ์ชีตเฉพาะบัญชีที่จำเป็น  
- ตรวจสอบ action ใน GAS ด้วย token/session หลัง login แทนการเปิด write ให้ทุก action  
- ใช้ Google OAuth หรือบัญชี Workspace หากนโยบายหน่วยงานกำหนด
