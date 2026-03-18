# TeleSol

TeleSol is a modular sensor platform for people-counting, device detection, and edge analytics. It includes firmware for ESP devices, a FastAPI backend, and a React dashboard for visualization and monitoring.

Key components
- firmware/: ESP32 firmware for sensor hub and camera node
- backend/: FastAPI services, data models, and processing pipelines
- frontend/: React + Vite dashboard (UI components in src/components)
- docs/: API reference, wiring diagrams, and design notes

Sensor list (present in this repo)
- IMU (accelerometer/gyroscope)
- Microphone (sound level / audio features)
- Radar (presence / motion detection)
- ToF (time-of-flight distance)
- Camera (person counting / image inference)

Getting started
1. Firmware: open the appropriate sketch in the `firmware/` folders and flash to the ESP device.
2. Backend: create a Python venv, install `backend/requirements.txt`, and run `uvicorn backend.app.main:app --reload`.
3. Frontend: `cd frontend && npm install && npm run dev` to start the dashboard.

Contributing
- Follow the code style in existing modules.
- Keep secrets out of the repo; put them in `.env` (already ignored).

Release
- This repository includes a `v0.1.0` tag as the initial release marker. See the repository tags on GitHub for release notes.

More docs
- [docs/api_reference.md](docs/api_reference.md) — Backend API
- [docs/wiring_diagram.md](docs/wiring_diagram.md) — Pin mappings and wiring

License
- Add a LICENSE file if you want to publish under an open-source license.
