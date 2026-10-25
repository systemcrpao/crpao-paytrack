import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import {
  saveColumnVisibility,
  TABLE_COLUMN_DEFINITIONS,
} from '../../utils/tableDisplayPrefs';

export default function DikaTableColumnSettings({ visibleColumns, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const toggleColumn = (columnId) => {
    if (visibleColumns.includes(columnId)) {
      if (visibleColumns.length === 1) return;
      onChange(saveColumnVisibility(visibleColumns.filter((id) => id !== columnId)));
      return;
    }
    onChange(saveColumnVisibility([...visibleColumns, columnId]));
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Settings className="h-4 w-4" aria-hidden />
        ตั้งค่าการแสดงผล
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:w-80"
          role="dialog"
          aria-label="เลือกคอลัมน์ที่ต้องการแสดง"
        >
          <p className="mb-3 text-sm font-semibold text-warm-gray">
            เลือกคอลัมน์ที่ต้องการแสดง
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TABLE_COLUMN_DEFINITIONS.map((column) => {
              const checked = visibleColumns.includes(column.id);
              return (
                <label
                  key={column.id}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg py-1 text-sm text-warm-gray"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleColumn(column.id)}
                    className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-500/30"
                  />
                  <span>{column.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
