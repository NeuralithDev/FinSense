"""
FinSense: Forecast-Grounded Personal Finance Intelligence Platform.
FastAPI Application Entrypoint.
"""

from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.model_registry import ModelRegistry

# Import Routers
from app.api.health_score import router as health_score_router
from app.api.forecast import router as forecast_router
from app.api.subscriptions import router as subscriptions_router
from app.api.autopilot import router as autopilot_router
from app.api.scenarios import router as scenarios_router
from app.api.recommendations import router as recommendations_router
from app.api.twins import router as twins_router
from app.api.ingestion import router as ingestion_router
from app.api.assistant import router as assistant_router
from app.api.anomalies import router as anomalies_router
from app.api.graph import router as graph_router
from app.api.features import router as features_router


APP_START_TIME = datetime.now()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up model registry
    ModelRegistry.get_instance()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="FinSense API",
    description="A forecast-grounded personal financial health copilot designed to outperform rear-view trackers like Rocket Money.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for modern React / Vite frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_score_router)
app.include_router(forecast_router)
app.include_router(subscriptions_router)
app.include_router(autopilot_router)
app.include_router(scenarios_router)
app.include_router(recommendations_router)
app.include_router(twins_router)
app.include_router(ingestion_router)
app.include_router(assistant_router)
app.include_router(anomalies_router)
app.include_router(graph_router)
app.include_router(features_router)

# Mount Frontend Dashboard if built
from fastapi.staticfiles import StaticFiles
from pathlib import Path
_frontend_dist = Path(__file__).resolve().parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/dashboard", StaticFiles(directory=str(_frontend_dist), html=True), name="dashboard")


@app.get("/")
def root():
    """Root metadata endpoint."""
    return {
        "platform": "FinSense",
        "tagline": "Forecast-Grounded Financial Copilot",
        "positioning": "Forward-looking intelligence answering: What will happen? Can I afford it? What should I do next?",
        "version": "1.0.0",
        "documentation": "/docs",
        "openapi_spec": "/openapi.json"
    }


@app.get("/health")
def health_check():
    """System health check & active models verification."""
    registry = ModelRegistry.get_instance()
    uptime_seconds = (datetime.now() - APP_START_TIME).total_seconds()
    return {
        "status": "healthy",
        "uptime_seconds": round(uptime_seconds, 1),
        "registry": registry.get_status()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
