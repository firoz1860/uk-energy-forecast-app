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


def _chunks(start: datetime, end: datetime):
    cur = start
    while cur < end:
        nxt = min(cur + timedelta(days=CHUNK_DAYS), end)
        yield cur, nxt
        cur = nxt


def fetch_wind_actuals(start: datetime, end: datetime) -> List[dict]:
    """FUELHH, fuelType=WIND, targets in [start, end). Returns [{startTime, generation}]."""
    key = ("act", start, end)
    if key in _cache:
        return _cache[key]
    rows: List[dict] = []
    for s, e in _chunks(start, end):
        rows += _get(FUELHH_STREAM, {
            "settlementDateFrom": s.strftime("%Y-%m-%d"),
            "settlementDateTo": (e - timedelta(seconds=1)).strftime("%Y-%m-%d"),
            "fuelType": "WIND",
        })
    out = [{"startTime": r["startTime"], "generation": r["generation"]}
           for r in rows if r.get("fuelType", "WIND") == "WIND"]
    _cache[key] = out
    return out


def fetch_wind_forecasts(publish_from: datetime, publish_to: datetime) -> List[dict]:
    """WINDFOR published in [publish_from, publish_to). Returns [{startTime, publishTime, generation}]."""
    key = ("fc", publish_from, publish_to)
    if key in _cache:
        return _cache[key]
    rows: List[dict] = []
    for s, e in _chunks(publish_from, publish_to):
        rows += _get(WINDFOR_STREAM, {"publishDateTimeFrom": _iso(s), "publishDateTimeTo": _iso(e)})
    out = [{"startTime": r["startTime"], "publishTime": r["publishTime"], "generation": r["generation"]}
           for r in rows]
    _cache[key] = out
    return out
