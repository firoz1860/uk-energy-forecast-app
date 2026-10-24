import { fmtMW, fmtPct } from "../utils/formatters";

const tip = {
  MAE: "Average absolute miss between forecast and actual.",
  RMSE: "Like MAE but punishes large misses more.",
  Bias: "Average of forecast minus actual. Positive = over-forecast.",
  "P95 abs error": "95% of half-hours miss by less than this.",
  nMAE: "MAE divided by mean wind output.",
  Samples: "Number of half-hour slots compared.",
};

export default function MetricCards({ metrics }) {
  if (!metrics) return null;
  const cards = [
    ["MAE", fmtMW(metrics.mae), "Typical size of miss"],
    ["RMSE", fmtMW(metrics.rmse), "Penalises large misses"],
    [
      "Bias",
      fmtMW(metrics.bias),
      metrics.bias > 0
        ? "Over-forecasts wind (risk: under-buying)"
        : "Under-forecasts wind (risk: over-buying)",
    ],
    [
      "P95 abs error",
      fmtMW(metrics.p95_abs_error),
      "Buffer covering 95% of slots",
    ],
    ["nMAE", fmtPct(metrics.nmae_pct), "MAE as % of mean wind output"],
    [
      "Samples",
      metrics.n_points.toLocaleString("en-GB"),
      "Half-hours compared",
    ],
  ];
  return (
    <div className="cards">
      {cards.map(([t, v, s]) => (
        <div className="card" key={t} data-tip={tip[t]} tabIndex={0}>
          <div className="card-t">{t}</div>
          <div className="card-v">{v}</div>
          <div className="card-s">
            {t === "Bias" && metrics.bias !== null && (
              <span
                className={`badge ${
                  metrics.bias > 0 ? "badge--over" : "badge--under"
                }`}
                style={{ display: "inline-flex", marginBottom: "4px" }}
              >
                {metrics.bias > 0 ? "Over-forecast" : "Under-forecast"}
              </span>
            )}
            <div>{s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
