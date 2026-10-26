import { useState, useRef, useEffect } from "react";
import {
  MONTH_NAMES,
  addDays,
  daysInMonth,
  diffDays,
  fmtFriendlyDate,
  getDateBounds,
  parseIso,
  toIso,
} from "../utils/formatters";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DEFAULT_BOUNDS = getDateBounds();

export default function DateSelector({
  start,
  end,
  onChange,
  min = DEFAULT_BOUNDS.min,
  max = DEFAULT_BOUNDS.max,
  maxRangeDays = DEFAULT_BOUNDS.maxRangeDays,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingField, setSelectingField] = useState("start"); 
  const [hoverDate, setHoverDate] = useState(null);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState(() => {
    const { y, m0 } = parseIso(start);
    return { y, m0 };
  }); 
  const popoverRef = useRef(null);

  const minP = parseIso(min);
  const maxP = parseIso(max);

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

  useEffect(() => {
    if (isOpen) {
      const { y, m0 } = parseIso(selectingField === "end" ? end : start);
      setView({ y, m0 });
    } else {
      setHoverDate(null);
      setNotice("");
    }
  }, [isOpen]);

  const getDaysCount = () => {
    if (!start || !end) return 0;
    const diff = diffDays(start, end) + 1;
    return diff > 0 ? diff : 1;
  };

  const monthIndex = (y, m0) => y * 12 + m0;
  const canGoPrev = monthIndex(view.y, view.m0) > monthIndex(minP.y, minP.m0);
  const canGoNext = monthIndex(view.y, view.m0) < monthIndex(maxP.y, maxP.m0);
  const shiftMonth = (delta) => {
    const idx = monthIndex(view.y, view.m0) + delta;
    setView({ y: Math.floor(idx / 12), m0: ((idx % 12) + 12) % 12 });
  };
  const clampView = (y, m0) => {
    const idx = Math.min(Math.max(monthIndex(y, m0), monthIndex(minP.y, minP.m0)), monthIndex(maxP.y, maxP.m0));
    setView({ y: Math.floor(idx / 12), m0: idx % 12 });
  };
  const years = Array.from({ length: maxP.y - minP.y + 1 }, (_, i) => minP.y + i);

  const daysInView = daysInMonth(view.y, view.m0);
  const paddingBefore = (new Date(Date.UTC(view.y, view.m0, 1)).getUTCDay() + 6) % 7;
  const paddingAfter = (7 - ((paddingBefore + daysInView) % 7)) % 7;
  const prevMonthDays = daysInMonth(view.m0 === 0 ? view.y - 1 : view.y, (view.m0 + 11) % 12);

  const limitRange = (s, e) => {
    let end2 = e > max ? max : e;
    if (diffDays(s, end2) + 1 > maxRangeDays) {
      end2 = addDays(s, maxRangeDays - 1);
      if (end2 > max) end2 = max;
      setNotice(`Windows are limited to ${maxRangeDays} days, end date adjusted.`);
    } else {
      setNotice("");
    }
    return [s, end2];
  };

  const handleDayClick = (selectedIso) => {
    if (selectedIso < min || selectedIso > max) return;

    if (selectingField === "start") {
      const [s, e] = limitRange(selectedIso, selectedIso > end ? selectedIso : end);
      onChange(s, e);
      setSelectingField("end");
    } else {
      const [s, e] = selectedIso < start ? limitRange(selectedIso, start) : limitRange(start, selectedIso);
      onChange(s, e);
      setSelectingField("start");
    }
  };

  const applyFullMonth = () => {
    const first = toIso(view.y, view.m0, 1);
    const last = toIso(view.y, view.m0, daysInView);
    const [s, e] = limitRange(first < min ? min : first, last > max ? max : last);
    onChange(s, e);
    setSelectingField("start");
    setIsOpen(false);
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
            <span className="picker-value">{fmtFriendlyDate(start)}</span>
          </div>

          <span className="picker-arrow">→</span>

          <div
            className={`picker-pill ${selectingField === "end" && isOpen ? "is-focused" : ""}`}
            onClick={openField("end")}
          >
            <span className="picker-label">TO</span>
            <span className="picker-value">{fmtFriendlyDate(end)}</span>
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
          {/* Month / year navigation */}
          <div className="calendar-nav">
            <button
              type="button"
              className="cal-nav-btn"
              aria-label="Previous month"
              disabled={!canGoPrev}
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <div className="cal-nav-selects">
              <select
                className="cal-select"
                aria-label="Month"
                value={view.m0}
                onChange={(e) => clampView(view.y, Number(e.target.value))}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i}>{name}</option>
                ))}
              </select>
              <select
                className="cal-select"
                aria-label="Year"
                value={view.y}
                onChange={(e) => clampView(Number(e.target.value), view.m0)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="cal-nav-btn"
              aria-label="Next month"
              disabled={!canGoNext}
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>

          {/* Calendar Header */}
          <div className="calendar-header">
            <span className="calendar-month-title">{MONTH_NAMES[view.m0]} {view.y}</span>
            <div className="calendar-selection-mode">
              <span className="mode-badge">
                Clicking sets: <b>{selectingField === "start" ? "START DATE" : "END DATE"}</b>
              </span>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="calendar-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-grid">
            {/* Previous-month padding days */}
            {Array.from({ length: paddingBefore }).map((_, i) => (
              <span key={`prev-${i}`} className="cal-day is-disabled">
                {prevMonthDays - paddingBefore + 1 + i}
              </span>
            ))}

            {/* Days of the visible month */}
            {Array.from({ length: daysInView }).map((_, i) => {
              const day = i + 1;
              const dateIso = toIso(view.y, view.m0, day);

              const isStart = dateIso === start;
              const isEnd = dateIso === end;
              const inRange = dateIso > start && dateIso < end;
              const isOutOfBounds = dateIso < min || dateIso > max;

              const isPreview =
                isOpen &&
                selectingField === "end" &&
                hoverDate !== null &&
                dateIso > start &&
                dateIso <= hoverDate &&
                !isEnd;

              return (
                <button
                  key={dateIso}
                  type="button"
                  disabled={isOutOfBounds}
                  aria-pressed={isStart || isEnd}
                  aria-label={fmtFriendlyDate(dateIso)}
                  className={`cal-day ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""} ${inRange ? "in-range" : ""} ${isPreview ? "is-preview" : ""} ${isOutOfBounds ? "is-disabled" : ""}`}
                  onClick={() => handleDayClick(dateIso)}
                  onMouseEnter={() => setHoverDate(dateIso)}
                  onMouseLeave={() => setHoverDate(null)}
                  onFocus={() => setHoverDate(dateIso)}
                  onBlur={() => setHoverDate(null)}
                >
                  {day}
                </button>
              );
            })}

            {/* Next-month padding days */}
            {Array.from({ length: paddingAfter }).map((_, i) => (
              <span key={`next-${i}`} className="cal-day is-disabled">
                {i + 1}
              </span>
            ))}
          </div>

          {notice && <div className="cal-notice" role="status">{notice}</div>}

          {/* Popover Footer with Quick Controls */}
          <div className="calendar-footer">
            <div className="cal-footer-hint">
              <span>Delivery Market: GB Day-Ahead</span>
            </div>
            <div className="cal-footer-btns">
              <button type="button" className="cal-btn-text" onClick={applyFullMonth}>
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

