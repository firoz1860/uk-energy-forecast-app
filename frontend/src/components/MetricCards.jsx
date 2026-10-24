import { fmtMW, fmtPct } from "../utils/formatters";

const tip = {
  MAE: "Average absolute miss between forecast and actual generation.",
  RMSE: "Root Mean Square Error: penalises severe forecast misses more heavily.",
  Bias: "Mean Error (Forecast − Actual). Positive indicates systematic over-forecasting.",
  "P95 abs error": "95% of half-hour settlement periods miss by less than this buffer.",
  nMAE: "Normalized MAE as a percentage of average actual wind generation.",
  Samples: "Total number of half-hour settlement intervals evaluated.",
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
      {cards.map(([t, v, s], idx) => {
        const pos =
          idx === 0
            ? "first"
            : idx === cards.length - 1
            ? "last"
            : "mid";
        return (
          <div
            className="card"
            key={t}
            data-tip={tip[t]}
            data-card-pos={pos}
            tabIndex={0}
          >
            <div className="card-header-row">
              <div className="card-t">{t}</div>
              <span className="card-info-icon" title={tip[t]} aria-hidden="true">
                ⓘ
              </span>
            </div>
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
              <div className="card-desc">{s}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
