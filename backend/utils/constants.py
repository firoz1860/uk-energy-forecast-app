import os
from dotenv import load_dotenv

load_dotenv()

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_STREAM = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_STREAM = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

MARKET_TZ = "Europe/London"
# Day-ahead gate closure assumption (local UK time, on day D-1).
# EPEX GB auction closes ~09:20, N2EX ~09:50 -> 09:00 is a safe "what was known" cutoff.
DECISION_HOUR = int(os.getenv("DECISION_HOUR", "9"))
DECISION_MINUTE = int(os.getenv("DECISION_MINUTE", "0"))

# Scope of the assessment: purchase decisions for deliveries in January 2026
MIN_DATE = "2026-01-01"
MAX_DATE = "2026-01-31"

CHUNK_DAYS = 3          # keep each Elexon stream call small
HTTP_TIMEOUT = 60

# Robust CORS configuration
raw_origins = os.getenv("CORS_ORIGINS", "*")
if raw_origins.strip() == "*":
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]
    for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
        if local_origin not in CORS_ORIGINS:
            CORS_ORIGINS.append(local_origin)

