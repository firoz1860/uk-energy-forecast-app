"""Pandas logic: decision-time filtering, merge with actuals, error metrics."""
from datetime import datetime
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from utils.constants import DECISION_HOUR, DECISION_MINUTE, MARKET_TZ


def decision_cutoff(target_times: pd.Series) -> pd.Series:
    """For each target half-hour T (UTC), cutoff = (UK-local date of T - 1 day) at DECISION_HOUR:MIN, in UTC.
    Only forecasts with publishTime <= cutoff were visible to the trader."""
    local_naive = target_times.dt.tz_convert(MARKET_TZ).dt.tz_localize(None)
    cutoff_naive = (local_naive.dt.normalize() - pd.Timedelta(days=1)
                    + pd.Timedelta(hours=DECISION_HOUR, minutes=DECISION_MINUTE))
    return cutoff_naive.dt.tz_localize(MARKET_TZ, nonexistent="shift_forward",
                                       ambiguous="NaT").dt.tz_convert("UTC")


def latest_forecast_at_decision_time(forecasts: List[dict]) -> pd.DataFrame:
    """One row per startTime: the most recent forecast published at or before the D-1 cutoff."""
    if not forecasts:
        return pd.DataFrame({"startTime": pd.Series(dtype="datetime64[ns, UTC]"),
                             "publishTime": pd.Series(dtype="datetime64[ns, UTC]"),
                             "forecast": pd.Series(dtype="float64")})
    f = pd.DataFrame(forecasts)
    f["startTime"] = pd.to_datetime(f["startTime"], utc=True)
    f["publishTime"] = pd.to_datetime(f["publishTime"], utc=True)
    f = f.rename(columns={"generation": "forecast"})
    f["cutoff"] = decision_cutoff(f["startTime"])
    f = f[f["publishTime"] <= f["cutoff"]]
    f = f.sort_values(["startTime", "publishTime"]).groupby("startTime", as_index=False).tail(1)
    return f[["startTime", "publishTime", "forecast"]]


def build_dataset(actuals: List[dict], forecasts: List[dict], start: datetime, end: datetime) -> pd.DataFrame:
    """Outer-join actuals and decision-time forecasts on startTime, restricted to [start, end)."""
    a = pd.DataFrame(actuals, columns=["startTime", "generation"])
    a["startTime"] = pd.to_datetime(a["startTime"], utc=True)
    a = a.rename(columns={"generation": "actual"}).drop_duplicates("startTime", keep="last")
    f = latest_forecast_at_decision_time(forecasts)

    df = pd.merge(a, f, on="startTime", how="outer").sort_values("startTime")
    lo, hi = pd.Timestamp(start), pd.Timestamp(end)
    lo = lo.tz_localize("UTC") if lo.tzinfo is None else lo
    hi = hi.tz_localize("UTC") if hi.tzinfo is None else hi
    df = df[(df["startTime"] >= lo) & (df["startTime"] < hi)].reset_index(drop=True)
    df["error"] = df["forecast"] - df["actual"]          # +ve = over-forecast
    return df


def compute_metrics(df: pd.DataFrame) -> Dict[str, Optional[float]]:
    d = df.dropna(subset=["actual", "forecast"])
    if d.empty:
        return {"n_points": 0, "mae": None, "rmse": None, "bias": None, "mape": None,
                "p95_abs_error": None, "mean_actual": None, "nmae_pct": None}
    err = d["error"].to_numpy(dtype=float)
    act = d["actual"].to_numpy(dtype=float)
    nz = act > 0
    mae = float(np.mean(np.abs(err)))
    mean_act = float(np.mean(act))
    return {
        "n_points": int(len(d)),
        "mae": mae,
        "rmse": float(np.sqrt(np.mean(err ** 2))),
        "bias": float(np.mean(err)),
        "mape": float(np.mean(np.abs(err[nz]) / act[nz]) * 100) if nz.any() else None,
        "p95_abs_error": float(np.percentile(np.abs(err), 95)),
        "mean_actual": mean_act,
        "nmae_pct": float(mae / mean_act * 100) if mean_act else None,
    }


def to_records(df: pd.DataFrame) -> List[dict]:
    out = df.copy()
    out["startTime"] = out["startTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    out["publishTime"] = out["publishTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    out = out.astype(object).where(out.notna(), None)
    return out.to_dict(orient="records")
