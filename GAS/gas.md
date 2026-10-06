<!--
  คู่มือติดตั้ง GAS: GAS/README.md
  คัดลอกเนื้อหาด้านล่างทั้งหมดไปวางใน Code.gs แล้วแก้ SPREADSHEET_ID บน Google เท่านั้น
-->

// คัดลอก ID จาก URL ชีต (ไม่ commit ค่าจริงใน Git — ใส่ใน Apps Script บน Google เท่านั้น)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const DATA_SHEET = 'Data';
const USER_SHEET = 'User';

// คอลัมน์ชีต Data: A=id, B=dikaNo, C=date, D=subject, E=amount, F=payee,
// G=department, H=assignee, I=status, J=timestamp, K=finishtime, L=notes
const COMPLETED_STATUSES = ['อนุมัติแล้ว', 'ยกเลิก'];
const BOOTSTRAP_CACHE_KEY = 'bootstrap_payload_v1';
const BOOTSTRAP_CACHE_SEC = 60;

function getSpreadsheet\_() {
return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function clearBootstrapCache\_() {
try {
CacheService.getScriptCache().remove(BOOTSTRAP_CACHE_KEY);
} catch (e) {
// ignore
}
}

function readSheetValues\_(sheet, lastColumn) {
const lastRow = sheet.getLastRow();
if (lastRow <= 1) {
return [];
}

return sheet.getRange(2, 1, lastRow, lastColumn).getValues();
}

function mapDikaRows\_(rows) {
return rows.map((row) => ({
id: String(row[0] || ''),
dikaNo: String(row[1] || ''),
date: formatCellDate(row[2]),
subject: String(row[3] || ''),
amount: row[4],
payee: String(row[5] || ''),
department: String(row[6] || ''),
assignee: String(row[7] || ''),
status: normalizeStatusValue(row[8]),
timestamp: formatCellText(row[9]),
finishtime: formatCellText(row[10]),
notes: String(row[11] || ''),
}));
}

function mapUserRows\_(rows) {
const users = [];

for (let i = 0; i < rows.length; i++) {
const username = String(rows[i][0] || '').trim();
const name = String(rows[i][2] || '').trim();
const role = String(rows[i][3] || '').trim();

    if (!username) {
      continue;
    }

    users.push({
      username: username,
      name: name || username,
      role: role,
    });

}

return users;
}

function formatSheetDateTime(date) {
return Utilities.formatDate(
date,
Session.getScriptTimeZone() || 'Asia/Bangkok',
'dd/MM/yyyy HH:mm',
);
}

function normalizeStatusValue(status) {
const normalized = String(status || '').trim();
if (normalized === 'อนุมัตแล้ว') return 'อนุมัติแล้ว';
return normalized;
}

function isCompletedStatus(status) {
const normalized = normalizeStatusValue(status);
return COMPLETED_STATUSES.indexOf(normalized) >= 0;
}

// จัดการ Request แบบ GET (ดึงข้อมูล)
function doGet(e) {
const action = e.parameter.action;
let result = {};

try {
if (action === 'getDika') {
result = getDikaData();
} else if (action === 'getBootstrap') {
result = getBootstrapData();
} else if (action === 'getUsers' || action === 'getAssignees') {
result = getUsers();
} else {
result = { success: false, message: 'Invalid action' };
}
} catch (err) {
result = { success: false, message: err.message };
}

return ContentService
.createTextOutput(JSON.stringify(result))
.setMimeType(ContentService.MimeType.JSON);
}

// จัดการ Request แบบ POST (เพิ่ม/แก้ไข/ล็อกอิน)
// แนะนำให้ React ส่งข้อมูลเป็น text/plain (JSON.stringify) เพื่อเลี่ยงปัญหา CORS Preflight
function doPost(e) {
let result = {};

try {
const body = JSON.parse(e.postData.contents);
const action = body.action;
const payload = body.payload;

    if (action === 'login') {
      result = authenticateUser(payload.username, payload.password);
    } else if (action === 'addDika') {
      result = addDika(payload);
    } else if (action === 'updateDika') {
      result = updateDika(payload);
    } else if (action === 'updateStatus' || action === 'updateDikaStatus') {
      result = updateStatus(payload.id, payload.status);
    } else {
      result = { success: false, message: 'Invalid action' };
    }

} catch (err) {
result = { success: false, message: err.message };
}

return ContentService
.createTextOutput(JSON.stringify(result))
.setMimeType(ContentService.MimeType.JSON);
}

// ตรวจสอบ role แบบไม่สนตัวพิมพ์เล็ก-ใหญ่
function isUserRole(role) {
return String(role || '').trim().toLowerCase() === 'user';
}

// 1. ฟังก์ชันเข้าสู่ระบบ
function authenticateUser(username, password) {
const sheet = getSpreadsheet*().getSheetByName(USER_SHEET);
const rows = readSheetValues*(sheet, 4);

for (let i = 0; i < rows.length; i++) {
if (
String(rows[i][0]).trim() === String(username).trim() &&
String(rows[i][1]).trim() === String(password).trim()
) {
return {
success: true,
user: {
username: rows[i][0],
name: rows[i][2],
role: rows[i][3],
},
};
}
}

return { success: false, message: 'Username หรือ Password ไม่ถูกต้อง' };
}

function formatCellText(value) {
if (value === null || value === undefined || value === '') return '';

if (value instanceof Date) {
return Utilities.formatDate(
value,
Session.getScriptTimeZone() || 'Asia/Bangkok',
'dd/MM/yyyy HH:mm',
);
}

return String(value);
}

function formatCellDate(value) {
if (value instanceof Date) {
return Utilities.formatDate(
value,
Session.getScriptTimeZone() || 'Asia/Bangkok',
'dd/MM/yyyy',
);
}

return String(value || '');
}

// 2. ดึงข้อมูลฎีกาทั้งหมด
function getDikaData() {
const sheet = getSpreadsheet*().getSheetByName(DATA_SHEET);
return { success: true, data: mapDikaRows*(readSheetValues\_(sheet, 12)) };
}

function getBootstrapData() {
const cache = CacheService.getScriptCache();
const cached = cache.get(BOOTSTRAP_CACHE_KEY);

if (cached) {
return JSON.parse(cached);
}

const ss = getSpreadsheet*();
const payload = {
success: true,
data: mapDikaRows*(readSheetValues*(ss.getSheetByName(DATA_SHEET), 12)),
users: mapUserRows*(readSheetValues\_(ss.getSheetByName(USER_SHEET), 4)),
};

cache.put(BOOTSTRAP_CACHE_KEY, JSON.stringify(payload), BOOTSTRAP_CACHE_SEC);
return payload;
}

// 3. สร้าง ID อัตโนมัติ
function generateAutoId(sheet) {
const lastRow = sheet.getLastRow();

if (lastRow <= 1) {
return 'DK-0001';
}

const lastId = sheet.getRange(lastRow, 1).getValue();

if (!lastId || !String(lastId).startsWith('DK-')) {
return 'DK-0001';
}

const num = parseInt(String(lastId).replace('DK-', ''), 10) + 1;
return 'DK-' + num.toString().padStart(4, '0');
}

// 4. เพิ่มข้อมูลฎีกา
function addDika(data) {
const sheet = getSpreadsheet\_().getSheetByName(DATA_SHEET);
const newId = generateAutoId(sheet);
const defaultStatus = data.status || 'ส่งต่อเจ้าหน้าที่';

const createdAt = formatSheetDateTime(new Date());

sheet.appendRow([
newId,
data.dikaNo,
data.date,
data.subject,
data.amount,
data.payee,
data.department,
data.assignee,
defaultStatus,
createdAt,
'',
data.notes || '',
]);

clearBootstrapCache\_();
return { success: true, message: 'บันทึกสำเร็จ', id: newId };
}

// 5. อัปเดตสถานะ
function updateStatus(id, newStatus) {
const sheet = getSpreadsheet*().getSheetByName(DATA_SHEET);
const data = readSheetValues*(sheet, 12);
const statusValue = normalizeStatusValue(newStatus);

for (let i = 0; i < data.length; i++) {
if (String(data[i][0]) === String(id)) {
const row = i + 2;
sheet.getRange(row, 9).setValue(statusValue); // Column I (Status)

      if (isCompletedStatus(statusValue)) {
        const finishCell = sheet.getRange(row, 11); // Column K (finishtime)
        if (!String(finishCell.getValue() || '').trim()) {
          finishCell.setValue(formatSheetDateTime(new Date()));
        }
      }

      clearBootstrapCache_();
      return { success: true, message: 'อัปเดตสถานะสำเร็จ' };
    }

}

return { success: false, message: 'ไม่พบข้อมูล' };
}

// 6. แก้ไขข้อมูลทั่วไป
function updateDika(payload) {
const sheet = getSpreadsheet*().getSheetByName(DATA_SHEET);
const data = readSheetValues*(sheet, 12);
const id = payload.id;

for (let i = 0; i < data.length; i++) {
if (String(data[i][0]) === String(id)) {
const row = i + 2;

      if (payload.dikaNo !== undefined) sheet.getRange(row, 2).setValue(payload.dikaNo);
      if (payload.date !== undefined) sheet.getRange(row, 3).setValue(payload.date);
      if (payload.subject !== undefined) sheet.getRange(row, 4).setValue(payload.subject);
      if (payload.amount !== undefined) sheet.getRange(row, 5).setValue(payload.amount);
      if (payload.payee !== undefined) sheet.getRange(row, 6).setValue(payload.payee);
      if (payload.department !== undefined) sheet.getRange(row, 7).setValue(payload.department);
      if (payload.assignee !== undefined) sheet.getRange(row, 8).setValue(payload.assignee);
      if (payload.status !== undefined) {
        const statusValue = normalizeStatusValue(payload.status);
        sheet.getRange(row, 9).setValue(statusValue);

        if (isCompletedStatus(statusValue)) {
          const finishCell = sheet.getRange(row, 11);
          if (!String(finishCell.getValue() || '').trim()) {
            finishCell.setValue(formatSheetDateTime(new Date()));
          }
        }
      }
      if (payload.notes !== undefined) sheet.getRange(row, 12).setValue(payload.notes);

      clearBootstrapCache_();
      return { success: true, message: 'แก้ไขข้อมูลสำเร็จ' };
    }

}

return { success: false, message: 'ไม่พบข้อมูล' };
}

// 7. ดึงรายชื่อผู้ใช้ทั้งหมด (ไม่รวม password)
function getUsers() {
const sheet = getSpreadsheet*().getSheetByName(USER_SHEET);
return { success: true, data: mapUserRows*(readSheetValues\_(sheet, 4)) };
}

// 8. ดึงเฉพาะผู้รับผิดชอบ (role = User)
function getAssignees() {
const result = getUsers();

if (!result.success) {
return result;
}

return {
success: true,
data: result.data.filter((user) => isUserRole(user.role)),
};
}
