# TeleSol — Predictive Telecom Congestion Intelligence

Real-time crowd monitoring and telecom congestion prediction using ESP32 sensors.

## Architecture
```
ESP32 Sensor Hub ──┐
                   ├──► FastAPI Backend ──► React Dashboard
ESP32-CAM Node ────┘        (CRS Engine)       (NOC View)
```

## Structure
| Folder | Description |
|--------|-------------|
| `firmware/sensor_hub/` | ESP32 DevKit — radar, ToF, mic, IMU, OLED |
| `firmware/camera_node/` | ESP32-CAM — person counting via frame differencing |
| `backend/` | FastAPI + WebSocket — sensor ingestion, CRS calculation, alerts |
| `frontend/` | React + Vite + TailwindCSS — NOC dashboard with live map |
| `docs/` | API reference, wiring diagrams |

## CRS Formula
```
CRS = 0.35×DeviceDemand + 0.25×GrowthRate + 0.30×NetworkUtil + 0.10×TemporalFactor
```
**Levels:** Normal (0–40) → Elevated (41–60) → High (61–80) → Critical (81–100)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### ESP32 Firmware
1. Edit `config.h` in each firmware folder — set WiFi and backend URL
2. Flash using Arduino IDE with ESP32 board support

## Theme
- Dark mode (#0D1117)
- Cyan, green, orange accents
- Monospace for sensor values
