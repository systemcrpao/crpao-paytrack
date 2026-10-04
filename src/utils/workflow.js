import {
  ROLES,
  STAFF_ACK_STATUSES,
  MANAGER_ACK_STATUSES,
  STAFF_MANAGE_STATUSES,
  MANAGER_MANAGE_STATUSES,
  MANAGER_VISIBLE_STATUSES,
  STATUS,
  COMPLETED_STATUSES,
  OVERDUE_PROCESSING_DAYS,
} from '../constants';
import { getUserDisplayName, isItemAssignedToUser, isRole } from './apiHelpers';

export function normalizeStatus(status) {
  return String(status || '').trim();
}

export function normalizeStatusLabel(status) {
  const trimmed = normalizeStatus(status);
  if (trimmed === 'อนุมัตแล้ว') return STATUS.APPROVED;
  return trimmed;
}

export function isStatus(status, expected) {
  return normalizeStatus(normalizeStatusLabel(status)) === normalizeStatus(expected);
}

export function filterDikaByRole(items, user, users = []) {
  if (!user) return [];

  if (isRole(user.role, ROLES.USER)) {
    return items.filter((item) => isItemAssignedToUser(item, user, users));
  }

  if (isRole(user.role, ROLES.MANAGER)) {
    return items.filter((item) =>
      MANAGER_VISIBLE_STATUSES.some((status) => isStatus(item.status, status)),
    );
  }

  return items;
}

export function searchDikaItems(items, query, users = []) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const assigneeName = getUserDisplayName(item.assignee, users);
    const searchableText = [
      item.dikaNo,
      item.date,
      item.subject,
      item.payee,
      item.department,
      item.assignee,
      assigneeName,
      item.status,
      item.notes,
      item.amount,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

function parseBangkokDatePartsFromMs(ms) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));

  const [ceYear, month, day] = formatted.split('-').map(Number);
  return { year: ceYear + 543, month, day };
}

function parseItemDateParts(dateStr) {
  if (!dateStr) return null;

  const trimmed = String(dateStr).trim();

  // รูปแบบไทย dd/MM/yyyy (จากชีต) — ต้องมาก่อน new Date() เพื่อไม่ให้สลับเดือน/วัน
  const thaiDateMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );

  if (thaiDateMatch) {
    const day = Number(thaiDateMatch[1]);
    const month = Number(thaiDateMatch[2]);
    let year = Number(thaiDateMatch[3]);

    if (year < 2400) year += 543;

    if (
      Number.isNaN(day) ||
      Number.isNaN(month) ||
      Number.isNaN(year) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    return { year, month, day };
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [ceYear, month, day] = trimmed.split('T')[0].split('-').map(Number);
    if (
      Number.isNaN(ceYear) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12
    ) {
      return null;
    }
    return { year: ceYear + 543, month, day };
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return parseBangkokDatePartsFromMs(direct.getTime());
  }

  return null;
}

function parseItemDate(dateStr) {
  const parts = parseItemDateParts(dateStr);
  if (!parts) return 0;

  const { year, month, day } = parts;
  const ceYear = year - 543;
  const parsed = new Date(ceYear, month - 1, day).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** 1 ต.ค. 2568 – 30 ก.ย. 2569 = ปีงบ 2569 | 1 ต.ค. 2569 – 30 ก.ย. 2570 = ปีงบ 2570 */
export function getFiscalYearFromDate(dateStr) {
  const parts = parseItemDateParts(dateStr);
  if (!parts) return null;

  const { year, month } = parts;
  return month >= 10 ? year + 1 : year;
}

export function getCurrentFiscalYear() {
  const { year, month } = parseBangkokDatePartsFromMs(Date.now());
  return month >= 10 ? year + 1 : year;
}

export function extractFiscalYears(items) {
  const years = new Set([getCurrentFiscalYear()]);

  items.forEach((item) => {
    const fiscalYear = getFiscalYearFromDate(item.date);
    if (fiscalYear) years.add(fiscalYear);
  });

  return Array.from(years).sort((a, b) => b - a);
}

export function filterDikaByFiscalYear(items, fiscalYear) {
  if (!fiscalYear || fiscalYear === 'all') return items;

  const targetYear = Number(fiscalYear);
  return items.filter(
    (item) => getFiscalYearFromDate(item.date) === targetYear,
  );
}

export function sortDikaByDateDesc(items) {
  return [...items].sort(
    (a, b) => parseItemDate(b.date) - parseItemDate(a.date),
  );
}

export function canStaffAcknowledge(status) {
  return STAFF_ACK_STATUSES.some((item) => isStatus(status, item));
}

export function canManagerAcknowledge(status) {
  return MANAGER_ACK_STATUSES.some((item) => isStatus(status, item));
}

export function canStaffManage(status) {
  return STAFF_MANAGE_STATUSES.some((item) => isStatus(status, item));
}

export function canManagerManage(status) {
  return MANAGER_MANAGE_STATUSES.some((item) => isStatus(status, item));
}

export function getAckTargetStatus(role) {
  if (isRole(role, ROLES.USER)) return STATUS.REVIEW;
  if (isRole(role, ROLES.MANAGER)) return STATUS.PENDING_APPROVAL;
  return null;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function parseDateTimeToMs(dateStr) {
  if (!dateStr) return null;

  const trimmed = String(dateStr).trim();
  const thaiDateTimeMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );

  if (thaiDateTimeMatch) {
    const day = Number(thaiDateTimeMatch[1]);
    const month = Number(thaiDateTimeMatch[2]);
    let year = Number(thaiDateTimeMatch[3]);
    const hours = Number(thaiDateTimeMatch[4] || 0);
    const minutes = Number(thaiDateTimeMatch[5] || 0);

    if (year > 2400) year -= 543;

    const parsed = new Date(year, month - 1, day, hours, minutes).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const isoParsed = new Date(trimmed).getTime();
    if (!Number.isNaN(isoParsed)) return isoParsed;
  }

  const direct = new Date(trimmed).getTime();
  if (!Number.isNaN(direct)) return direct;

  const [datePart, timePart = '00:00'] = trimmed.split(/\s+/);
  const parts = datePart.split(/[/-]/);

  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  let year = Number(parts[2]);

  if (year > 2400) year -= 543;

  const [hours = 0, minutes = 0] = timePart.split(':').map(Number);
  const parsed = new Date(year, month - 1, day, hours, minutes).getTime();

  return Number.isNaN(parsed) ? null : parsed;
}

function getBangkokDateKey(ms) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
  }).format(new Date(ms));
}

