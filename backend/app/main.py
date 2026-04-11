from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routers import sensors, dashboard, mobile, companion

app = FastAPI(title="TeleSol API", version="3.0.0")

# CORS - allow frontend dev server + mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router)
app.include_router(dashboard.router)
app.include_router(mobile.router)
app.include_router(companion.router)

# Mount static files (for companion assets if needed)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def root():
    return {
        "name": "TeleSol API",
        "version": "3.0.0",
        "status": "running",
        "platforms": ["esp12e", "ios", "android", "web-companion"],
        "companion_url": "/companion",
    }
