import { useState, useRef, useEffect } from "react";

export default function DateSelector({
  start,
  end,
  onChange,
  min = "2026-01-01",
  max = "2026-01-31",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingField, setSelectingField] = useState("start"); // "start" or "end"
  const [hoverDate, setHoverDate] = useState(null);
  const popoverRef = useRef(null);

  // Close when clicking outside, or when pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  // Clear hover preview whenever the popover closes
  useEffect(() => {
    if (!isOpen) setHoverDate(null);
  }, [isOpen]);

  // Format YYYY-MM-DD to human friendly "01 Jan 2026"
  const formatFriendly = (iso) => {
    if (!iso) return "–";
    const [y, m, d] = iso.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
  };

  // Calculate day difference
  const getDaysCount = () => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const daysInJan = 31;
  const paddingBefore = 3; // Dec 29, 30, 31 (Jan 1 2026 is a Thursday, grid starts on Monday)
  const paddingAfter = (7 - ((paddingBefore + daysInJan) % 7)) % 7; // Feb 1 (fills last row)

  const toIso = (day) => `2026-01-${day < 10 ? `0${day}` : `${day}`}`;

  const handleDayClick = (dayNum) => {
    const selectedIso = toIso(dayNum);
    if (selectedIso < min || selectedIso > max) return;

    if (selectingField === "start") {
      if (selectedIso > end) {
        onChange(selectedIso, selectedIso);
      } else {
        onChange(selectedIso, end);
      }
      setSelectingField("end");
    } else {
      if (selectedIso < start) {
        // Clicked before the start date: swap, range is now complete
        onChange(selectedIso, start);
      } else {
        onChange(start, selectedIso);
      }
      setSelectingField("start");
    }
  };

  const openField = (field) => (e) => {
    e.stopPropagation();
    setSelectingField(field);
    setIsOpen(true);
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((o) => !o);
    }
  };

  return (
    <div className="modern-date-picker" ref={popoverRef}>
      {/* Interactive Trigger Bar */}
      <div
        className="picker-trigger-bar"
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="picker-dates-display">
          <div
            className={`picker-pill ${selectingField === "start" && isOpen ? "is-focused" : ""}`}
            onClick={openField("start")}
          >
            <span className="picker-label">FROM</span>
            <span className="picker-value">{formatFriendly(start)}</span>
          </div>

          <span className="picker-arrow">→</span>

          <div
            className={`picker-pill ${selectingField === "end" && isOpen ? "is-focused" : ""}`}
            onClick={openField("end")}
          >
            <span className="picker-label">TO</span>
            <span className="picker-value">{formatFriendly(end)}</span>
          </div>
        </div>

        <div className="picker-actions">
          <span className="picker-duration-tag">{getDaysCount()} Days Window</span>
          <button
            type="button"
            className="picker-toggle-btn"
            aria-label="Toggle calendar popover"
            aria-expanded={isOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Modern Calendar Popover (Linear/Vercel Design) */}
      {isOpen && (
        <div className="calendar-popover" role="dialog" aria-label="Select date range">
          {/* Calendar Header */}
          <div className="calendar-header">
            <span className="calendar-month-title">January 2026</span>
            <div className="calendar-selection-mode">
              <span className="mode-badge">
                Clicking sets: <b>{selectingField === "start" ? "START DATE" : "END DATE"}</b>
              </span>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="calendar-weekdays">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>Su</span>
          </div>

          {/* Days Grid */}
          <div className="calendar-grid">
            {/* Dec padding days (29, 30, 31) */}
            {Array.from({ length: paddingBefore }).map((_, i) => (
              <span key={`dec-${i}`} className="cal-day is-disabled">
                {31 - paddingBefore + 1 + i}
              </span>
            ))}

            {/* January 1 - 31 */}
            {Array.from({ length: daysInJan }).map((_, i) => {
              const day = i + 1;
              const dateIso = toIso(day);

              const isStart = dateIso === start;
              const isEnd = dateIso === end;
              const inRange = dateIso > start && dateIso < end;
              const isOutOfBounds = dateIso < min || dateIso > max;

              // Live preview while choosing the end date: shade start -> hovered day
              const isPreview =
                isOpen &&
                selectingField === "end" &&
                hoverDate !== null &&
                dateIso > start &&
                dateIso <= hoverDate &&
                !isEnd;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isOutOfBounds}
                  aria-pressed={isStart || isEnd}
                  aria-label={formatFriendly(dateIso)}
                  className={`cal-day ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""} ${inRange ? "in-range" : ""} ${isPreview ? "is-preview" : ""} ${isOutOfBounds ? "is-disabled" : ""}`}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(dateIso)}
                  onMouseLeave={() => setHoverDate(null)}
                  onFocus={() => setHoverDate(dateIso)}
                  onBlur={() => setHoverDate(null)}
                >
                  {day}
                </button>
              );
            })}

            {/* Feb padding day(s) */}
            {Array.from({ length: paddingAfter }).map((_, i) => (
              <span key={`feb-${i}`} className="cal-day is-disabled">
                {i + 1}
              </span>
            ))}
          </div>

          {/* Popover Footer with Quick Controls */}
          <div className="calendar-footer">
            <div className="cal-footer-hint">
              <span>Delivery Market: GB Day-Ahead</span>
            </div>
            <div className="cal-footer-btns">
              <button
                type="button"
                className="cal-btn-text"
                onClick={() => {
                  onChange("2026-01-01", "2026-01-31");
                  setSelectingField("start");
                  setIsOpen(false);
                }}
              >
                Full Month
              </button>
              <button
                type="button"
                className="cal-btn-done"
                onClick={() => setIsOpen(false)}
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
