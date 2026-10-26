import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from datetime import datetime, timedelta, timezone

from services import elexon_client as ec

UTC = timezone.utc


def _reset(monkeypatch, calls):
    ec._cache.clear()

    def fake_get(url, params, retries=3):
        calls.append((url.rsplit("/", 2)[-2], dict(params)))
        if "FUELHH" in url:
            return [{"startTime": "2026-01-02T00:00:00Z", "generation": 1, "fuelType": "WIND"},
                    {"startTime": "2026-01-02T00:30:00Z", "generation": 2, "fuelType": "SOLAR"}]
        return [{"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T06:00:00Z", "generation": 3}]

    monkeypatch.setattr(ec, "_get", fake_get)


def test_chunks_cover_window_on_fixed_grid():
    start, end = datetime(2026, 1, 2, tzinfo=UTC), datetime(2026, 1, 8, tzinfo=UTC)
    chunks = list(ec._chunks(start, end))
    assert chunks[0][0] <= start and chunks[-1][1] >= end
    for (_, e1), (s2, _) in zip(chunks, chunks[1:]):
        assert e1 == s2                              # contiguous, no gaps
    assert all((e - s) == timedelta(days=ec.CHUNK_DAYS) for s, e in chunks)


def test_overlapping_windows_reuse_cache(monkeypatch):
    calls = []
    _reset(monkeypatch, calls)
    ec.fetch_wind_actuals(datetime(2026, 1, 1, tzinfo=UTC), datetime(2026, 1, 8, tzinfo=UTC))
    first = len(calls)
    ec.fetch_wind_actuals(datetime(2026, 1, 2, tzinfo=UTC), datetime(2026, 1, 7, tzinfo=UTC))
    assert len(calls) == first                       # second window fully served from cache


def test_non_wind_rows_are_dropped(monkeypatch):
    calls = []
    _reset(monkeypatch, calls)
    rows = ec.fetch_wind_actuals(datetime(2026, 1, 2, tzinfo=UTC), datetime(2026, 1, 3, tzinfo=UTC))
    assert rows and all(r["generation"] == 1 for r in rows)


def test_forecast_rows_keep_publish_time(monkeypatch):
    calls = []
    _reset(monkeypatch, calls)
    rows = ec.fetch_wind_forecasts(datetime(2025, 12, 30, tzinfo=UTC), datetime(2026, 1, 3, tzinfo=UTC))
    assert rows and rows[0]["publishTime"] == "2026-01-01T06:00:00Z"
