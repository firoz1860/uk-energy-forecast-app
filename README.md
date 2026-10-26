# UK Wind Generation Forecast vs Actuals (January 2026)

A production-grade web application tailored for UK wholesale electricity traders. It visualizes and quantitatively evaluates National Grid ESO wind power forecasts against actual outturn generation from the **Elexon BMRS API** (`FUELHH` actuals and `WINDFOR` forecasts) strictly considering information available at the **Day-Ahead trading decision gate**.

---

## 🔗 Live Application Links

- **Frontend (Vercel)**: [https://uk-energy-forecast-app.vercel.app](https://uk-energy-forecast-app.vercel.app) *(Placeholder)*
- **Backend API (Render / Heroku)**: [https://uk-energy-forecast-api.onrender.com](https://uk-energy-forecast-api.onrender.com) *(Placeholder)*
- **Interactive Swagger Documentation**: [https://uk-energy-forecast-api.onrender.com/docs](https://uk-energy-forecast-api.onrender.com/docs) *(Placeholder)*

---

## ⚡ Problem Setting & Domain Mechanics

### 1. Day-Ahead Electricity Market Gate Closure
UK electricity suppliers must balance their positions for every 30-minute settlement period across each delivery day $D$.
- In the UK Day-Ahead wholesale market, major auction order books close on the morning of day $D-1$:
  - **EPEX SPOT GB Day-Ahead Auction**: Closes at **09:20 UK time** on $D-1$.
  - **Nord Pool (N2EX) Day-Ahead Auction**: Closes at **09:50 UK time** on $D-1$.
- Power traders finalize residual purchase volumes (thermal power required to cover renewable deficits) between **08:30 and 09:15 UK time** on $D-1$.
- This application establishes an empirical, configurable decision cutoff at **09:00 UK time** (`Europe/London`) on day $D-1$.

### 2. Eliminating Lookahead / Hindsight Leakage
For any target settlement period $T$ (`startTime`):
$$\text{Cutoff}(T) = (\text{Date}(T) - 1\text{ day}) \text{ at } 09:00:00 \text{ Europe/London}$$
- A forecast is only eligible if its generation timestamp was issued at:
  $$\text{publishTime} \le \text{Cutoff}(T)$$
- For each target $T$, the system selects the **latest published forecast** before the cutoff, completely preventing lookahead bias.
- `FUELHH` (30-minute meter actuals) and `WINDFOR` (hourly Day-Ahead forecast averages) are merged on target delivery intervals.

---

## 📊 Quantitative Error Metrics for Trading Desks

$$\text{Error}_i = \text{Forecast}_i - \text{Actual}_i$$

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |\text{Forecast}_i - \text{Actual}_i|$$
   - Measures average magnitude of volume mismatch in MW. Directly translates into volume risk and required reserve procurement.
2. **Root Mean Square Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i)^2}$$
   - Penalizes severe blowouts exponentially. Essential because UK cash-out imbalance prices spike non-linearly during grid stress.
3. **Forecast Bias**:
   $$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i)$$
   - Positive bias indicates over-forecasting wind (leaving the utility short, exposed to high System Buy Prices). Negative bias indicates under-forecasting (surplus power dumped at low or negative prices).
4. **P95 Absolute Error**:
   - The 95th percentile of absolute error. Defines the empirical reserve margin required to hedge 95% of operational half-hours.
5. **Normalized MAE (nMAE %)**:
   $$\text{nMAE} = \frac{\text{MAE}}{\text{Mean Actual}} \times 100$$
   - Contextualizes accuracy relative to overall wind availability.

---

## 📂 Repository Structure

