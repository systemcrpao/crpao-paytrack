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
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USER_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][0]).trim() === String(username).trim() &&
      String(data[i][1]).trim() === String(password).trim()
    ) {
      return {
        success: true,
        user: {
          username: data[i][0],
          name: data[i][2],
          role: data[i][3],
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
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { success: true, data: [] };
  }

  data.shift(); // Remove header

  const formattedData = data.map((row) => ({
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

  return { success: true, data: formattedData };
}

function getBootstrapData() {
  const dikaResult = getDikaData();
  const usersResult = getUsers();

  return {
    success: true,
    data: dikaResult.data || [],
    users: usersResult.data || [],
  };
}

// 3. สร้าง ID อัตโนมัติ
function generateAutoId(sheet) {
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return 'DK-0001';
  }

  const lastId = data[data.length - 1][0];

  if (!lastId || !String(lastId).startsWith('DK-')) {
    return 'DK-0001';
  }

  const num = parseInt(String(lastId).replace('DK-', ''), 10) + 1;
  return 'DK-' + num.toString().padStart(4, '0');
}

// 4. เพิ่มข้อมูลฎีกา
function addDika(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET);
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

  return { success: true, message: 'บันทึกสำเร็จ', id: newId };
}

// 5. อัปเดตสถานะ
function updateStatus(id, newStatus) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  const statusValue = normalizeStatusValue(newStatus);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const row = i + 1;
      sheet.getRange(row, 9).setValue(statusValue); // Column I (Status)

      if (isCompletedStatus(statusValue)) {
        const finishCell = sheet.getRange(row, 11); // Column K (finishtime)
        if (!String(finishCell.getValue() || '').trim()) {
          finishCell.setValue(formatSheetDateTime(new Date()));
        }
      }

      return { success: true, message: 'อัปเดตสถานะสำเร็จ' };
    }
  }

  return { success: false, message: 'ไม่พบข้อมูล' };
}

// 6. แก้ไขข้อมูลทั่วไป
function updateDika(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET);
  const data = sheet.getDataRange().getValues();
  const id = payload.id;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const row = i + 1;

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

      return { success: true, message: 'แก้ไขข้อมูลสำเร็จ' };
    }
  }

  return { success: false, message: 'ไม่พบข้อมูล' };
}

// 7. ดึงรายชื่อผู้ใช้ทั้งหมด (ไม่รวม password)
function getUsers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USER_SHEET);
  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const username = String(data[i][0] || '').trim();
    const name = String(data[i][2] || '').trim();
    const role = String(data[i][3] || '').trim();

    if (!username) {
      continue;
    }

    users.push({
      username: username,
      name: name || username,
      role: role,
    });
  }

  return { success: true, data: users };
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
