import asyncio
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
# AUTH & CORE
# ============================================================

from app.auth.router import router as auth_router
from app.core.mqtt import set_main_event_loop, start_mqtt, stop_mqtt
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
# ============================================================

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins_list = [
    origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()
]

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
# ROUTERS
# ============================================================

app.include_router(
    auth_router,
)

V1_ROUTERS = (
    detect_router,
    device_router,
    detections_router,
    dashboard_router,
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
# LIFECYCLE EVENTS
# ============================================================

@app.on_event("startup")
async def startup() -> None:
    """Initialize database schema, event loop reference, and MQTT client."""
    init_db()
    set_main_event_loop(asyncio.get_running_loop())
    start_mqtt()


@app.on_event("shutdown")
def shutdown() -> None:
    """Stop MQTT background client cleanly."""
    stop_mqtt()