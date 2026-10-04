import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_ADMIN_STATUS, DEPARTMENTS } from '../../constants';

const emptyForm = {
  dikaNo: '',
  date: '',
  subject: '',
  amount: '',
  payee: '',
  department: '',
  assignee: '',
  notes: '',
};

export default function DikaForm({
  open,
  onClose,
  onSubmit,
  initialData = null,
  users = [],
  usersError = '',
}) {
  const isEdit = Boolean(initialData);
  const [form, setForm] = useState(() =>
    initialData
      ? {
          dikaNo: initialData.dikaNo || '',
          date: initialData.date || '',
          subject: initialData.subject || '',
          amount: initialData.amount || '',
          payee: initialData.payee || '',
          department: initialData.department || '',
          assignee: initialData.assignee || '',
          notes: initialData.notes || '',
        }
      : { ...emptyForm },
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        dikaNo: initialData.dikaNo || '',
        date: initialData.date || '',
        subject: initialData.subject || '',
        amount: initialData.amount || '',
        payee: initialData.payee || '',
        department: initialData.department || '',
        assignee: initialData.assignee || '',
        notes: initialData.notes || '',
      });
    } else {
      setForm({ ...emptyForm });
    }

    setError('');
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        ...(isEdit ? {} : { status: DEFAULT_ADMIN_STATUS }),
      };
      await onSubmit(payload, initialData?.id);
      if (!isEdit) {
        setForm({ ...emptyForm });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm text-warm-gray outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  const departmentOptions = DEPARTMENTS.includes(form.department)
    ? DEPARTMENTS
    : form.department
      ? [form.department, ...DEPARTMENTS]
      : DEPARTMENTS;

  const assigneeOptions = Array.isArray(users) ? users : [];
  const hasCurrentAssignee = assigneeOptions.some(
    (user) => user.username === form.assignee,
  );
  const assigneeSelectOptions =
    form.assignee && !hasCurrentAssignee
      ? [
          {
            username: form.assignee,
            name: form.assignee,
          },
          ...assigneeOptions,
        ]
      : assigneeOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/60 bg-cream/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">
            {isEdit ? 'แก้ไขเรื่องเบิกจ่าย' : 'เพิ่มเรื่องเบิกจ่ายใหม่'}
          </h2>
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
            <label className="mb-1 block text-sm font-medium">เลขที่รับเรื่อง</label>
            <input
              name="dikaNo"
              value={form.dikaNo}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">วันที่</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">เรื่อง</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ผู้รับเงิน</label>
            <input
              name="payee"
              value={form.payee}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">หน่วยงาน</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">-- เลือกหน่วยงาน --</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ผู้รับผิดชอบ</label>
            <select
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              required
              disabled={assigneeSelectOptions.length === 0}
              className={inputClass}
            >
              <option value="">-- เลือกผู้รับผิดชอบ --</option>
              {assigneeSelectOptions.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.name} ({user.username})
                </option>
              ))}
            </select>
            {usersError && (
              <p className="mt-1 text-xs text-red-600">{usersError}</p>
            )}
            {!usersError && assigneeSelectOptions.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                ไม่พบผู้รับผิดชอบในระบบ กรุณาตรวจสอบข้อมูลผู้ใช้ role User ใน Google Sheet
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">หมายเหตุ</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className={inputClass}
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
              {submitting ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
