import {
  FileStack,
  Clock,
  CheckCircle2,
  Loader2,
  Ban,
  Send,
  Inbox,
  RotateCcw,
} from 'lucide-react';
import { ROLES } from '../../constants';
import { isRole } from '../../utils/apiHelpers';

const ADMIN_CARDS = [
  { key: 'total', label: 'เรื่องทั้งหมด', icon: FileStack, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'forwardToStaff', label: 'ส่งต่อเจ้าหน้าที่', icon: Send, color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'staffProcessing', label: 'อยู่ระหว่างดำเนินการ', icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'completed', label: 'อนุมัติแล้ว', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'cancelled', label: 'ยกเลิก', icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
];

const USER_CARDS = [
  { key: 'total', label: 'เรื่องทั้งหมด', icon: FileStack, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'waitingAck', label: 'รอรับเรื่อง', icon: Inbox, color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'inProgress', label: 'กำลังดำเนินการ', icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'propose', label: 'เสนอ/ส่ง', icon: Send, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'returned', label: 'ส่งคืน/แก้ไข', icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'completed', label: 'อนุมัติแล้ว', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'cancelled', label: 'ยกเลิก', icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
];

const MANAGER_CARDS = [
  { key: 'total', label: 'เรื่องทั้งหมด', icon: FileStack, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'inProgress', label: 'รอรับเรื่อง', icon: Inbox, color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'pendingApproval', label: 'รออนุมัติ', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'completed', label: 'อนุมัติแล้ว', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'cancelled', label: 'ยกเลิก', icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
];

function getCardsByRole(userRole) {
  if (isRole(userRole, ROLES.ADMIN)) return ADMIN_CARDS;
  if (isRole(userRole, ROLES.USER)) return USER_CARDS;
  if (isRole(userRole, ROLES.MANAGER)) return MANAGER_CARDS;
  return ADMIN_CARDS;
}

function getGridClass(userRole) {
  if (isRole(userRole, ROLES.USER)) {
    return 'mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7';
  }
  return 'mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5';
}

export default function SummaryDashboard({ metrics, userRole }) {
  const cards = getCardsByRole(userRole);

  return (
    <section className={getGridClass(userRole)}>
      {cards.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-warm-gray/70 sm:text-sm">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-warm-gray">
                {metrics[key] ?? 0}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
