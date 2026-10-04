import { Search, X } from 'lucide-react';

export default function DikaSearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray/50" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ค้นหา เลขที่, เรื่อง, ผู้รับเงิน, หน่วยงาน, ผู้รับผิดชอบ, สถานะ..."
        className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-10 text-sm text-warm-gray outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-warm-gray/50 hover:bg-gray-100 hover:text-warm-gray"
          aria-label="ล้างการค้นหา"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
