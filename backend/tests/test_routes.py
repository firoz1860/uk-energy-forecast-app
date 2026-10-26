import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient

from api import routes
from main import app

client = TestClient(app)


def _patch(monkeypatch, actuals, forecasts):
    monkeypatch.setattr(routes, "fetch_wind_actuals", lambda s, e: actuals)
    monkeypatch.setattr(routes, "fetch_wind_forecasts", lambda s, e: forecasts)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_wind_happy_path_and_missing_values_become_null(monkeypatch):
    actuals = [{"startTime": "2026-01-02T12:00:00Z", "generation": 1000},
               {"startTime": "2026-01-02T12:30:00Z", "generation": 2000}]
    forecasts = [{"startTime": "2026-01-02T12:00:00Z", "publishTime": "2026-01-01T08:00:00Z", "generation": 1100}]
    _patch(monkeypatch, actuals, forecasts)
    r = client.get("/api/wind", params={"start": "2026-01-02", "end": "2026-01-02"})
    assert r.status_code == 200
    body = r.json()
    assert body["metrics"]["n_points"] == 1 and body["metrics"]["mae"] == 100
    assert body["points"][0]["error"] == 100
    assert body["points"][1]["forecast"] is None          # actual without forecast -> null, not NaN


def test_wind_empty_upstream_does_not_crash(monkeypatch):
    _patch(monkeypatch, [], [])
    r = client.get("/api/wind", params={"start": "2026-01-02", "end": "2026-01-03"})
    assert r.status_code == 200
    assert r.json()["metrics"]["n_points"] == 0 and r.json()["points"] == []


def test_wind_validation(monkeypatch):
    _patch(monkeypatch, [], [])
    assert client.get("/api/wind", params={"start": "2026-01-05", "end": "2026-01-02"}).status_code == 400
    assert client.get("/api/wind", params={"start": "2025-12-31", "end": "2026-01-02"}).status_code == 400
    assert client.get("/api/wind", params={"start": "2026-01-01", "end": "2026-02-01"}).status_code == 400


def test_wind_upstream_failure_returns_502(monkeypatch):
    def boom(s, e):
        raise RuntimeError("elexon down")
    monkeypatch.setattr(routes, "fetch_wind_actuals", boom)
    monkeypatch.setattr(routes, "fetch_wind_forecasts", lambda s, e: [])
    assert client.get("/api/wind", params={"start": "2026-01-02", "end": "2026-01-02"}).status_code == 502
