import {
  AlertTriangle,
  CheckCircle2,
  FileStack,
  Loader2,
} from 'lucide-react';
import { OVERDUE_PROCESSING_DAYS } from '../../constants';

const CHART_SERIES = [
  {
    key: 'total',
    label: 'เรื่องที่รับมาทั้งหมด',
    shortLabel: 'ทั้งหมด',
    barClass: 'bg-primary',
    chipClass: 'bg-primary/10 text-primary',
    icon: FileStack,
  },
  {
    key: 'inProgress',
    label: 'อยู่ระหว่างดำเนินการ',
    shortLabel: 'ดำเนินการ',
    barClass: 'bg-amber-500',
    chipClass: 'bg-amber-50 text-amber-700',
    icon: Loader2,
  },
  {
    key: 'overdue',
    label: 'เกินกำหนดระยะเวลา',
    shortLabel: 'เกินกำหนด',
    barClass: 'bg-red-500',
    chipClass: 'bg-red-50 text-red-600',
    icon: AlertTriangle,
  },
  {
    key: 'completed',
    label: 'เสร็จสิ้น',
    shortLabel: 'เสร็จสิ้น',
    barClass: 'bg-emerald-500',
    chipClass: 'bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
];

function buildDonutGradient(metrics) {
  const total = metrics.total || 0;
  if (total === 0) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)';
  }

  const completed = metrics.completed || 0;
  const overdue = metrics.overdue || 0;
  const inProgressOnTime = Math.max(0, (metrics.inProgress || 0) - overdue);

  const toDeg = (value) => (value / total) * 360;
  let cursor = 0;

  const segments = [
    { value: completed, color: '#10b981' },
    { value: inProgressOnTime, color: '#f59e0b' },
    { value: overdue, color: '#ef4444' },
  ].filter((segment) => segment.value > 0);

  if (segments.length === 0) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)';
  }

  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += toDeg(segment.value);
    return `${segment.color} ${start}deg ${cursor}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

export default function DashboardChartPanel({
  metrics,
  loading,
  scopeDescription = 'เปรียบเทียบจำนวนเรื่องตามสถานะทั้งหมดในระบบ',
}) {
  if (loading) {
    return (
      <section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-md">
        <p className="text-center text-sm text-warm-gray/70">กำลังโหลดกราฟสรุป...</p>
      </section>
    );
  }

  const safeMetrics = metrics || {
    total: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
  };

  const maxBarValue = Math.max(
    safeMetrics.total,
    safeMetrics.inProgress,
    safeMetrics.overdue,
    safeMetrics.completed,
    1,
  );

  const donutStyle = { background: buildDonutGradient(safeMetrics) };

  return (
    <section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">กราฟสรุปสถานะเรื่องเบิกจ่าย</h3>
          <p className="text-sm text-warm-gray/70">{scopeDescription}</p>
        </div>
        <p className="text-xs text-warm-gray/60 sm:text-right">
          เกินกำหนด = เรื่องที่ยังไม่เสร็จ และเกิน {OVERDUE_PROCESSING_DAYS} วัน
          <br />
          (นับจากวันรับเรื่อง — ฟิลด์วันที่ในตาราง)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="mx-auto flex flex-col items-center gap-3">
          <div
            className="relative flex h-44 w-44 items-center justify-center rounded-full shadow-inner"
            style={donutStyle}
            aria-hidden
          >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white/95 text-center shadow-sm">
              <span className="text-xs text-warm-gray/70">ทั้งหมด</span>
              <span className="text-3xl font-bold text-primary">
                {safeMetrics.total}
              </span>
              <span className="text-xs text-warm-gray/60">เรื่อง</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              เสร็จสิ้น
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              ดำเนินการ
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              เกินกำหนด
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CHART_SERIES.map(
            ({ key, label, shortLabel, barClass, chipClass, icon: Icon }) => {
              const value = safeMetrics[key] ?? 0;
              const height = `${Math.max(8, (value / maxBarValue) * 100)}%`;
              const percent =
                safeMetrics.total > 0
                  ? Math.round((value / safeMetrics.total) * 100)
                  : 0;

              return (
                <div
                  key={key}
                  className="flex flex-col rounded-xl border border-gray-100 bg-white/80 p-3"
                >
                  <div
                    className={`mb-2 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${chipClass}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {shortLabel}
                  </div>
                  <div className="mb-2 flex h-32 items-end justify-center rounded-lg bg-gray-50 px-3 pb-2">
                    <div
                      className={`w-full max-w-12 rounded-t-lg ${barClass} transition-all duration-500`}
                      style={{ height }}
                      title={`${label}: ${value}`}
                    />
                  </div>
                  <p className="text-center text-2xl font-bold text-warm-gray">
                    {value}
                  </p>
                  <p className="text-center text-xs text-warm-gray/70">{label}</p>
                  {key !== 'total' && (
                    <p className="mt-1 text-center text-xs text-warm-gray/50">
                      {percent}% ของทั้งหมด
                    </p>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
