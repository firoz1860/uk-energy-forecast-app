export const fmtMW = (v) =>
  v == null ? "–" : `${Math.round(v).toLocaleString("en-GB")} MW`;
export const fmtPct = (v) => (v == null ? "–" : `${v.toFixed(1)}%`);
export const fmtTick = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
