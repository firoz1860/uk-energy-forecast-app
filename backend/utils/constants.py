import os
from dotenv import load_dotenv

load_dotenv()

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_STREAM = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_STREAM = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

MARKET_TZ = "Europe/London"
DECISION_HOUR = int(os.getenv("DECISION_HOUR", "9"))
DECISION_MINUTE = int(os.getenv("DECISION_MINUTE", "0"))

MIN_DATE = os.getenv("MIN_DATE", "2024-01-01")
MAX_DATE = os.getenv("MAX_DATE", "")
MAX_RANGE_DAYS = int(os.getenv("MAX_RANGE_DAYS", "31"))

DEFAULT_START = "2026-01-01"
DEFAULT_END = "2026-01-31"

CHUNK_DAYS = 3         
HTTP_TIMEOUT = 60

raw_origins = os.getenv("CORS_ORIGINS", "*")
if raw_origins.strip() == "*":
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]
    for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
        if local_origin not in CORS_ORIGINS:
            CORS_ORIGINS.append(local_origin)

