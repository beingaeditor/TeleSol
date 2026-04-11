// ============================================================
// CONFIGURATION CONSTANTS - ESP-12E (ESP8266) SENSOR HUB
// TeleSol v3.0 — Crowd Detection & Telecom Intelligence
// ============================================================

#ifndef CONFIG_H
#define CONFIG_H

// ── WiFi ─────────────────────────────────────────────────────
#define WIFI_SSID         "sameer's iPhone"
#define WIFI_PASSWORD     "9899320810"

// ── Node Identity ────────────────────────────────────────────
#define NODE_ID           "TELESOL-ESP12E-001"
#define NODE_LOCATION     "Entry-Gate-1"

// ── Backend Server ───────────────────────────────────────────
#define BACKEND_HOST      "192.168.1.50"
#define BACKEND_PORT      8000
#define BACKEND_PATH      "/api/sensors/data"
#define BACKEND_URL       "http://192.168.1.50:8000/api/sensors/data"

// ── I2C Bus (shared: VL53L0X + MPU6050) ─────────────────────
//    ESP-12E default I2C pins
#define I2C_SDA           4     // GPIO4  = D2
#define I2C_SCL           5     // GPIO5  = D1

// ── VL53L0X / VL53L1X ToF Sensor (I2C) ──────────────────────
#define VL53L0X_ADDR      0x29

// ── MPU6050 IMU (I2C) ───────────────────────────────────────
#define MPU6050_ADDR      0x68

// ── HLK-LD2420 Radar (SoftwareSerial) ───────────────────────
//    ESP8266 has only 1 hardware UART, so radar uses SoftwareSerial
#define RADAR_RX_PIN      14    // GPIO14 = D5  (ESP RX ← Radar TX)
#define RADAR_TX_PIN      12    // GPIO12 = D6  (ESP TX → Radar RX)
#define RADAR_BAUD        115200

// ── Status LED ───────────────────────────────────────────────
#define LED_PIN           2     // GPIO2  = built-in LED (active LOW)

// ── Timing ───────────────────────────────────────────────────
#define SENSOR_READ_INTERVAL_MS   200    // Read sensors every 200ms (5Hz)
#define BACKEND_PUSH_INTERVAL_MS  5000   // Push to backend every 5s
#define SERIAL_PRINT_INTERVAL_MS  1000   // Serial debug every 1s
#define WIFI_RETRY_INTERVAL_MS    30000  // Retry WiFi every 30s if disconnected

// ── Zone Configuration ──────────────────────────────────────
#define ZONE_AREA_SQ_M    20.0  // Coverage area in square meters
#define MAX_CAPACITY      100   // Max devices for CRS calculation

// ── CRS Weights ─────────────────────────────────────────────
//    CRS = α(D/C) + βG + γU + δT
#define CRS_ALPHA         0.35  // Device demand weight
#define CRS_BETA          0.25  // Growth rate weight
#define CRS_GAMMA         0.30  // Network utilization weight
#define CRS_DELTA         0.10  // Temporal factor weight

// ── CRS Thresholds ──────────────────────────────────────────
#define CRS_NORMAL        40
#define CRS_ELEVATED      60
#define CRS_HIGH          80

#endif // CONFIG_H