function calendarDaysBetweenBangkok(startMs, endMs) {
  const startKey = getBangkokDateKey(startMs);
  const endKey = getBangkokDateKey(endMs);
  const startDate = Date.parse(`${startKey}T00:00:00Z`);
  const endDate = Date.parse(`${endKey}T00:00:00Z`);

  return Math.max(0, Math.round((endDate - startDate) / 86400000));
}

export function formatDateTimeDisplay(dateStr) {
  if (!dateStr) return '-';

  const ms = parseDateTimeToMs(dateStr);
  if (!ms) return dateStr;

  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(ms));
}

export function getProcessingDurationParts(timestamp, finishTime) {
  const start = parseDateTimeToMs(timestamp);
  if (!start) return null;

  const end = finishTime ? parseDateTimeToMs(finishTime) : Date.now();
  if (!end || end < start) return null;

  return {
    days: calendarDaysBetweenBangkok(start, end),
    ongoing: !finishTime,
  };
}

export function formatProcessingDuration(timestamp, finishTime) {
  const parts = getProcessingDurationParts(timestamp, finishTime);
  if (!parts) return '-';

  if (parts.ongoing) {
    return `${parts.days} วัน\n(ยังดำเนินการ)`;
  }

  return `${parts.days} วัน`;
}

export function isCompletedDikaItem(item) {
  return COMPLETED_STATUSES.some((status) => isStatus(item.status, status));
}

function getReceiveDateMs(item) {
  const receiveDate = parseDateTimeToMs(item.date);
  if (receiveDate) return receiveDate;

  return parseDateTimeToMs(item.timestamp);
}

export function isOverdueDikaItem(
  item,
  overdueDays = OVERDUE_PROCESSING_DAYS,
) {
  if (isCompletedDikaItem(item)) return false;

  const receiveMs = getReceiveDateMs(item);
  if (!receiveMs) return false;

  const elapsedDays = calendarDaysBetweenBangkok(receiveMs, Date.now());
  return elapsedDays > overdueDays;
}

export function computeDashboardChartMetrics(items) {
  const total = items.length;
  const completed = items.filter(isCompletedDikaItem).length;
  const inProgress = items.filter((item) => !isCompletedDikaItem(item)).length;
  const overdue = items.filter((item) => isOverdueDikaItem(item)).length;

  return {
    total,
    inProgress,
    overdue,
    completed,
  };
}

export function computeDashboardMetrics(items, role) {
  const countByStatus = (status) =>
    items.filter((item) => isStatus(item.status, status)).length;

  const total = items.length;
  const completed = countByStatus(STATUS.APPROVED);
  const cancelled = countByStatus(STATUS.CANCELLED);

  if (isRole(role, ROLES.ADMIN)) {
    const inProgressStatuses = [
      STATUS.REVIEW,
      STATUS.RETURNED,
      STATUS.PROPOSE,
      STATUS.PENDING_APPROVAL,
    ];
    const staffProcessing = items.filter((item) =>
      inProgressStatuses.some((status) => isStatus(item.status, status)),
    ).length;

    return {
      total,
      forwardToStaff: countByStatus(STATUS.FORWARD_TO_STAFF),
      staffProcessing,
      completed,
      cancelled,
    };
  }

  if (isRole(role, ROLES.USER)) {
    return {
      total,
      waitingAck: countByStatus(STATUS.FORWARD_TO_STAFF),
      inProgress: countByStatus(STATUS.REVIEW),
      propose: countByStatus(STATUS.PROPOSE),
      returned: countByStatus(STATUS.RETURNED),
      completed,
      cancelled,
    };
  }

  if (isRole(role, ROLES.MANAGER)) {
    return {
      total,
      inProgress: countByStatus(STATUS.PROPOSE),
      pendingApproval: countByStatus(STATUS.PENDING_APPROVAL),
      completed,
      cancelled,
    };
  }

  return { total, completed, cancelled };
}

export function computeSystemOverviewMetrics(items) {
  const countByStatus = (status) =>
    items.filter((item) => isStatus(item.status, status)).length;

  const forwardToStaff = countByStatus(STATUS.FORWARD_TO_STAFF);
  const returned = countByStatus(STATUS.RETURNED);
  const review = countByStatus(STATUS.REVIEW);
  const propose = countByStatus(STATUS.PROPOSE);
  const pendingApproval = countByStatus(STATUS.PENDING_APPROVAL);
  const approved = countByStatus(STATUS.APPROVED);
  const cancelled = countByStatus(STATUS.CANCELLED);
  const waitingAck = forwardToStaff + returned;

  return {
    total: items.length,
    adminForwarded: forwardToStaff,
    staff: {
      total: waitingAck + review + propose + cancelled,
      waitingAck,
      forwardToStaff,
      returned,
      inProgress: review,
      propose,
      cancelled,
    },
    manager: {
      total: propose + pendingApproval + approved,
      waitingAck: propose,
      pendingApproval,
      approved,
    },
    approved,
    cancelled,
  };
}
