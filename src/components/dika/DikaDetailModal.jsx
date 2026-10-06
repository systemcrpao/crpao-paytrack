import { X } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTimeDisplay,
  formatDikaNo,
} from '../../utils/workflow';
import ProcessingDurationDisplay from './ProcessingDurationDisplay';
import { getUserDisplayName } from '../../utils/apiHelpers';
import StatusBadge from './StatusBadge';

const readOnlyClass =
  'w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed';

export default function DikaDetailModal({ open, onClose, item, users = [] }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/60 bg-cream/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">รายละเอียดเรื่องเบิกจ่าย</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-warm-gray hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              เลขที่รับเรื่อง
            </label>
            <input value={formatDikaNo(item.dikaNo) || '-'} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">วันที่</label>
            <input value={formatDate(item.date)} readOnly className={readOnlyClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-warm-gray">เรื่อง</label>
            <input value={item.subject || '-'} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              จำนวนเงิน (บาท)
            </label>
            <input value={formatCurrency(item.amount)} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">ผู้รับเงิน</label>
            <input value={item.payee || '-'} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">หน่วยงาน</label>
            <input value={item.department || '-'} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              ผู้รับผิดชอบ
            </label>
            <input
              value={getUserDisplayName(item.assignee, users)}
              readOnly
              className={readOnlyClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">สถานะ</label>
            <div className="flex min-h-10 items-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-2">
              <StatusBadge status={item.status} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              วันเวลาที่ลงข้อมูล
            </label>
            <input
              value={formatDateTimeDisplay(item.timestamp)}
              readOnly
              className={readOnlyClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              วันเวลาที่เสร็จสิ้น
            </label>
            <input
              value={formatDateTimeDisplay(item.finishtime)}
              readOnly
              className={readOnlyClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              ระยะเวลาดำเนินการ
            </label>
            <div className={`${readOnlyClass} whitespace-pre-line`}>
              <ProcessingDurationDisplay
                timestamp={item.timestamp}
                finishtime={item.finishtime}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-warm-gray">หมายเหตุ</label>
            <textarea
              value={item.notes || '-'}
              readOnly
              rows={3}
              className={readOnlyClass}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-warm-gray hover:bg-gray-50"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
