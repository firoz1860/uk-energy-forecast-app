import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routes import router
from utils.constants import CORS_ORIGINS

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="UK Wind Forecast Accuracy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True if CORS_ORIGINS != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "UK Wind Forecast Accuracy API is running",
        "docs": "/docs",
        "health": "/api/health",
    }


