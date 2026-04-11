# TeleSol — Predictive Telecom Congestion Intelligence

Real-time crowd monitoring and telecom congestion prediction using ESP-12E sensors + iOS/Android companion apps.

## Architecture (v3.0)
```
ESP-12E Sensor Hub ──┐
  • HLK-LD2420 Radar  │
  • VL53L0X ToF       ├──► FastAPI Backend ──► React Dashboard
  • MPU6050 IMU       │     (CRS Engine)       (NOC View)
                      │
Phone Companion ─────┘
  • Camera (person count)
  • Microphone (noise dB)
  • GPS (location)
  • Supports: iOS + Android
```

## Structure
| Folder | Description |
|--------|-------------|
| `firmware/esp12e/` | ESP-12E (ESP8266) — radar, ToF, IMU firmware |
| `firmware/sensor_hub/` | Legacy ESP32 DevKit firmware |
| `firmware/camera_node/` | Legacy ESP32-CAM firmware |
| `mobile/ios/TeleSol/` | iOS companion app (Swift/SwiftUI) |
| `mobile/android/TeleSol/` | Android companion app (Kotlin/Compose) |
| `backend/` | FastAPI + WebSocket — sensor ingestion, CRS, mobile API |
| `frontend/` | React + Vite + TailwindCSS — NOC dashboard |
| `docs/` | API reference, wiring diagrams |

## Sensors (ESP-12E)
| Sensor | Interface | Purpose |
|--------|-----------|---------|
| HLK-LD2420 | SoftwareSerial (D5/D6) | 24GHz radar — human presence + motion |
| VL53L0X/1XV2 | I2C (0x29) | ToF — doorway passage counting |
| MPU6050 | I2C (0x68) | IMU — vibration from foot traffic |

## Phone Companion Features
| Feature | iOS | Android |
|---------|-----|---------|
| Camera (person detection) | Vision Framework | ML Kit |
| Microphone (noise level) | AVAudioRecorder | AudioRecord |
| GPS Location | CoreLocation | FusedLocationProvider |
| Backend streaming | URLSession | OkHttp |

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

### ESP-12E Firmware
1. Install Arduino IDE with **ESP8266 board support**
2. Install libraries: `Adafruit VL53L0X`, `MPU6050_light`, `ArduinoJson`
3. Open `firmware/esp12e/telesol_esp12e.ino`
4. Edit `config.h` — set WiFi SSID/password and backend IP
5. Select board: **NodeMCU 1.0 (ESP-12E Module)**
6. Upload!

### iOS App
1. Open `mobile/ios/TeleSol/` in Xcode
2. Build and run on your iPhone
3. In Settings tab, enter your backend URL (e.g., `http://192.168.1.50:8000`)
4. Tap "Start Streaming" on Dashboard

### Android App
1. Open `mobile/android/TeleSol/` in Android Studio
2. Build and run on your device
3. Grant camera, microphone, and location permissions
4. Configure backend URL in Settings

## ESP-12E Wiring
```
ESP-12E              Sensors
════════             ══════
GPIO4 (D2) ─SDA─┬── VL53L0X SDA ── MPU6050 SDA
GPIO5 (D1) ─SCL─┴── VL53L0X SCL ── MPU6050 SCL
GPIO14(D5) ─RX───── HLK-LD2420 TX
GPIO12(D6) ─TX───── HLK-LD2420 RX
3.3V ────────────┬── VL53L0X VCC ── MPU6050 VCC
VIN (5V) ────────┴── HLK-LD2420 VCC
GND ─────────────── All GNDs
```

## API Endpoints
| Method | Path | Source |
|--------|------|--------|
| POST | `/api/sensors/data` | ESP-12E pushes sensor data |
| POST | `/api/mobile/register` | Phone registers on launch |
| POST | `/api/mobile/stream` | Phone streams camera/mic/GPS |
| GET | `/api/mobile/status` | Connected phone status |
| GET | `/api/dashboard/all` | Full dashboard data |
| WS | `/ws` | Real-time dashboard updates |

## Theme
- Dark mode (#0D1117)
- Cyan, green, orange accents
- Monospace for sensor values

## Mac OS X - Fresh Install (No Prerequisites)
If you are on a Mac and do not have any programming software installed (like Node.js or Python), follow these exact steps to run the complete TeleSol application:

**Step 1: Install Homebrew (The Mac Package Manager)**
Open your **Terminal** application (you can find it in your Applications > Utilities folder) and paste this entire line, then press Enter:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
*(Note: It may ask for your Mac password. Typing your password won't show characters on the screen, just type it and hit Enter. Follow any on-screen prompts it gives you at the end to add Homebrew to your PATH).*

**Step 2: Install Node.js and Python**
Once Homebrew is installed, install the required languages by running:
```bash
brew install node python@3.11
```

**Step 3: Download and Run the Application**
If you have downloaded this project folder, ensure you open two separate Terminal windows or tabs inside the `telesol` directory.

**Terminal 1 (Backend - Python)**
```bash
# Navigate to the backend folder
cd path/to/telesol/backend

# Create a virtual environment and start the server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend - React)**
```bash
# Navigate to the frontend folder
cd path/to/telesol/frontend

# Install dependencies and start the dashboard
npm install
npm run dev
```

Your Mac will now host the application locally! Open the URL provided in Terminal 2 (usually `http://localhost:5173`) in your web browser.
