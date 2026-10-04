export const ROLES = {
  ADMIN: 'Admin',
  USER: 'User',
  MANAGER: 'Manager',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'เจ้าหน้าที่ธุรการ',
  [ROLES.USER]: 'ผู้รับผิดชอบ',
  [ROLES.MANAGER]: 'ผู้บริหารกอง',
};

export const STATUS = {
  FORWARD_TO_STAFF: 'ส่งต่อเจ้าหน้าที่',
  REVIEW: 'ตรวจสอบและดำเนินการ',
  PROPOSE: 'เสนอ/ส่งต่อ',
  PENDING_APPROVAL: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  RETURNED: 'ส่งคืน/แก้ไข',
  CANCELLED: 'ยกเลิก',
};

export const DEFAULT_ADMIN_STATUS = STATUS.FORWARD_TO_STAFF;

export const STAFF_ACK_STATUSES = [STATUS.FORWARD_TO_STAFF, STATUS.RETURNED];
export const MANAGER_ACK_STATUSES = [STATUS.PROPOSE];

export const STAFF_MANAGE_STATUSES = [STATUS.REVIEW];
export const MANAGER_MANAGE_STATUSES = [STATUS.PENDING_APPROVAL];

export const STAFF_STATUS_OPTIONS = [
  STATUS.PROPOSE,
  STATUS.RETURNED,
  STATUS.CANCELLED,
];

export const MANAGER_STATUS_OPTIONS = [STATUS.APPROVED, STATUS.RETURNED];

export const MANAGER_VISIBLE_STATUSES = [
  STATUS.PROPOSE,
  STATUS.PENDING_APPROVAL,
  STATUS.APPROVED,
];

export const COMPLETED_STATUSES = [STATUS.APPROVED, STATUS.CANCELLED];

/** จำนวนวันที่ถือว่าเรื่องเกินกำหนด (นับจากวันรับเรื่อง — ฟิลด์ date) */
export const OVERDUE_PROCESSING_DAYS = 15;

export const PENDING_APPROVAL_STATUSES = [
  STATUS.PROPOSE,
  STATUS.PENDING_APPROVAL,
];

export const DEPARTMENTS = [
  'สำนักปลัด อบจ.',
  'สำนักงานเลขานุการ อบจ.',
  'สำนักช่าง',
  'สำนักการศึกษา ศาสนา และวัฒนธรรม',
  'กองคลัง',
  'กองยุทธศาสตร์และงบประมาณ',
  'กองการเจ้าหน้าที่',
  'กองสวัสดิการสังคม',
  'กองสาธารณสุข',
  'กองท่องเที่ยวและกีฬา',
  'กองป้องกันและบรรเทาสาธารณภัย',
  'หน่วยตรวจสอบภายใน',
];
