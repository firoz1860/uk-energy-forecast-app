import { useState } from "react";
import { fmtMW, fmtPct } from "../utils/formatters";

export default function DataTable({ points }) {
  const [open, setOpen] = useState(false);
  const [filterMisses, setFilterMisses] = useState(false);

  if (!points || points.length === 0) return null;

  // Filter for large forecast misses (> 2,500 MW)
  const displayPoints = filterMisses
    ? points.filter((p) => p.error !== null && Math.abs(p.error) >= 2500)
    : points;

  const downloadCSV = () => {
    const headers = ["Target Delivery (UTC)", "Actual (MW)", "Forecast @ D-1 09:00 (MW)", "Error (MW)", "Forecast Published (UTC)"];
    const rows = points.map((p) => [
      p.startTime,
      p.actual ?? "",
      p.forecast ?? "",
      p.error ?? "",
      p.publishTime ?? "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "uk_wind_forecast_vs_actual_jan2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-section">
      <div className="table-header-controls">
        <button
          className="btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "▼ Hide Settlement Breakdown" : "▶ Show Settlement Breakdown Table"}
        </button>

        {open && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className={`chip ${filterMisses ? "is-active" : ""}`}
              onClick={() => setFilterMisses(!filterMisses)}
              style={{ minHeight: "36px", padding: "4px 12px" }}
            >
              {filterMisses ? "Showing Misses ≥ 2.5 GW" : "Highlight Large Misses"}
            </button>
            <button
              className="btn btn--primary"
              onClick={downloadCSV}
              title="Export all rows to CSV"
            >
              ⬇ Export CSV
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="table-wrap" style={{ marginTop: "12px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Target Settlement (UTC)</th>
                <th>Actual (FUELHH)</th>
                <th>Forecast (WINDFOR @ D-1)</th>
                <th>Error (MW)</th>
                <th>Direction</th>
                <th>Forecast Published</th>
              </tr>
            </thead>
            <tbody>
              {displayPoints.map((row, idx) => {
                const err = row.error;
                const isOver = err !== null && err > 0;
                const isUnder = err !== null && err < 0;
                return (
                  <tr key={idx}>
                    <td>
                      <code>{new Date(row.startTime).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" })} UTC</code>
                    </td>
                    <td>{fmtMW(row.actual)}</td>
                    <td>{fmtMW(row.forecast)}</td>
                    <td className={isOver ? "pos" : isUnder ? "neg" : ""}>
                      {err !== null ? `${err > 0 ? "+" : ""}${Math.round(err).toLocaleString("en-GB")} MW` : "–"}
                    </td>
                    <td>
                      {isOver && <span className="badge badge--over">Over</span>}
                      {isUnder && <span className="badge badge--under">Under</span>}
                      {err === null && "–"}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>
                      {row.publishTime ? new Date(row.publishTime).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" }) : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

