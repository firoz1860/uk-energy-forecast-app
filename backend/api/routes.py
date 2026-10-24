from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

from models.schemas import ForecastResponse
from services import data_processor as dp
from services.elexon_client import fetch_wind_actuals, fetch_wind_forecasts
from utils.constants import DECISION_HOUR, DECISION_MINUTE, MAX_DATE, MIN_DATE

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/wind", response_model=ForecastResponse)
def wind(start: date = Query(MIN_DATE), end: date = Query(MAX_DATE)):
    """Decision-time wind forecast vs actual for delivery days start..end (inclusive), Jan 2026 only."""
    lo, hi = date.fromisoformat(MIN_DATE), date.fromisoformat(MAX_DATE)
    if start > end:
        raise HTTPException(400, "start must be <= end")
    if start < lo or end > hi:
        raise HTTPException(400, f"Dates must be within {MIN_DATE}..{MAX_DATE}")

    t0 = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    t1 = datetime(end.year, end.month, end.day, tzinfo=timezone.utc) + timedelta(days=1)
    try:
        actuals = fetch_wind_actuals(t0, t1)
        forecasts = fetch_wind_forecasts(t0 - timedelta(days=3), t1)
    except Exception as exc:  
        raise HTTPException(502, f"Elexon upstream error: {exc}")

    df = dp.build_dataset(actuals, forecasts, t0, t1)
    return {
        "start": str(start), "end": str(end),
        "decision_rule": f"Latest WINDFOR forecast published <= {DECISION_HOUR:02d}:{DECISION_MINUTE:02d} UK time on the day before delivery",
        "points": dp.to_records(df),
        "metrics": dp.compute_metrics(df),
    }
