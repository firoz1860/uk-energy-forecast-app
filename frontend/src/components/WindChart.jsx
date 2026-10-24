import { useState } from "react";
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtMW, fmtTick } from "../utils/formatters";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tip">
      <b>{fmtTick(label)}</b>
      <div>Actual: {fmtMW(p.actual)}</div>
      <div>Forecast: {fmtMW(p.forecast)}</div>
      <div>Error: {fmtMW(p.error)}</div>
      {p.publishTime && (
        <div className="tip-s">Forecast published {fmtTick(p.publishTime)}</div>
      )}
    </div>
  );
}

export default function WindChart({ points }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="chart" data-expanded={expanded}>
      <div className="chart-actions">
        <button className="btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? "✕ Close Fullscreen" : "⛶ Expand Chart"}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={expanded ? 680 : 420}>
        <LineChart
          data={points}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="startTime" tickFormatter={fmtTick} minTickGap={60} />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)} GW`} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual (FUELHH)"
            stroke="#0b7285"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast at decision time (WINDFOR)"
            stroke="#e8590c"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
          <Brush dataKey="startTime" height={24} tickFormatter={fmtTick} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
