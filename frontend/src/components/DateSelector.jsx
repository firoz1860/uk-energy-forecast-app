export default function DateSelector({
  start,
  end,
  onChange,
  min = "2026-01-01",
  max = "2026-01-31",
}) {
  return (
    <div className="selector">
      <div className="selector-group">
        <label className="selector-field">
          <span className="selector-label-text">From</span>
          <input
            type="date"
            value={start}
            min={min}
            max={end}
            onChange={(e) => e.target.value && onChange(e.target.value, end)}
          />
        </label>
        <span className="selector-separator" aria-hidden="true">
          →
        </span>
        <label className="selector-field">
          <span className="selector-label-text">To</span>
          <input
            type="date"
            value={end}
            min={start}
            max={max}
            onChange={(e) => e.target.value && onChange(start, e.target.value)}
          />
        </label>
      </div>
      <div className="selector-hint">
        <span>Delivery period: January 2026</span>
      </div>
    </div>
  );
}
