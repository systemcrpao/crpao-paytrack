import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ROLES, STAFF_STATUS_OPTIONS, MANAGER_STATUS_OPTIONS } from '../../constants';
import {
  formatCurrency,
  formatDate,
  formatDateTimeDisplay,
} from '../../utils/workflow';
import ProcessingDurationDisplay from './ProcessingDurationDisplay';
import { getUserDisplayName, isRole } from '../../utils/apiHelpers';

export default function DikaStatusForm({
  open,
  onClose,
  item,
  users = [],
  userRole,
  onSubmit,
}) {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setStatus(item.status || '');
      setError('');
    }
  }, [item]);

  if (!open || !item) return null;

  const baseStatusOptions = isRole(userRole, ROLES.MANAGER)
    ? MANAGER_STATUS_OPTIONS
    : STAFF_STATUS_OPTIONS;

  const currentStatus = item.status || '';
  const statusOptions = baseStatusOptions.includes(currentStatus)
    ? baseStatusOptions
    : [currentStatus, ...baseStatusOptions];

  const readOnlyClass =
    'w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed';

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm text-warm-gray outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onSubmit(item.id, status);
      onClose();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/60 bg-cream/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">จัดการเรื่องเบิกจ่าย</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-warm-gray hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">เลขที่รับเรื่อง</label>
            <input value={item.dikaNo || ''} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">วันที่</label>
            <input value={formatDate(item.date)} readOnly className={readOnlyClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-warm-gray">เรื่อง</label>
            <input value={item.subject || ''} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">จำนวนเงิน (บาท)</label>
            <input value={formatCurrency(item.amount)} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">ผู้รับเงิน</label>
            <input value={item.payee || ''} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">หน่วยงาน</label>
            <input value={item.department || ''} readOnly className={readOnlyClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">ผู้รับผิดชอบ</label>
            <input
              value={getUserDisplayName(item.assignee, users)}
              readOnly
              className={readOnlyClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">สถานะ</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className={inputClass}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
              value={item.notes || ''}
              readOnly
              rows={3}
              className={readOnlyClass}
            />
          </div>

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-warm-gray hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-primary disabled:opacity-60"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
