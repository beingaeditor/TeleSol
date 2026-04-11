"""Mobile companion app API routes — iOS & Android phone integration."""
from fastapi import APIRouter, HTTPException
from typing import Any, Dict, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from app.services.data_store import store
import asyncio


router = APIRouter()


# ── Request Schemas ──────────────────────────────────────────

class MobileRegistration(BaseModel):
    """Phone registers with the backend on app launch."""
    device_id: str
    device_name: str
    os_type: str  # "ios" or "android"
    os_version: str
    app_version: str = "1.0.0"


class MobileStreamPayload(BaseModel):
    """Phone pushes sensor data (camera, mic, GPS) every few seconds."""
    device_id: str
    timestamp: int  # epoch millis
    noise_db: float = 0.0
    peak_amplitude: float = 0.0
    is_crowd_noise: bool = False
    person_count: int = 0
    motion_detected: bool = False
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    gps_accuracy: Optional[float] = None
    battery_level: Optional[int] = None


# ── Endpoints ────────────────────────────────────────────────

@router.post("/api/mobile/register")
async def register_mobile(payload: MobileRegistration):
    """Phone registers with backend — stores device info."""
    store.register_mobile(
        device_id=payload.device_id,
        device_name=payload.device_name,
        os_type=payload.os_type,
        os_version=payload.os_version,
        app_version=payload.app_version,
    )
    return {
        "status": "registered",
        "device_id": payload.device_id,
        "message": f"{payload.os_type.upper()} device registered successfully",
        "backend_version": "3.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/api/mobile/stream")
async def mobile_stream(payload: MobileStreamPayload):
    """Phone pushes camera/audio/GPS data to fuse with ESP sensor data."""
    try:
        store.update_mobile(
            device_id=payload.device_id,
            noise_db=payload.noise_db,
            peak_amplitude=payload.peak_amplitude,
            is_crowd_noise=payload.is_crowd_noise,
            person_count=payload.person_count,
            motion_detected=payload.motion_detected,
            gps_lat=payload.gps_latitude,
            gps_lng=payload.gps_longitude,
            gps_accuracy=payload.gps_accuracy,
            battery_level=payload.battery_level,
        )

        # Broadcast updated state to WebSocket clients
        try:
            asyncio.create_task(store.broadcast({
                "type": "mobile_update",
                "data": store.get_dashboard_all(),
            }))
        except Exception:
            pass

        return {
            "status": "received",
            "device_id": payload.device_id,
            "fused_crs": round(store.latest_crs, 1),
            "fused_level": store.latest_level,
            "esp_connected": store.last_update is not None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/mobile/status")
async def mobile_status():
    """Returns status of connected mobile devices."""
    return store.get_mobile_status()


@router.post("/api/mobile/disconnect")
async def disconnect_mobile(payload: dict):
    """Phone notifies backend on app close / background."""
    device_id = payload.get("device_id", "")
    store.disconnect_mobile(device_id)
    return {
        "status": "disconnected",
        "device_id": device_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
