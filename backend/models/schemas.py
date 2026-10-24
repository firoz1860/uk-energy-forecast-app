from typing import List, Optional
from pydantic import BaseModel


class Point(BaseModel):
    startTime: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    publishTime: Optional[str] = None
    error: Optional[float] = None


class Metrics(BaseModel):
    n_points: int
    mae: Optional[float] = None
    rmse: Optional[float] = None
    bias: Optional[float] = None
    mape: Optional[float] = None
    p95_abs_error: Optional[float] = None
    mean_actual: Optional[float] = None
    nmae_pct: Optional[float] = None


class ForecastResponse(BaseModel):
    start: str
    end: str
    decision_rule: str
    points: List[Point]
    metrics: Metrics
