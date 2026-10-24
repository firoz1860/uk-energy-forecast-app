# 10-Minute Video Presentation Guide

This document contains structured, high-impact presentation scripts for the two-part submission video.

---

# Part 1: Business Client Pitch (≤ 5 Minutes)
**Target Audience**: Head of Power Trading & Portfolio Risk Managers at a UK Energy Utility.  
**Tone**: Confident, commercial, data-driven, value-oriented.

---

### [00:00 - 01:00] The Core Business Problem
- **Opening**:  
  *"Good morning. As power traders in the UK wholesale market, you face a daily multi-million-pound challenge: deciding how much thermal electricity to buy on the day-ahead auction to cover the volatile gap left by wind generation."*
- **The Operational Reality**:  
  *"Every morning around 09:00, before the EPEX SPOT (09:20) and Nord Pool (09:50) auction gate closures, your trading desk must commit to purchase orders for tomorrow’s 48 settlement periods. If wind underperforms, you are caught short in the Balancing Mechanism and forced to pay punishing cashout imbalance prices. If wind overperforms, you dump excess thermal power at distressed prices."*
- **The Question**:  
  *"How do you know what safety buffer to buy? In the past, traders relied on gut instinct or post-hoc accuracy reports that leaked intraday data. Today, we are proud to present our solution: the **UK Wind Forecast Accuracy Portal**."*

---

### [01:00 - 02:30] Live Product Walkthrough
- **Demonstrating the Timeline Alignment**:  
  *"Let's look at January 2026. Notice our decision rule right at the top:*  
  `Latest WINDFOR forecast published <= 09:00 UK time on the day before delivery`.*"  
- **Visualizing the Market Gap**:  
  *"On this interactive Recharts visualization, the teal curve represents actual wind generation from Elexon's `FUELHH` stream. The orange curve is the forecast your trader held at 09:00 AM on $D-1$."*
  *"Notice that this is not an idealized hindcast. This is the **actual forecast available at the decision gate**. By panning and zooming the range brush or clicking through our weekly presets, your desk can pinpoint exact meteorological frontal passages where the forecast broke down."*

---

### [02:30 - 04:00] Translating Metrics into Trading Value
- **MAE (Mean Absolute Error)**:  
  *"Our portal computes an MAE of ~2,193 MW for Week 1. In trading terms, each megawatt over a half-hour represents 0.5 MWh. Your desk knows immediately that across an average delivery window, you must manage roughly ~1,100 MWh of volume risk."*
- **Bias (Directional Risk)**:  
  *"Look at the positive bias card (+1,956 MW). The day-ahead forecast was systematically over-forecasting wind. For your utility, that translates into an immediate actionable rule: **you cannot afford to run lean on thermal procurement**, because the forecast has a persistent upward bias that leaves you vulnerable to short-position imbalance penalties."*
- **P95 Absolute Error (Empirical Reserve Buffer)**:  
  *"Instead of arguing over arbitrary safety margins, your risk committee can point to the P95 metric (4,376 MW). Holding this empirical buffer guarantees that 95% of volatile swings are covered before gate closure."*

---

### [04:00 - 05:00] Risk Mitigation, ROI & Next Steps
- **Trust & Compliance**:  
  *"The system connects directly to Elexon BMRS—the industry source of truth. No third-party black boxes, no lookahead bias."*
- **Summary**:  
  *"This tool turns renewable uncertainty from an operational liability into a quantified, tradeable advantage. Thank you, and we look forward to rolling this out across your trading floor."*

---

# Part 2: Tech Lead Code & Architecture Review (≤ 5 Minutes)
**Target Audience**: Principal Software Engineer / Tech Lead reviewing system architecture and code.  
**Tone**: Technical, precise, clean code, architectural rigor.

---

### [05:00 - 06:00] Architecture & Tech Stack
- **System Topology**:  
  *"Hi everyone. Let's walk through the architecture. The application is organized as a lightweight, production-ready monorepo:*  
  - *Frontend: React 18 with Vite, modular CSS (`@layer` design tokens and glassmorphism), and Recharts for responsive time-series visualization.*  
  - *Backend: Python 3.12 with FastAPI, Pydantic v2 schemas, and Pandas for vectorized time-alignment.*  
  - *Infrastructure: Fully containerized with Docker and `docker-compose.yml`, structured for deployment on Vercel and Render/Heroku."*
- **Environment & Portability**:  
  *"Both containers bind explicitly to 0.0.0.0. The backend honors `$PORT` dynamically for cloud runtimes, with zero-hardcoding and flexible CORS origin handling."*

---

### [06:00 - 07:15] The Data Alignment Engine (`data_processor.py`)
- **Lookahead Bias Prevention**:  
  *"Let's look at `backend/services/data_processor.py`. The most critical technical challenge was aligning `startTime` with `publishTime` without lookahead leakage.*  
  ```python
  def decision_cutoff(target_times: pd.Series) -> pd.Series:
      local_naive = target_times.dt.tz_convert('Europe/London').dt.tz_localize(None)
      cutoff_naive = (local_naive.dt.normalize() - pd.Timedelta(days=1)
                      + pd.Timedelta(hours=9, minutes=0))
      return cutoff_naive.dt.tz_localize('Europe/London', nonexistent='shift_forward',
                                         ambiguous='NaT').dt.tz_convert('UTC')
  ```  
  *We localize the target delivery timestamp into `Europe/London`, subtract 1 calendar day, fix the time to 09:00:00, and convert back to UTC. This makes the logic daylight-saving proof across GMT and BST transitions."*
- **Vectorized Merging**:  
  *"We filter `publishTime <= cutoff`, group by `startTime`, take `.tail(1)` for the most recent publish, and outer-join onto `FUELHH` actuals. This maintains $O(N \log N)$ performance over hundreds of thousands of rows."*

---

### [07:15 - 08:30] Elexon Client & API Engineering
- **Chunked Ingestion & Resilience**:  
  *"In `elexon_client.py`, Elexon BMRS stream endpoints can timeout if querying month-long ranges in a single call. We implemented a chunking iterator (`CHUNK_DAYS = 3`) paired with exponential backoff retries and in-memory tuple caching (`_cache`)."*
- **Resolution Handling**:  
  *"`FUELHH` publishes at 30-minute intervals, while `WINDFOR` publishes hourly average generation. Our frontend uses `connectNulls` on SVG curves, while `data_processor.compute_metrics` rigorously drops null pairs before applying vector numpy calculations."*

---

### [08:30 - 09:30] Frontend Engineering & Modern CSS
- **Design System**:  
  *"On the frontend, all styles are structured via modern `@layer` cascade rules (`reset, tokens, base, layout, components, charts, states, extras`). We utilized container queries (`@container`) so individual KPI cards dynamically re-flow when the viewport shrinks."*
- **Performance & A11y**:  
  *"The UI supports native light/dark modes with `prefers-color-scheme` and manual override, keyboard focus rings (`:focus-visible`), and a complete print stylesheet that automatically hides interactive chrome for physical reporting."*

---

### [09:30 - 10:00] Verification & Delivery
- **Unit Testing**:  
  *"We validated our business logic using `pytest backend/tests/test_data_processor.py`. All tests verify that same-day forecasts are rejected and boundary metrics are exact."*
- **Production Build**:  
  *"The frontend builds cleanly via Vite with zero warnings. Both Docker containers run locally via `docker compose up --build`. The code is clean, documented, and ready for production deployment."*
