export default function DateSelector({
  start,
  end,
  onChange,
  min = "2026-01-01",
  max = "2026-01-31",
}) {
  return (
    <div className="selector">
      <label>
        From{" "}
        <input
          type="date"
          value={start}
          min={min}
          max={end}
          onChange={(e) => e.target.value && onChange(e.target.value, end)}
        />
      </label>
      <label>
        To{" "}
        <input
          type="date"
          value={end}
          min={start}
          max={max}
          onChange={(e) => e.target.value && onChange(start, e.target.value)}
        />
      </label>
    </div>
  );
}
