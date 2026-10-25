import { STATUS } from '../constants';

export const TABLE_STATUS_FILTER_KEY = 'crpao_table_status_filter_v1';

/** ลำดับสถานะในเช็คลิส (ตามขั้นตอนงาน) */
export const TABLE_STATUS_OPTIONS = [
  STATUS.FORWARD_TO_STAFF,
  STATUS.REVIEW,
  STATUS.RETURNED,
  STATUS.PROPOSE,
  STATUS.PENDING_APPROVAL,
  STATUS.APPROVED,
  STATUS.CANCELLED,
];

export function defaultStatusFilterSelection() {
  return [...TABLE_STATUS_OPTIONS];
}

export function loadStatusFilterSelection() {
  try {
    const raw = localStorage.getItem(TABLE_STATUS_FILTER_KEY);
    if (!raw) return defaultStatusFilterSelection();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultStatusFilterSelection();

    const allowed = new Set(TABLE_STATUS_OPTIONS);
    const selected = parsed.filter((status) => allowed.has(status));

    if (parsed.length === 0) return [];
    return selected.length > 0 ? selected : defaultStatusFilterSelection();
  } catch {
    return defaultStatusFilterSelection();
  }
}

export function saveStatusFilterSelection(selected) {
  const allowed = new Set(TABLE_STATUS_OPTIONS);
  const normalized = TABLE_STATUS_OPTIONS.filter((status) =>
    selected.includes(status),
  );

  const payload = normalized.length > 0 ? normalized : [];

  localStorage.setItem(TABLE_STATUS_FILTER_KEY, JSON.stringify(payload));
  return payload;
}

export const TABLE_COLUMNS_KEY = 'crpao_table_columns_v1';

/** คอลัมน์ที่ปรับแสดง/ซ่อนได้ (ไม่รวม «จัดการ») */
export const TABLE_COLUMN_DEFINITIONS = [
  { id: 'dikaNo', label: 'เลขที่รับเรื่อง' },
  { id: 'date', label: 'วันที่' },
  { id: 'subject', label: 'เรื่อง' },
  { id: 'amount', label: 'จำนวนเงิน' },
  { id: 'payee', label: 'ผู้รับเงิน' },
  { id: 'department', label: 'หน่วยงาน' },
  { id: 'assignee', label: 'ผู้รับผิดชอบ' },
  { id: 'status', label: 'สถานะ' },
  { id: 'duration', label: 'ระยะเวลาดำเนินการ' },
];

export const TABLE_LOCKED_COLUMN_IDS = ['actions'];

export function defaultColumnVisibility() {
  return TABLE_COLUMN_DEFINITIONS.map((column) => column.id);
}

export function loadColumnVisibility() {
  try {
    const raw = localStorage.getItem(TABLE_COLUMNS_KEY);
    if (!raw) return defaultColumnVisibility();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultColumnVisibility();

    const allowed = new Set(TABLE_COLUMN_DEFINITIONS.map((column) => column.id));
    const selected = parsed.filter((id) => allowed.has(id));

    return selected.length > 0 ? selected : defaultColumnVisibility();
  } catch {
    return defaultColumnVisibility();
  }
}

export function saveColumnVisibility(selected) {
  const normalized = TABLE_COLUMN_DEFINITIONS.map((column) => column.id).filter(
    (id) => selected.includes(id),
  );

  const payload =
    normalized.length > 0 ? normalized : defaultColumnVisibility();

  localStorage.setItem(TABLE_COLUMNS_KEY, JSON.stringify(payload));
  return payload;
}

export function isTableColumnVisible(visibleColumns, columnId) {
  if (TABLE_LOCKED_COLUMN_IDS.includes(columnId)) return true;
  return visibleColumns.includes(columnId);
}
