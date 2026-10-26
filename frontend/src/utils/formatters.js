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



  
const pad2 = (n) => String(n).padStart(2, "0");
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const toIso = (y, m0, d) => `${y}-${pad2(m0 + 1)}-${pad2(d)}`; 
export const parseIso = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m0: m - 1, d };
};
export const daysInMonth = (y, m0) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
export const addDays = (iso, n) => {
  const { y, m0, d } = parseIso(iso);
  return new Date(Date.UTC(y, m0, d + n)).toISOString().slice(0, 10);
};
export const diffDays = (a, b) => {
  const pa = parseIso(a), pb = parseIso(b);
  return Math.round((Date.UTC(pb.y, pb.m0, pb.d) - Date.UTC(pa.y, pa.m0, pa.d)) / 86400000);
};
export const fmtFriendlyDate = (iso) => {
  if (!iso) return "–";
  const { y, m0, d } = parseIso(iso);
  return `${pad2(d)} ${MONTH_NAMES[m0].slice(0, 3)} ${y}`;
};
export const fmtRangeLabel = (start, end) => {
  const a = parseIso(start), b = parseIso(end);
  if (a.y === b.y && a.m0 === b.m0) return `${MONTH_NAMES[a.m0]} ${a.y}`;
  return `${fmtFriendlyDate(start)} – ${fmtFriendlyDate(end)}`;
};

export const getDateBounds = () => {
  const today = new Date().toISOString().slice(0, 10); 
  return {
    min: import.meta.env.VITE_MIN_DATE || "2024-01-01",
    max: import.meta.env.VITE_MAX_DATE || addDays(today, 1), 
    maxRangeDays: Number(import.meta.env.VITE_MAX_RANGE_DAYS) || 31,
  };
};

export const monthPresets = (anchorIso, min, max) => {
  const { y, m0 } = parseIso(anchorIso);
  const last = daysInMonth(y, m0);
  const d = (n) => toIso(y, m0, n);
  return [
    ["Week 1", d(1), d(7)],
    ["Week 2", d(8), d(14)],
    ["Week 3", d(15), d(21)],
    ["Week 4", d(22), d(last)],
    ["Full month", d(1), d(last)],
  ]
    .map(([label, s, e]) => [label, s < min ? min : s, e > max ? max : e])
    .filter(([, s, e]) => s <= e && diffDays(s, e) + 1 <= 366);
};