```text
uk-energy-forecast-app/
├── backend/
│   ├── api/
│   │   └── routes.py             # FastAPI routes (/api/wind, /api/health)
│   ├── models/
│   │   └── schemas.py            # Pydantic validation schemas
│   ├── services/
│   │   ├── elexon_client.py      # Elexon BMRS stream fetching (chunked, retries, caching)
│   │   └── data_processor.py     # Pandas D-1 alignment, cutoff filtering, error metrics
│   ├── tests/
│   │   ├── test_data_processor.py # Pytest unit tests verifying alignment logic & metrics
│   │   ├── test_elexon_client.py  # Chunk-grid + cache-reuse tests (Elexon mocked)
│   │   └── test_routes.py         # API tests: validation, null handling, 502 path
│   ├── utils/
│   │   └── constants.py          # Market timezones, cutoff hours, Elexon endpoints, CORS
│   ├── .dockerignore             # Keeps .venv / caches out of the image
│   ├── .env                      # Backend local environment config
│   ├── Dockerfile                # Multi-stage/slim container configuration
│   ├── main.py                   # FastAPI initialization with CORS middleware
│   ├── pytest.ini                # Pytest configuration
│   ├── requirements.txt          # Python runtime dependencies
│   └── requirements-dev.txt      # + pytest, httpx (for running the tests)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DataTable.jsx     # Collapsible settlement breakdown table + CSV export
│   │   │   ├── DateSelector.jsx  # Interactive calendar range picker (hover preview, keyboard)
│   │   │   ├── MetricCards.jsx   # Quantitative KPI cards with tooltips & status badges
│   │   │   └── WindChart.jsx     # Recharts time-series visualization with brush & fullscreen
│   │   ├── services/
│   │   │   └── api.js            # Axios client with base URL & timeout configuration
│   │   ├── styles/
│   │   │   ├── index.css         # Modern design tokens, @layer cascade, glassmorphism
│   │   │   └── extras.css        # Theme toggle, scroll progress, chip presets, skeletons
│   │   ├── utils/
│   │   │   └── formatters.js     # Date/time, MW, and percentage formatting helpers
│   │   ├── App.jsx               # Main React dashboard component
│   │   └── main.jsx              # Application entry point
│   ├── public/
│   │   └── favicon.svg           # App icon
│   ├── .dockerignore             # Keeps host node_modules out of the Linux image
│   ├── .env                      # Frontend environment variables
│   ├── Dockerfile                # Node 20 alpine container build
│   ├── index.html                # HTML template
│   ├── package.json              # React, Recharts, Axios dependencies
│   ├── vercel.json               # Vercel deployment rewrite rules
│   └── vite.config.js            # Vite configuration with 0.0.0.0 host binding
├── docs/
│   ├── DOMAIN_NOTES.md           # In-depth UK electricity market documentation
│   └── VIDEO_SCRIPTS.md          # 5-minute client pitch & 5-minute tech lead walkthrough
├── docker-compose.yml            # Multi-container orchestration (backend + frontend)
├── render.yaml                   # Infrastructure as code blueprint for Render
├── .gitignore                    # Git exclusions
└── README.md                     # Comprehensive project documentation
```

---

## 🚀 Running the Application Locally

### Option 1: Using Docker Compose (Recommended)

Ensure Docker Desktop is running, then execute:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Running Without Docker

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt

# Run the API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 🧪 Testing & Verification

Run the backend unit test suite:
```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/
```
The tests validate:
1. Exact selection of the latest forecast before the D-1 09:00 UK cutoff.
2. Complete rejection of intraday forecasts published on the day of delivery.
3. Accurate computation of MAE, RMSE, Bias, and P95 error margins.
4. Elexon fetching: non-WIND rows dropped, fixed 3-day chunk grid, and cache reuse across overlapping date windows.
5. API behaviour: date validation (400), empty/missing data serialised as `null`, upstream failure mapped to 502.

Verify the frontend production build:
```bash
cd frontend
npm run build
```

---

## ☁️ Deployment Guidelines

### Backend (Render / Heroku)
- **Runtime**: Docker or Python 3.12.
- **Root Directory**: `backend/`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `CORS_ORIGINS`: Set to your deployed Vercel domain (e.g. `https://uk-energy-forecast-app.vercel.app`).
  - `DECISION_HOUR`: `9`
  - `DECISION_MINUTE`: `0`

### Frontend (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `frontend/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Set to your deployed backend URL (e.g. `https://uk-energy-forecast-api.onrender.com`).

---

## 🤖 AI Tools Usage Declaration

In compliance with the assessment guidelines, artificial intelligence tools (**Claude** by Anthropic and **Gemini** by Google DeepMind) were utilized as pair-programming assistants to support:
1. Deep-dive research into Elexon BMRS API endpoint specs and UK market settlement conventions.
2. Architecture scaffolding and containerization configurations.
3. Vectorized Pandas time-alignment logic and responsive CSS styling.

All code, algorithmic alignment logic, and domain reasoning were thoroughly reviewed, tested, and validated with live Elexon data.
