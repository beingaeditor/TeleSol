"""Companion web app routes — serves the iPhone web companion page + WebSocket for phone streaming."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pathlib import Path
from datetime import datetime, timezone
from app.services.data_store import store
import json
import asyncio

router = APIRouter()


# ── Serve companion HTML page ────────────────────────────────

@router.get("/companion", response_class=HTMLResponse)
async def companion_page():
    """Serve the web companion page (opens in Safari on iPhone)."""
    html_path = Path(__file__).parent.parent.parent / "static" / "companion.html"
    if not html_path.exists():
        return HTMLResponse("<h1>companion.html not found</h1>", status_code=404)
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


# ── WebSocket for phone companion streaming ──────────────────

@router.websocket("/ws/phone")
async def phone_websocket(websocket: WebSocket):
    """WebSocket endpoint for the iPhone web companion.

    Receives:
      - { type: "register", deviceName, osType, osVersion }
      - { type: "frame", data: "<base64 JPEG>", personCount, noiseDb, timestamp }
      - { type: "sensors", personCount, motionDetected, noiseDb, peakDb, isCrowdNoise,
                           gpsLatitude, gpsLongitude, gpsAccuracy, timestamp }
    Sends:
      - { type: "crs_update", crs, level }  after each sensor update
    """
    await websocket.accept()
    device_id = f"web-{id(websocket)}"
    print(f"[Companion WS] Phone connected: {device_id}")

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type", "")

            if msg_type == "register":
                # Register the web companion as a mobile device
                store.register_mobile(
                    device_id=device_id,
                    device_name=msg.get("deviceName", "Web Companion"),
                    os_type="web",
                    os_version=msg.get("osVersion", "Safari"),
                    app_version="web-1.0.0",
                )
                print(f"[Companion WS] Registered: {msg.get('deviceName')}")

            elif msg_type == "frame":
                # Store the latest video frame + person count + noise
                frame_b64 = msg.get("data", "")
                person_count = msg.get("personCount", 0)
                noise_db = msg.get("noiseDb", 0)

                store.update_phone_frame(
                    frame_b64=frame_b64,
                    person_count=person_count,
                    noise_db=noise_db,
                )

                # Broadcast frame to dashboard WebSocket clients
                try:
                    asyncio.create_task(store.broadcast({
                        "type": "phone_frame",
                        "frame": frame_b64,
                        "personCount": person_count,
                        "noiseDb": noise_db,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }))
                except Exception:
                    pass

            elif msg_type == "sensors":
                # Full sensor data update from phone
                store.update_mobile(
                    device_id=device_id,
                    noise_db=msg.get("noiseDb", 0),
                    peak_amplitude=msg.get("peakDb", 0),
                    is_crowd_noise=msg.get("isCrowdNoise", False),
                    person_count=msg.get("personCount", 0),
                    motion_detected=msg.get("motionDetected", False),
                    gps_lat=msg.get("gpsLatitude"),
                    gps_lng=msg.get("gpsLongitude"),
                    gps_accuracy=msg.get("gpsAccuracy"),
                    battery_level=None,
                )

                # Broadcast updated dashboard data
                try:
                    asyncio.create_task(store.broadcast({
                        "type": "mobile_update",
                        "data": store.get_dashboard_all(),
                    }))
                except Exception:
                    pass

                # Send CRS feedback to the phone
                try:
                    await websocket.send_json({
                        "type": "crs_update",
                        "crs": round(store.latest_crs, 1),
                        "level": store.latest_level,
                    })
                except Exception:
                    pass

    except WebSocketDisconnect:
        print(f"[Companion WS] Phone disconnected: {device_id}")
        store.disconnect_mobile(device_id)
    except Exception as e:
        print(f"[Companion WS] Error: {e}")
        store.disconnect_mobile(device_id)
