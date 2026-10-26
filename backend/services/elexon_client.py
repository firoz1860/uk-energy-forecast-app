"""Thin client for the Elexon BMRS stream endpoints (FUELHH wind actuals, WINDFOR forecasts)."""
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List

import requests

from utils.constants import CHUNK_DAYS, FUELHH_STREAM, HTTP_TIMEOUT, WINDFOR_STREAM

log = logging.getLogger(__name__)
_cache: Dict[tuple, List[dict]] = {}


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get(url: str, params: dict, retries: int = 3) -> List[dict]:
    for attempt in range(retries):
        try:
            r = requests.get(url, params={**params, "format": "json"}, timeout=HTTP_TIMEOUT)
            r.raise_for_status()
            data = r.json()
            return data if isinstance(data, list) else data.get("data", [])
        except requests.RequestException as exc:
            log.warning("Elexon call failed (%s/%s): %s", attempt + 1, retries, exc)
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    return []


_GRID_ANCHOR = datetime(2025, 12, 29, tzinfo=timezone.utc)


def _chunks(start: datetime, end: datetime):
    step = timedelta(days=CHUNK_DAYS)
    cur = _GRID_ANCHOR + ((start - _GRID_ANCHOR) // step) * step
    while cur < end:
        yield cur, cur + step
        cur += step


def fetch_wind_actuals(start: datetime, end: datetime) -> List[dict]:
    """FUELHH, fuelType=WIND, covering targets in [start, end). Returns [{startTime, generation}].
    May include a few extra half-hours around the window; the processor trims to the exact range."""
    out: List[dict] = []
    for s, e in _chunks(start, end):
        key = ("act", s, e)
        if key not in _cache:
            rows = _get(FUELHH_STREAM, {
                "settlementDateFrom": s.strftime("%Y-%m-%d"),
                "settlementDateTo": (e - timedelta(seconds=1)).strftime("%Y-%m-%d"),
                "fuelType": "WIND",
            })
            mapped = [{"startTime": r["startTime"], "generation": r["generation"]}
                      for r in rows if r.get("fuelType", "WIND") == "WIND"]
            if not mapped:      # don't cache empty answers (could be a transient upstream gap)
                continue
            _cache[key] = mapped
        out += _cache[key]
    return out


def fetch_wind_forecasts(publish_from: datetime, publish_to: datetime) -> List[dict]:
    """WINDFOR published in [publish_from, publish_to). Returns [{startTime, publishTime, generation}]."""
    out: List[dict] = []
    for s, e in _chunks(publish_from, publish_to):
        key = ("fc", s, e)
        if key not in _cache:
            rows = _get(WINDFOR_STREAM, {"publishDateTimeFrom": _iso(s), "publishDateTimeTo": _iso(e)})
            mapped = [{"startTime": r["startTime"], "publishTime": r["publishTime"],
                       "generation": r["generation"]} for r in rows]
            if not mapped:
                continue
            _cache[key] = mapped
        out += _cache[key]
    return out
