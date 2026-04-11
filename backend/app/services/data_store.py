"""In-memory data store for sensor readings + mobile phone data. Shared across routers."""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import asyncio


class MobileDevice:
    """Tracks a connected mobile companion device."""

    def __init__(self, device_id: str, device_name: str, os_type: str, os_version: str, app_version: str):
        self.device_id = device_id
        self.device_name = device_name
        self.os_type = os_type
        self.os_version = os_version
        self.app_version = app_version
        self.connected = True
        self.registered_at = datetime.now(timezone.utc).isoformat()
        self.last_stream = None

        # Latest sensor data from phone
        self.noise_db = 0.0
        self.peak_amplitude = 0.0
        self.is_crowd_noise = False
        self.person_count = 0
        self.motion_detected = False
        self.gps_lat = None
        self.gps_lng = None
        self.gps_accuracy = None
        self.battery_level = None
        self.stream_count = 0


class DataStore:
    """Simple in-memory store for the latest sensor data, CRS history, and mobile data."""

    def __init__(self):
        # ESP sensor data
        self.latest_reading: Optional[Dict[str, Any]] = None
        self.latest_processed: Optional[Dict[str, Any]] = None
        self.latest_crs: float = 0.0
        self.latest_level: str = "normal"
        self.latest_alert: Optional[Dict[str, Any]] = None
        self.node_id: str = "sensor_hub_001"
        self.last_update: Optional[str] = None
        self.crs_history: List[Dict[str, Any]] = []
        self.reading_count: int = 0
        self._ws_clients: List[Any] = []

        # Mobile companion devices
        self.mobile_devices: Dict[str, MobileDevice] = {}

        # Phone video/audio frame data (for live feed)
        self.latest_video_frame: Optional[str] = None  # base64 JPEG
        self.latest_phone_person_count: int = 0
        self.latest_phone_noise_db: float = 0.0
        self.phone_frame_timestamp: Optional[str] = None

    # ── ESP Sensor Updates ───────────────────────────────────

    def update(self, raw_payload: Dict, processed: Dict, crs: float, level: str, alert: Dict, node_id: str):
        """Store the latest ESP sensor reading."""
        self.latest_reading = raw_payload
        self.latest_processed = processed
        self.latest_crs = crs
        self.latest_level = level
        self.latest_alert = alert
        self.node_id = node_id
        self.last_update = datetime.now(timezone.utc).isoformat()
        self.reading_count += 1

        # Fuse with mobile data if available
        self._fuse_with_mobile(processed)

        # Recalculate CRS with fused data
        self._recalculate_fused_crs()

        # Keep last 50 CRS readings for history
        self.crs_history.append({
            "crs": round(self.latest_crs, 1),
            "level": self.latest_level,
            "timestamp": self.last_update,
        })
        if len(self.crs_history) > 50:
            self.crs_history = self.crs_history[-50:]

    # ── Mobile Phone Updates ─────────────────────────────────

    def register_mobile(self, device_id: str, device_name: str, os_type: str, os_version: str, app_version: str):
        """Register a mobile companion device."""
        self.mobile_devices[device_id] = MobileDevice(
            device_id=device_id,
            device_name=device_name,
            os_type=os_type,
            os_version=os_version,
            app_version=app_version,
        )

    def update_mobile(self, device_id: str, noise_db: float, peak_amplitude: float,
                      is_crowd_noise: bool, person_count: int, motion_detected: bool,
                      gps_lat: Optional[float], gps_lng: Optional[float],
                      gps_accuracy: Optional[float], battery_level: Optional[int]):
        """Update mobile device sensor data."""
        dev = self.mobile_devices.get(device_id)
        if not dev:
            # Auto-register unknown device
            dev = MobileDevice(device_id, "Unknown", "unknown", "unknown", "1.0.0")
            self.mobile_devices[device_id] = dev

        dev.connected = True
        dev.last_stream = datetime.now(timezone.utc).isoformat()
        dev.noise_db = noise_db
        dev.peak_amplitude = peak_amplitude
        dev.is_crowd_noise = is_crowd_noise
        dev.person_count = person_count
        dev.motion_detected = motion_detected
        dev.gps_lat = gps_lat
        dev.gps_lng = gps_lng
        dev.gps_accuracy = gps_accuracy
        dev.battery_level = battery_level
        dev.stream_count += 1

        # Recalculate fused CRS
        self._recalculate_fused_crs()

    def update_phone_frame(self, frame_b64: str, person_count: int, noise_db: float):
        """Store the latest video frame from the phone companion."""
        self.latest_video_frame = frame_b64
        self.latest_phone_person_count = person_count
        self.latest_phone_noise_db = noise_db
        self.phone_frame_timestamp = datetime.now(timezone.utc).isoformat()

    def disconnect_mobile(self, device_id: str):
        """Mark a mobile device as disconnected."""
        dev = self.mobile_devices.get(device_id)
        if dev:
            dev.connected = False

    def get_mobile_status(self) -> Dict[str, Any]:
        """Return status of all connected mobile devices."""
        devices = []
        for dev in self.mobile_devices.values():
            devices.append({
                "device_id": dev.device_id,
                "device_name": dev.device_name,
                "os_type": dev.os_type,
                "os_version": dev.os_version,
                "connected": dev.connected,
                "last_stream": dev.last_stream,
                "noise_db": dev.noise_db,
                "person_count": dev.person_count,
                "gps": {"lat": dev.gps_lat, "lng": dev.gps_lng, "accuracy": dev.gps_accuracy}
                       if dev.gps_lat is not None else None,
                "battery": dev.battery_level,
                "stream_count": dev.stream_count,
            })
        return {
            "connected_count": sum(1 for d in self.mobile_devices.values() if d.connected),
            "total_registered": len(self.mobile_devices),
            "devices": devices,
        }

    def _get_best_mobile(self) -> Optional[MobileDevice]:
        """Return the best connected mobile device (most recent stream)."""
        connected = [d for d in self.mobile_devices.values() if d.connected and d.last_stream]
        if not connected:
            return None
        return max(connected, key=lambda d: d.last_stream)

    def _fuse_with_mobile(self, processed: Dict):
        """Fuse ESP sensor data with mobile phone data."""
        phone = self._get_best_mobile()
        if not phone:
            return

        # Override camera count with phone data if phone has higher count
        esp_humans = processed.get("estimatedHumans", 0)
        if phone.person_count > 0:
            processed["estimatedHumans"] = max(esp_humans, phone.person_count)

        # Add phone noise data to the mix
        if phone.noise_db > 0:
            processed["phoneNoiseDB"] = phone.noise_db

    def _recalculate_fused_crs(self):
        """Recalculate CRS score using fused ESP + mobile data."""
        from app.services.crs_calculator import CRSCalculator

        p = self.latest_processed or {}
        phone = self._get_best_mobile()

        # Device demand
        device_pct = float(p.get("deviceDemandRatio", 0.0)) * 100.0

        # Growth rate
        growth_pct = float(p.get("growthRatePct", 0.0))

        # Network utilization — use phone noise if available
        network_pct = float(p.get("networkUtilPct", 0.0))
        if phone and phone.noise_db > 0:
            noise_util = min(phone.noise_db / 80.0, 1.0) * 100.0
            network_pct = max(network_pct, noise_util)

        # Temporal
        temporal_pct = float(p.get("temporalFactorPct", 0.0))

        self.latest_crs = CRSCalculator.calculate(device_pct, growth_pct, network_pct, temporal_pct)
        self.latest_level = CRSCalculator.get_level(self.latest_crs)

    # ── Dashboard Queries ────────────────────────────────────

    def get_stats(self) -> Dict[str, Any]:
        """Return aggregated stats for dashboard."""
        p = self.latest_processed or {}
        phone = self._get_best_mobile()
        return {
            "totalNodes": 1,
            "activeNodes": 1 if self.last_update else 0,
            "activeDevices": max(1, p.get("estimatedHumans", 0)) + 2,
            "networkUtil": round(p.get("networkUtilPct", 0), 1),
            "riskScore": round(self.latest_crs, 1),
            "energySaved": 0.0,
            "activeAlerts": 1 if self.latest_crs > 40 else 0,
            "lastUpdate": self.last_update,
            "readingCount": self.reading_count,
            "phoneConnected": phone is not None and phone.connected,
            "phoneOS": phone.os_type if phone else None,
        }

    def get_sensor_health(self) -> Dict[str, Any]:
        """Return sensor health status."""
        sensors = {}
        if self.latest_reading:
            raw = self.latest_reading.get("sensors", {})
            sensors["radar"] = "active" if isinstance(raw.get("radar"), dict) else "offline"
            sensors["tof"] = "active" if isinstance(raw.get("tof"), dict) else "offline"
            sensors["audio"] = "active" if isinstance(raw.get("audio"), dict) else "offline"
            sensors["imu"] = "active" if isinstance(raw.get("imu"), dict) else "offline"
            sensors["camera"] = "active" if isinstance(raw.get("camera"), dict) else "offline"
        else:
            sensors = {k: "offline" for k in ["radar", "tof", "audio", "imu", "camera"]}

        # Mobile phone as a sensor source — check both registered devices AND direct frame data
        phone = self._get_best_mobile()
        has_phone = phone and phone.connected
        has_frame = self.latest_video_frame is not None

        # Phone camera: active if companion is connected OR we have recent frames
        sensors["phone_camera"] = "active" if (has_phone or has_frame) else "offline"
        # Phone mic: active if we have noise data from companion
        sensors["phone_mic"] = "active" if (
            (has_phone and phone.noise_db > 0) or self.latest_phone_noise_db > 0
        ) else "offline"
        # Phone GPS: active if we have location data
        sensors["phone_gps"] = "active" if (has_phone and phone.gps_lat is not None) else "offline"

        sensors["lastUpdate"] = self.last_update or self.phone_frame_timestamp or "never"
        return sensors

    def get_live_data(self) -> Dict[str, Any]:
        """Return latest sensor readings — works even without ESP data."""
        phone = self._get_best_mobile()
        has_phone = phone and phone.connected
        has_frame = self.latest_video_frame is not None

        # ESP sensor data (may be None if ESP hasn't connected)
        raw = self.latest_reading.get("sensors", {}) if self.latest_reading else {}
        p = self.latest_processed or {}

        # Phone noise — prefer registered device data, fallback to frame data
        phone_noise = 0.0
        if has_phone and phone.noise_db > 0:
            phone_noise = phone.noise_db
        elif self.latest_phone_noise_db > 0:
            phone_noise = self.latest_phone_noise_db

        # Phone person count — prefer registered device, fallback to frame data
        phone_people = 0
        if has_phone and phone.person_count > 0:
            phone_people = phone.person_count
        elif self.latest_phone_person_count > 0:
            phone_people = self.latest_phone_person_count

        # Build response — always include phone data even without ESP
        return {
            "radarHumans": p.get("estimatedHumans", 0),
            "radarDistance": raw.get("radar", {}).get("distance_cm", 0),
            "radarEnergy": raw.get("radar", {}).get("energyLevel", 0),
            "noiseLevel": phone_noise if (has_phone or has_frame) else raw.get("audio", {}).get("noiseLevel_dB", 0),
            "isCrowdNoise": (phone.is_crowd_noise if has_phone else False) or raw.get("audio", {}).get("isCrowdNoise", False),
            "tofDistance": raw.get("tof", {}).get("distance_mm", 0),
            "tofPassageCount": raw.get("tof", {}).get("passageCount", 0),
            "vibration": raw.get("imu", {}).get("vibrationMagnitude", 0),
            "temperature": raw.get("imu", {}).get("temperature", 0),
            "cameraPeopleCount": phone_people if (has_phone or has_frame) else raw.get("camera", {}).get("personCount", 0),
            "motionDetected": (phone_people > 0) or raw.get("camera", {}).get("motionDetected", False),
            "crowdDensity": p.get("crowdDensity", 0),
            "lastUpdate": self.last_update or self.phone_frame_timestamp,
            "phoneConnected": has_phone or has_frame,
        }

    def get_crs_breakdown(self) -> Dict[str, Any]:
        """Return CRS calculation breakdown."""
        p = self.latest_processed or {}
        return {
            "crs": round(self.latest_crs, 1),
            "level": self.latest_level,
            "breakdown": {
                "deviceDemand": {"value": round(p.get("deviceDemandRatio", 0) * 100, 1), "weight": 0.35},
                "growthRate": {"value": round(p.get("growthRatePct", 0), 1), "weight": 0.25},
                "networkUtil": {"value": round(p.get("networkUtilPct", 0), 1), "weight": 0.30},
                "temporalFactor": {"value": round(p.get("temporalFactorPct", 0), 1), "weight": 0.10},
            },
            "history": self.crs_history[-10:],
        }

    def get_alerts(self) -> List[Dict[str, Any]]:
        """Return current alerts."""
        if not self.latest_alert:
            return []
        return [{
            "id": 1,
            "zone": f"Node {self.node_id}",
            "crs": round(self.latest_crs, 1),
            "severity": self.latest_alert.get("type", "normal"),
            "action": self.latest_alert.get("message", ""),
            "timestamp": self.last_update,
        }]

    def get_dashboard_all(self) -> Dict[str, Any]:
        """Return all dashboard data combined."""
        result = {
            "stats": self.get_stats(),
            "sensorHealth": self.get_sensor_health(),
            "liveData": self.get_live_data(),
            "crs": self.get_crs_breakdown(),
            "alerts": self.get_alerts(),
            "mobile": self.get_mobile_status(),
        }
        # Include phone live feed metadata (not the frame itself — that goes via phone_frame messages)
        result["phoneFeed"] = {
            "hasFrame": self.latest_video_frame is not None,
            "personCount": self.latest_phone_person_count,
            "noiseDb": self.latest_phone_noise_db,
            "lastFrameAt": self.phone_frame_timestamp,
        }
        return result

    # ── WebSocket Management ─────────────────────────────────

    async def add_ws_client(self, ws):
        self._ws_clients.append(ws)

    async def remove_ws_client(self, ws):
        if ws in self._ws_clients:
            self._ws_clients.remove(ws)

    async def broadcast(self, data: Dict):
        """Broadcast to all connected WebSocket clients."""
        disconnected = []
        for ws in self._ws_clients:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            await self.remove_ws_client(ws)


# Singleton instance
store = DataStore()
