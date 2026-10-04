import {
  FileStack,
  Send,
  Users,
  Briefcase,
  Inbox,
  Loader2,
  RotateCcw,
  Clock,
  CheckCircle2,
  Ban,
} from 'lucide-react';

function MetricCard({ label, subtitle, value, icon: Icon, color, bg, large = false }) {
  return (
    <div
      className={`rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md transition hover:shadow-md ${
        large ? 'p-6' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle && (
            <p className="text-xs font-medium text-primary/80 sm:text-sm">{subtitle}</p>
          )}
          <p
            className={`font-medium text-warm-gray/70 ${
              large ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            } ${subtitle ? 'mt-0.5' : ''}`}
          >
            {label}
          </p>
          <p
            className={`mt-1 font-bold text-warm-gray ${
              large ? 'text-4xl' : 'text-2xl'
            }`}
          >
            {value ?? 0}
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl ${bg} ${
            large ? 'h-14 w-14' : 'h-10 w-10'
          }`}
        >
          <Icon className={`${large ? 'h-7 w-7' : 'h-5 w-5'} ${color}`} />
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ title, subtitle, total, icon: Icon, iconColor, iconBg, children }) {
  return (
    <section className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="text-sm text-warm-gray/70">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-xl bg-primary/10 px-4 py-2 text-center sm:text-right">
          <p className="text-xs text-warm-gray/70">รวมทั้งหมด</p>
          <p className="text-2xl font-bold text-primary">{total ?? 0}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default function SystemOverview({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          label="เรื่องทั้งหมดในระบบ"
          value={metrics.total}
          icon={FileStack}
          color="text-primary"
          bg="bg-primary/10"
          large
        />
        <MetricCard
          subtitle="เจ้าหน้าที่ธุรการ"
          label="ส่งต่อเจ้าหน้าที่"
          value={metrics.adminForwarded}
          icon={Send}
          color="text-sky-600"
          bg="bg-sky-50"
          large
        />
      </div>

      <SectionBlock
        title="เจ้าหน้าที่ (ผู้รับผิดชอบ)"
        subtitle="สถานะเรื่องที่อยู่ในขั้นตอนของเจ้าหน้าที่"
        total={metrics.staff?.total}
        icon={Users}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      >
        <MetricCard
          label="รอรับเรื่อง"
          value={metrics.staff?.waitingAck}
          icon={Inbox}
          color="text-sky-600"
          bg="bg-sky-50"
        />
        <MetricCard
          label="ส่งคืน/แก้ไข"
          value={metrics.staff?.returned}
          icon={RotateCcw}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <MetricCard
          label="กำลังดำเนินการ"
          value={metrics.staff?.inProgress}
          icon={Loader2}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <MetricCard
          label="เสนอ/ส่งต่อ"
          value={metrics.staff?.propose}
          icon={Send}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <MetricCard
          label="ยกเลิก"
          value={metrics.staff?.cancelled}
          icon={Ban}
          color="text-red-500"
          bg="bg-red-50"
        />
      </SectionBlock>

      <SectionBlock
        title="ผู้บริหารกอง"
        subtitle="สถานะเรื่องที่อยู่ในขั้นตอนของผู้บริหาร"
        total={metrics.manager?.total}
        icon={Briefcase}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      >
        <MetricCard
          label="รอรับเรื่อง"
          value={metrics.manager?.waitingAck}
          icon={Inbox}
          color="text-sky-600"
          bg="bg-sky-50"
        />
        <MetricCard
          label="รออนุมัติ"
          value={metrics.manager?.pendingApproval}
          icon={Clock}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <MetricCard
          label="อนุมัติแล้ว"
          value={metrics.manager?.approved}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
      </SectionBlock>
    </div>
  );
}
