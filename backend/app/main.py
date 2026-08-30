import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ============================================================
# API ROUTERS
# ============================================================

from app.api.v1.automation import router as automation_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.detect import router as detect_router
from app.api.v1.detections import router as detections_router
from app.api.v1.device_channels import router as device_channels_router
from app.api.v1.device_claims import router as device_claims_router
from app.api.v1.devices import router as device_router
from app.api.v1.firmware import router as firmware_router
from app.api.v1.homes import router as homes_router
from app.api.v1.rooms import router as rooms_router
from app.api.v1.schedules import router as schedules_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.websocket import router as websocket_router

# ============================================================
# AUTH
# ============================================================

from app.auth.router import router as auth_router

# ============================================================
# DATABASE
# ============================================================

from app.database.init_db import init_db


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Human Guard AI",
    version="1.0.0",
)


# ============================================================
# DYNAMIC CORS CONFIGURATION
# Allows Localhost + Vercel Production Deployments
# ============================================================

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins_list = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

origins = default_origins + allowed_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ENVIRONMENT") != "production" else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STATIC FILES (UPLOADS & OTA FIRMWARE)
# ============================================================

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS_DIR),
    name="uploads",
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Human Guard AI Server is Running",
        "version": "1.0.0",
    }


# ============================================================
# CORE API ROUTERS
# ============================================================

app.include_router(
    detect_router,
    prefix="/api/v1",
)

app.include_router(
    device_router,
    prefix="/api/v1",
)

app.include_router(
    detections_router,
    prefix="/api/v1",
)

app.include_router(
    dashboard_router,
    prefix="/api/v1",
)


# ============================================================
# AUTH ROUTER
# ============================================================

app.include_router(
    auth_router,
)


# ============================================================
# V1 API ROUTERS
# ============================================================

V1_ROUTERS = (
    automation_router,
    schedules_router,
    homes_router,
    rooms_router,
    telemetry_router,
    device_channels_router,
    firmware_router,
    websocket_router,
    device_claims_router,
)

for router in V1_ROUTERS:
    app.include_router(
        router,
        prefix="/api/v1",
    )


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():
    """
    Initialize database models/schema on application startup.
    """
    init_db()