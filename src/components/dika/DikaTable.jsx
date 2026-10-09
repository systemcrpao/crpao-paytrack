import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS } from '../../constants';
import { formatCurrency, formatDate, formatDikaNo } from '../../utils/workflow';
import ProcessingDurationDisplay from './ProcessingDurationDisplay';
import { getUserDisplayName } from '../../utils/apiHelpers';
import StatusBadge from './StatusBadge';
import DikaRowActions from './DikaRowActions';

const PAGE_SIZE_OPTIONS = [
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'ทั้งหมด', value: 'all' },
];

export default function DikaTable({
  items,
  userRole,
  users = [],
  onAcknowledge,
  onStatusEdit,
  onEditItem,
  onViewDetail,
  loading,
  emptyMessage = 'ไม่พบข้อมูลเรื่องเบิกจ่าย',
}) {
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items, pageSize]);

  const totalItems = items.length;
  const totalPages =
    pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return items;

    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1;
  const rangeEnd =
    pageSize === 'all'
      ? totalItems
      : Math.min(currentPage * pageSize, totalItems);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/70 p-12 text-center backdrop-blur-md">
        <p className="text-warm-gray/70">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/70 p-12 text-center backdrop-blur-md">
        <p className="text-warm-gray/70">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-350 text-sm">
          <thead className="text-center">
            <tr className="border-b border-gray-100 bg-primary/5">
              <th className="px-4 py-3 font-semibold text-primary">เลขที่รับเรื่อง</th>
              <th className="px-4 py-3 font-semibold text-primary">วันที่</th>
              <th className="min-w-56 px-4 py-3 font-semibold text-primary">เรื่อง</th>
              <th className="px-4 py-3 font-semibold text-primary">จำนวนเงิน</th>
              <th className="px-4 py-3 font-semibold text-primary">ผู้รับเงิน</th>
              <th className="px-4 py-3 font-semibold text-primary">หน่วยงาน</th>
              <th className="px-4 py-3 font-semibold text-primary">ผู้รับผิดชอบ</th>
              <th className="px-4 py-3 font-semibold text-primary">สถานะ</th>
              <th className="min-w-36 px-4 py-3 font-semibold text-primary">ระยะเวลาดำเนินการ</th>
              <th className="px-4 py-3 font-semibold text-primary">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => {
              const isCancelled = item.status === STATUS.CANCELLED;
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 transition hover:bg-gray-50/50 ${
                    isCancelled
                      ? 'bg-red-50/80 text-gray-400 line-through decoration-gray-400'
                      : ''
                  }`}
                >
                  <td className={`px-4 py-3 text-center ${isCancelled ? '' : 'font-medium'}`}>
                    {formatDikaNo(item.dikaNo) || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">{formatDate(item.date)}</td>
                  <td
                    className="min-w-56 max-w-80 px-4 py-3 text-left wrap-break-word"
                    title={item.subject}
                  >
                    {item.subject}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-left">{item.payee}</td>
                  <td className="px-4 py-3 text-left">{item.department}</td>
                  <td className="px-4 py-3 text-left">
                    {getUserDisplayName(item.assignee, users)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="min-w-36 px-4 py-3 text-center text-xs sm:text-sm">
                    <ProcessingDurationDisplay
                      timestamp={item.timestamp}
                      finishtime={item.finishtime}
                    />
                  </td>
                  <td className="px-4 py-3 text-center no-underline">
                    <div className="flex justify-center">
                      <DikaRowActions
                        item={item}
                        userRole={userRole}
                        onAcknowledge={onAcknowledge}
                        onStatusEdit={onStatusEdit}
                        onEditItem={onEditItem}
                        onViewDetail={onViewDetail}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-warm-gray">
          <span>แสดง</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const value = e.target.value;
              setPageSize(value === 'all' ? 'all' : Number(value));
            }}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-warm-gray outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span>รายการ</span>
          <span className="text-warm-gray/70">
            ({rangeStart}-{rangeEnd} จาก {totalItems} รายการ)
          </span>
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-warm-gray transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              ก่อนหน้า
            </button>
            <span className="min-w-20 text-center text-sm text-warm-gray">
              หน้า {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-warm-gray transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
