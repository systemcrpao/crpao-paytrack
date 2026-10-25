import {
  saveStatusFilterSelection,
  TABLE_STATUS_OPTIONS,
} from '../../utils/tableDisplayPrefs';

export default function DikaStatusFilterChecklist({
  selected,
  onChange,
  className = '',
}) {
  const applySelection = (next) => {
    const saved = saveStatusFilterSelection(next);
    onChange(saved);
  };

  const toggleStatus = (status) => {
    if (selected.includes(status)) {
      if (selected.length === 1) return;
      applySelection(selected.filter((item) => item !== status));
      return;
    }
    applySelection([...selected, status]);
  };

  const handleClearAll = () => {
    if (selected.length === 0) return;
    applySelection([]);
  };

  return (
    <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-2 ${className}`}>
      {TABLE_STATUS_OPTIONS.map((status) => {
        const checked = selected.includes(status);
        return (
          <label
            key={status}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
              checked
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-gray-200 bg-white/80 text-warm-gray/80 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleStatus(status)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            <span className="font-medium">{status}</span>
          </label>
        );
      })}
      <button
        type="button"
        onClick={handleClearAll}
        className="px-1 text-xs font-medium text-warm-gray/80 underline underline-offset-2 transition hover:text-primary disabled:cursor-default disabled:no-underline disabled:opacity-40"
        disabled={selected.length === 0}
      >
        clear all
      </button>
    </div>
  );
}
