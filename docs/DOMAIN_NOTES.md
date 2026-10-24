# Phase 1 – Domain notes

## 1. Day-ahead market timing (GB)
Power for delivery day D is traded the day before (D-1) in hourly/half-hourly day-ahead auctions
(EPEX SPOT GB, N2EX). Gate closure is around **09:20 (EPEX) / 09:50 (N2EX) UK time** on D-1, with results
published shortly after (~10:00-12:00). Traders therefore decide in the **morning of D-1**.
This app uses **09:00 UK time** as a conservative "what was known" cutoff (configurable).
In January UK time = UTC, but the code is timezone/DST-safe (Europe/London).

## 2. Aligning startTime and publishTime
- `startTime` = the half-hour being forecast/measured (join key with FUELHH actuals).
- `publishTime` = when that forecast was produced. WINDFOR holds many forecasts for the same `startTime`.
- For target T: `cutoff = (UK-local date of T − 1 day) + 09:00`.
  Keep rows with `publishTime <= cutoff`, sort by `publishTime`, take the **last** row per `startTime`.
- Example: T = 2 Jan 12:00 -> cutoff = 1 Jan 09:00. A forecast published 1 Jan 08:59 is used; one published 1 Jan 09:30 is not (hindsight leakage).
- Then join to FUELHH WIND actuals on `startTime`; error = forecast − actual (+ve = over-forecast).

## 3. Error metrics shown
- **MAE** – average miss in MW; easy to translate into MWh to buy/sell.
- **RMSE** – penalises large misses (expensive imbalance events).
- **Bias** – systematic over/under-forecasting; tells the trader which way to adjust.
- **P95 absolute error** – a practical buffer: 95% of half-hours miss by less than this.
- **nMAE %** – MAE relative to mean wind output; comparable across periods.
