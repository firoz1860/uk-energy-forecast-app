import { useEffect, useState } from "react";
import DateSelector from "./components/DateSelector";
import MetricCards from "./components/MetricCards";
import WindChart from "./components/WindChart";
import DataTable from "./components/DataTable";
import { fetchWind } from "./services/api";

const presets = [
  ["Week 1", "2026-01-01", "2026-01-07"],
  ["Week 2", "2026-01-08", "2026-01-14"],
  ["Week 3", "2026-01-15", "2026-01-21"],
  ["Week 4", "2026-01-22", "2026-01-31"],
  ["Full month", "2026-01-01", "2026-01-31"],
];

export default function App() {
  const [range, setRange] = useState({ start: "2026-01-01", end: "2026-01-07" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "");
  const [density, setDensity] = useState(() => localStorage.getItem("density") || "");

  // Manage theme attribute
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Manage density attribute
  useEffect(() => {
    const root = document.documentElement;
    if (density) root.setAttribute("data-density", density);
    else root.removeAttribute("data-density");
    localStorage.setItem("density", density);
  }, [density]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-anim");
    const isDark = theme
      ? theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => root.classList.remove("theme-anim"), 450);
  };

  const toggleDensity = () => {
    setDensity((prev) => (prev === "compact" ? "" : "compact"));
  };

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fetchWind(range.start, range.end)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.response?.data?.detail || e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [range]);

  return (
    <main className="wrap">
      {/* Theme Toggle Button */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle light/dark theme"
        title="Toggle Theme"
      >
        ◐
      </button>

      {/* Floating Action Button - Scroll to top */}
      <button
        className="fab"
        aria-label="Back to top"
        title="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>

      {/* Brand Header */}
      <header className="brand-header">
        <div className="brand-logo-badge">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>UK Power Trading Analytics</span>
        </div>
        <h1>UK Wind Forecast vs Actual – January 2026</h1>
        <p className="sub">
          Evaluating National Grid ESO wind forecasts available strictly at the Day-Ahead decision gate (09:00 UK time) against actual outturn generation.
        </p>
      </header>

      {/* Controls Bar: Quick presets + Density button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div className="chip-group">
          {presets.map(([label, start, end]) => (
            <button
              key={label}
              className={`chip ${
                range.start === start && range.end === end ? "is-active" : ""
              }`}
              aria-pressed={range.start === start && range.end === end}
              onClick={() => setRange({ start, end })}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className="btn"
          onClick={toggleDensity}
          title="Toggle compact display mode"
        >
          {density === "compact" ? "Standard view" : "Compact view"}
        </button>
      </div>

      {/* Date Selector */}
      <DateSelector
        start={range.start}
        end={range.end}
        onChange={(start, end) => setRange({ start, end })}
      />

      {data && (
        <div className="rule">
          <span className="live-dot" style={{ margin: 0 }} />
          <span><b>Trading Cutoff:</b> {data.decision_rule}</span>
        </div>
      )}

      {/* Error state */}
      {error && <p className="msg err">Error: {error}</p>}

      {/* Loading Skeletons */}
      {loading && (
        <>
          <div className="cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
          <div className="skeleton skeleton-chart" />
        </>
      )}

      {/* Data Visualizations & Table */}
      {data && !loading && (
        <>
          <MetricCards metrics={data.metrics} />
          <WindChart points={data.points} />
          <DataTable points={data.points} />
        </>
      )}

      <footer className="footer">
        <span className="live-dot" />
        Data Source: Elexon BMRS API (<code>FUELHH</code> Actuals & <code>WINDFOR</code> Forecasts) · Target Period: January 2026
      </footer>
    </main>
  );
}
