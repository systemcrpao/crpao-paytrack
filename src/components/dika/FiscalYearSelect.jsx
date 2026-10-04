export default function FiscalYearSelect({ value, onChange, years = [] }) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5">
      <label htmlFor="fiscal-year" className="text-sm text-warm-gray/70">
        ปีงบประมาณ
      </label>
      <select
        id="fiscal-year"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-warm-gray outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="all">ทั้งหมด</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
