from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.devices import router as device_router
from app.api.v1.dashboard import router as dashboard_router
from app.auth.router import router as auth_router
from app.database.database import create_db_and_tables
from app.database.init_db import init_db


app = FastAPI(
    title="Human Tech Smart Pump",
    version="1.0.0",
    description="Smart Pump Automation Backend",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Human Tech Smart Pump Server is Running",
        "version": "1.0.0",
    }


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(
    device_router,
    prefix="/api/v1",
)

app.include_router(
    dashboard_router,
    prefix="/api/v1",
)

app.include_router(
    auth_router,
)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():
    create_db_and_tables()
    init_db()