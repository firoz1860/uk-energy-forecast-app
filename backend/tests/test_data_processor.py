import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from datetime import datetime, timezone

from services import data_processor as dp

T0 = datetime(2026, 1, 2, tzinfo=timezone.utc)
T1 = datetime(2026, 1, 3, tzinfo=timezone.utc)


def fc(pub, gen, start="2026-01-02T12:00:00Z"):
    return {"startTime": start, "publishTime": pub, "generation": gen}


def test_picks_latest_forecast_before_cutoff():
    act = [{"startTime": "2026-01-02T12:00:00Z", "generation": 1000}]
    fcs = [fc("2026-01-01T08:00:00Z", 900), fc("2026-01-01T08:59:00Z", 1100), fc("2026-01-01T09:30:00Z", 5000)]
    df = dp.build_dataset(act, fcs, T0, T1)
    assert df.loc[0, "forecast"] == 1100          # 09:30 forecast is excluded (after cutoff)
    assert df.loc[0, "error"] == 100


def test_forecast_published_same_day_is_excluded():
    act = [{"startTime": "2026-01-02T12:00:00Z", "generation": 1000}]
    df = dp.build_dataset(act, [fc("2026-01-02T06:00:00Z", 777)], T0, T1)
    assert df["forecast"].isna().all()


def test_metrics():
    act = [{"startTime": "2026-01-02T12:00:00Z", "generation": 1000},
           {"startTime": "2026-01-02T12:30:00Z", "generation": 2000}]
    fcs = [fc("2026-01-01T08:00:00Z", 1100), fc("2026-01-01T08:00:00Z", 1800, "2026-01-02T12:30:00Z")]
    m = dp.compute_metrics(dp.build_dataset(act, fcs, T0, T1))
    assert m["n_points"] == 2 and m["mae"] == 150 and m["bias"] == -50
