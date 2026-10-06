# Google Apps Script (Backend)

Backend ของ **crpao-paytrack** ใช้ Google Sheets + Apps Script เป็น Web App  
โค้ดอ้างอิงอยู่ใน [`gas.md`](./gas.md) — **คัดลอกเนื้อหาทั้งไฟล์** ไปวางใน `Code.gs` (แทนที่ของเดิมทั้งหมด) แล้วแก้ `SPREADSHEET_ID` เท่านั้น

## ก่อน Deploy

1. สร้าง Google Spreadsheet มีชีต **`Data`** และ **`User`**
2. ใน `gas.md` แทนที่ `YOUR_SPREADSHEET_ID` ด้วย ID จาก URL ชีต  
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
3. **อย่า commit Spreadsheet ID จริงลง GitHub** — แก้เฉพาะในโปรเจกต์ Apps Script บน Google  
   (ถ้าต้องการเก็บสำเนาในเครื่อง ใช้ `GAS/gas.private.md` ซึ่งถูก `.gitignore` แล้ว)

### โครงคอลัมน์ชีต Data

| คอลัมน์ | ฟิลด์ |
|--------|--------|
| A | id |
| B | dikaNo |
| C | date (วันรับเรื่อง) |
| D | subject |
| E | amount |
| F | payee |
| G | department |
| H | assignee |
| I | status |
| J | timestamp |
| K | finishtime |
| L | notes |

### ชีต User

| คอลัมน์ | ฟิลด์ |
|--------|--------|
| A | username |
| B | password |
| C | name |
| D | role (`Admin` / `Manager` / `User`) |

## Deploy Web App

1. ใน Apps Script: **Deploy → New deployment → Web app**
2. Execute as: **Me**
3. Who has access: **Anyone** (จำเป็นสำหรับเรียกจากเบราว์เซอร์ / GitHub Pages)
4. คัดลอก URL ที่ลงท้ายด้วย `/exec` ไปใส่ใน `VITE_GAS_URL` (ดู README หลัก)

หลังแก้โค้ด GAS ต้อง **Deploy → Manage deployments → Edit → New version** แล้วบันทึก

### ประสิทธิภาพ

- `getBootstrap` เปิด Spreadsheet **ครั้งเดียว** แล้วอ่านชีต Data + User
- ใช้ `getLastRow()` แทน `getDataRange()` เพื่อไม่ดึงแถวว่างจำนวนมาก
- Cache ฝั่ง GAS ~60 วินาที (ล้างอัตโนมัติเมื่อเพิ่ม/แก้ไขข้อมูล)
- ฝั่งเว็บ cache ใน memory + `sessionStorage` และเรียก API ซ้ำพร้อมกันไม่ได้ (dedupe)

## API ที่ Frontend เรียก

| วิธี | action | หมายเหตุ |
|------|--------|----------|
| POST | `getBootstrap` | โหลดฎีกา + ผู้ใช้ในคำขอเดียว (แนะนำ) |
| POST | `getDika` | ฎีกาทั้งหมด |
| POST | `getUsers` | รายชื่อผู้ใช้ (ไม่ส่ง password) |
| POST | `login` | ตรวจ username/password |
| POST | `addDika` | เพิ่มเรื่อง |
| POST | `updateDika` | แก้ไข |
| POST | `updateStatus` | เปลี่ยนสถานะ |

**ทุก action ใช้ POST** (body JSON ผ่าน `Content-Type: text/plain`) — อย่าใช้ GET กับ `getDika`/`getBootstrap` เพราะ JSON ใหญ่มัก 404 ที่ `googleusercontent.com`

## ปีงบประมาณ (ฝั่ง Frontend)

Frontend กรองตาม **วันรับเรื่อง (คอลัมน์ C)** โดย:

- 1 ต.ค. 2568 – 30 ก.ย. 2569 → ปีงบ **2569**
- 1 ต.ค. 2569 – 30 ก.ย. 2570 → ปีงบ **2570**

วันที่จากชีตควรเป็นรูปแบบ `dd/MM/yyyy` (พ.ศ.) ตามที่ GAS format
