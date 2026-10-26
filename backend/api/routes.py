from datetime import date, datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query

from models.schemas import ForecastResponse
from services import data_processor as dp
from services.elexon_client import fetch_wind_actuals, fetch_wind_forecasts
from utils.constants import (
    DECISION_HOUR, DECISION_MINUTE, DEFAULT_END, DEFAULT_START,
    MARKET_TZ, MAX_DATE, MAX_RANGE_DAYS, MIN_DATE,
)

router = APIRouter(prefix="/api")
_LONDON = ZoneInfo(MARKET_TZ)


def date_bounds() -> tuple:
    """(earliest, latest) selectable delivery day. Latest defaults to tomorrow (UTC)."""
    lo = date.fromisoformat(MIN_DATE)
    hi = date.fromisoformat(MAX_DATE) if MAX_DATE else datetime.now(timezone.utc).date() + timedelta(days=1)
    return lo, hi


def _uk_day_start_utc(d: date) -> datetime:
    """Midnight at the start of UK-local day `d`, expressed in UTC (handles GMT/BST)."""
    return datetime(d.year, d.month, d.day, tzinfo=_LONDON).astimezone(timezone.utc)


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/wind", response_model=ForecastResponse)
def wind(start: Optional[date] = Query(None), end: Optional[date] = Query(None)):
    """Decision-time wind forecast vs actual for delivery days start..end (inclusive, UK local days)."""
    start = start or date.fromisoformat(DEFAULT_START)
    end = end or date.fromisoformat(DEFAULT_END)
    lo, hi = date_bounds()
    if start > end:
        raise HTTPException(400, "start must be <= end")
    if start < lo or end > hi:
        raise HTTPException(400, f"Dates must be within {lo}..{hi}")
    if (end - start).days + 1 > MAX_RANGE_DAYS:
        raise HTTPException(400, f"Range too long: maximum is {MAX_RANGE_DAYS} days per request")

    t0 = _uk_day_start_utc(start)
    t1 = _uk_day_start_utc(end + timedelta(days=1))
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

