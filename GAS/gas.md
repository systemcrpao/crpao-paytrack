/**
 * crpao-paytrack — Google Apps Script (Code.gs)
 * คู่มือ: GAS/README.md
 * 1) แทนที่ YOUR_SPREADSHEET_ID
 * 2) คัดลอกทั้งไฟล์ไป Code.gs
 * 3) Deploy Web app → Me → Anyone → URL /exec
 *
 * หมายเหตุ: คำตอบ JSON ใหญ่จาก Web App มัก redirect แล้ว 404 — Frontend โหลดด้วย getDikaChunk / getUsersChunk
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const DATA_SHEET = 'Data';
const USER_SHEET = 'User';

const COMPLETED_STATUSES = ['อนุมัติแล้ว', 'ยกเลิก'];
const BOOTSTRAP_CACHE_KEY = 'bootstrap_payload_v1';
const BOOTSTRAP_CACHE_SEC = 120;
const DEFAULT_DIKA_CHUNK = 15;
const DEFAULT_USER_CHUNK = 10;

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function clearBootstrapCache_() {
  try {
    CacheService.getScriptCache().remove(BOOTSTRAP_CACHE_KEY);
  } catch (err) {
    // ignore
  }
}

function readSheetValues_(sheet, lastColumn) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  return sheet.getRange(2, 1, lastRow, lastColumn).getValues();
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
  if (normalized === 'อนุมัตแล้ว') {
    return 'อนุมัติแล้ว';
  }
  return normalized;
}

function isCompletedStatus(status) {
  return COMPLETED_STATUSES.indexOf(normalizeStatusValue(status)) >= 0;
}

function isUserRole(role) {
  return String(role || '').trim().toLowerCase() === 'user';
}

function formatCellText(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
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

  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]) + 543;
    return isoMatch[3] + '/' + isoMatch[2] + '/' + year;
  }

  return text;
}

function mapDikaRows_(rows) {
  return rows.map(function (row) {
    return {
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
    };
  });
}

function mapUserRows_(rows) {
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

function jsonResponse_(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function runAction_(action, payload) {
  if (action === 'getBootstrap') {
    return getBootstrapData();
  }
  if (action === 'getDikaChunk') {
    return getDikaChunkData(payload);
  }
  if (action === 'getUsersChunk') {
    return getUsersChunkData(payload);
  }
  if (action === 'getDika') {
    return getDikaData();
  }
  if (action === 'getUsers') {
    return getUsers();
  }
  if (action === 'getAssignees') {
    return getAssignees();
  }
  if (action === 'login') {
    return authenticateUser(payload.username, payload.password);
  }
  if (action === 'addDika') {
    return addDika(payload);
  }
  if (action === 'updateDika') {
    return updateDika(payload);
  }
  if (action === 'updateStatus' || action === 'updateDikaStatus') {
    return updateStatus(payload.id, payload.status);
  }

  return { success: false, message: 'Invalid action' };
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  var result = { success: true, message: 'Use POST with JSON body { action, payload }' };

  if (action === 'getUsers') {
    try {
      result = getUsers();
    } catch (err) {
      result = { success: false, message: err.message };
    }
  }

  return jsonResponse_(result);
}

function doPost(e) {
  var result = {};

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('ไม่มีข้อมูล request');
    }

    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload || {};

    result = runAction_(action, payload);
  } catch (err) {
    result = { success: false, message: err.message };
  }

  return jsonResponse_(result);
}

function authenticateUser(username, password) {
  var sheet = getSpreadsheet_().getSheetByName(USER_SHEET);
  var rows = readSheetValues_(sheet, 4);
  var normalizedUsername = String(username || '').trim();
  var normalizedPassword = String(password || '').trim();

  for (var i = 0; i < rows.length; i++) {
    if (
      String(rows[i][0]).trim() === normalizedUsername &&
      String(rows[i][1]).trim() === normalizedPassword
    ) {
      return {
        success: true,
        user: {
          username: String(rows[i][0]).trim(),
          name: String(rows[i][2] || rows[i][0]).trim(),
          role: String(rows[i][3] || '').trim(),
        },
      };
    }
  }

  return { success: false, message: 'Username หรือ Password ไม่ถูกต้อง' };
}

function getDikaData() {
  var sheet = getSpreadsheet_().getSheetByName(DATA_SHEET);
  return {
    success: true,
    data: mapDikaRows_(readSheetValues_(sheet, 12)),
  };
}

function getDikaChunkData(payload) {
  var offset = Math.max(0, Number(payload && payload.offset) || 0);
  var limit = Math.min(
    50,
    Math.max(1, Number(payload && payload.limit) || DEFAULT_DIKA_CHUNK),
  );
  var sheet = getSpreadsheet_().getSheetByName(DATA_SHEET);
  var lastRow = sheet.getLastRow();
  var total = lastRow > 1 ? lastRow - 1 : 0;

  if (total === 0) {
    return { success: true, data: [], total: 0, offset: offset, limit: limit };
  }

  var startRow = 2 + offset;
  if (startRow > lastRow) {
    return { success: true, data: [], total: total, offset: offset, limit: limit };
  }

  var endRow = Math.min(lastRow, startRow + limit - 1);
  var rows = sheet.getRange(startRow, 1, endRow, 12).getValues();

  return {
    success: true,
    data: mapDikaRows_(rows),
    total: total,
    offset: offset,
    limit: limit,
  };
}

function getUsersChunkData(payload) {
  var offset = Math.max(0, Number(payload && payload.offset) || 0);
  var limit = Math.min(
    50,
    Math.max(1, Number(payload && payload.limit) || DEFAULT_USER_CHUNK),
  );
  var sheet = getSpreadsheet_().getSheetByName(USER_SHEET);
  var mapped = mapUserRows_(readSheetValues_(sheet, 4));
  var total = mapped.length;

  return {
    success: true,
    data: mapped.slice(offset, offset + limit),
    total: total,
    offset: offset,
    limit: limit,
  };
}

function getBootstrapData() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(BOOTSTRAP_CACHE_KEY);

  if (cached) {
    return JSON.parse(cached);
  }

  var ss = getSpreadsheet_();
  var payload = {
    success: true,
    data: mapDikaRows_(readSheetValues_(ss.getSheetByName(DATA_SHEET), 12)),
    users: mapUserRows_(readSheetValues_(ss.getSheetByName(USER_SHEET), 4)),
  };

  cache.put(BOOTSTRAP_CACHE_KEY, JSON.stringify(payload), BOOTSTRAP_CACHE_SEC);
  return payload;
}

function getUsers() {
  var sheet = getSpreadsheet_().getSheetByName(USER_SHEET);
  return {
    success: true,
    data: mapUserRows_(readSheetValues_(sheet, 4)),
  };
}

function getAssignees() {
  var result = getUsers();
  if (!result.success) {
    return result;
  }
  return {
    success: true,
    data: result.data.filter(function (user) {
      return isUserRole(user.role);
    }),
  };
}

function generateAutoId(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return 'DK-0001';
  }

  var lastId = sheet.getRange(lastRow, 1).getValue();
  if (!lastId || String(lastId).indexOf('DK-') !== 0) {
    return 'DK-0001';
  }

  var num = parseInt(String(lastId).replace('DK-', ''), 10) + 1;
  return 'DK-' + num.toString().padStart(4, '0');
}

function addDika(data) {
  var sheet = getSpreadsheet_().getSheetByName(DATA_SHEET);
  var newId = generateAutoId(sheet);
  var defaultStatus = data.status || 'ส่งต่อเจ้าหน้าที่';
  var createdAt = formatSheetDateTime(new Date());

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

  clearBootstrapCache_();
  return { success: true, message: 'บันทึกสำเร็จ', id: newId };
}

function updateStatus(id, newStatus) {
  var sheet = getSpreadsheet_().getSheetByName(DATA_SHEET);
  var data = readSheetValues_(sheet, 12);
  var statusValue = normalizeStatusValue(newStatus);

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var row = i + 2;
      sheet.getRange(row, 9).setValue(statusValue);

      if (isCompletedStatus(statusValue)) {
        var finishCell = sheet.getRange(row, 11);
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

function updateDika(payload) {
  var sheet = getSpreadsheet_().getSheetByName(DATA_SHEET);
  var data = readSheetValues_(sheet, 12);
  var id = payload.id;

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) !== String(id)) {
      continue;
    }

    var row = i + 2;

    if (payload.dikaNo !== undefined) {
      sheet.getRange(row, 2).setValue(payload.dikaNo);
    }
    if (payload.date !== undefined) {
      sheet.getRange(row, 3).setValue(payload.date);
    }
    if (payload.subject !== undefined) {
      sheet.getRange(row, 4).setValue(payload.subject);
    }
    if (payload.amount !== undefined) {
      sheet.getRange(row, 5).setValue(payload.amount);
    }
    if (payload.payee !== undefined) {
      sheet.getRange(row, 6).setValue(payload.payee);
    }
    if (payload.department !== undefined) {
      sheet.getRange(row, 7).setValue(payload.department);
    }
    if (payload.assignee !== undefined) {
      sheet.getRange(row, 8).setValue(payload.assignee);
    }
    if (payload.status !== undefined) {
      var statusValue = normalizeStatusValue(payload.status);
      sheet.getRange(row, 9).setValue(statusValue);

      if (isCompletedStatus(statusValue)) {
        var finishCell = sheet.getRange(row, 11);
        if (!String(finishCell.getValue() || '').trim()) {
          finishCell.setValue(formatSheetDateTime(new Date()));
        }
      }
    }
    if (payload.notes !== undefined) {
      sheet.getRange(row, 12).setValue(payload.notes);
    }

    clearBootstrapCache_();
    return { success: true, message: 'แก้ไขข้อมูลสำเร็จ' };
  }

  return { success: false, message: 'ไม่พบข้อมูล' };
}
