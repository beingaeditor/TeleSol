/*
 * ══════════════════════════════════════════════════════════════════════════════
 *                       TELESOL SENSOR HUB v3.0 — ESP-12E
 *                    Crowd Detection & Telecom Intelligence
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * HARDWARE CONFIGURATION:
 * ────────────────────────
 * Main Controller: ESP-12E (ESP8266)
 *
 * SENSORS (connected to ESP-12E):
 *   • HLK-LD2420 24GHz Radar  (SoftwareSerial: GPIO14/GPIO12)
 *   • VL53L0X/1X ToF Sensor   (I2C: 0x29)
 *   • MPU6050 6-Axis IMU      (I2C: 0x68)
 *
 * PHONE COMPANION (iOS/Android):
 *   • Camera → Person counting (via backend API)
 *   • Microphone → Noise level dB (via backend API)
 *   • GPS → Location data (via backend API)
 *
 * WIRING DIAGRAM:
 * ────────────────
 *   I2C Bus (shared):
 *     GPIO4 (D2) → SDA ─┬─ VL53L0X SDA ─── MPU6050 SDA
 *     GPIO5 (D1) → SCL ─┴─ VL53L0X SCL ─── MPU6050 SCL
 *
 *   HLK-LD2420 Radar (SoftwareSerial):
 *     GPIO14 (D5) → ESP RX ← Radar TX
 *     GPIO12 (D6) → ESP TX → Radar RX
 *     VIN    (5V) → Radar VCC
 *
 *   Power:
 *     3.3V → VL53L0X VCC, MPU6050 VCC
 *     VIN  → HLK-LD2420 VCC (5V)
 *     GND  → All sensor GNDs
 *
 * LIBRARIES REQUIRED (Arduino IDE):
 * ──────────────────────────────────
 *   Board:     ESP8266 (by ESP8266 Community) — boards manager
 *   Libraries:
 *     • Adafruit VL53L0X          (for ToF sensor)
 *     • MPU6050_light             (for IMU)
 *     • SoftwareSerial            (built-in with ESP8266)
 *     • ESP8266WiFi               (built-in with ESP8266)
 *     • ESP8266HTTPClient         (built-in with ESP8266)
 *     • ArduinoJson              (v6+)
 *     • Wire                     (built-in)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 */

#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

#include "config.h"
#include "radar_ld2420.h"
#include "tof_vl53.h"
#include "imu_mpu6050.h"

// ══════════════════════════════════════════════════════════════════════════════
//                              STATUS FLAGS
// ══════════════════════════════════════════════════════════════════════════════

bool wifiConnected  = false;
bool backendOnline  = false;

// ══════════════════════════════════════════════════════════════════════════════
//                              SENSOR DATA
// ══════════════════════════════════════════════════════════════════════════════

RadarData radarData;
ToFData   tofData;
IMUData   imuData;

// ══════════════════════════════════════════════════════════════════════════════
//                          COMPUTED CROWD METRICS
// ══════════════════════════════════════════════════════════════════════════════

int    estimatedHumans  = 0;
float  crowdDensity     = 0.0;
int    congestionRisk   = 0;      // CRS score 0-100
String riskLevel        = "NORMAL";
String activityLevel    = "LOW";
int    tofPassageCount  = 0;      // Running count of passages

// Phone data (received from backend if phone is connected)
int    phonePersonCount = 0;
float  phoneNoiseDB     = 0.0;

// ══════════════════════════════════════════════════════════════════════════════
//                              TIMING
// ══════════════════════════════════════════════════════════════════════════════

unsigned long lastSensorRead   = 0;
unsigned long lastBackendPush  = 0;
unsigned long lastSerialPrint  = 0;
unsigned long lastWifiRetry    = 0;
unsigned long bootTime         = 0;

// ══════════════════════════════════════════════════════════════════════════════
//                              WIFI CLIENT
// ══════════════════════════════════════════════════════════════════════════════

WiFiClient wifiClient;

// ══════════════════════════════════════════════════════════════════════════════
//                                 SETUP
// ══════════════════════════════════════════════════════════════════════════════

void setup() {
    Serial.begin(115200);
    delay(500);

    bootTime = millis();

    // Status LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, HIGH);  // OFF (active low on ESP-12E)

    printBanner();

    // ── Initialize I2C Bus ──────────────────────────────────
    Serial.print(F("[INIT] I2C Bus (SDA=D2, SCL=D1)... "));
    Wire.begin(I2C_SDA, I2C_SCL);
    Wire.setClock(400000);  // 400kHz fast mode
    Serial.println(F("✓ OK"));

    // ── Initialize Sensors ──────────────────────────────────
    Serial.println(F("\n── Sensor Initialization ──────────────────"));

    Serial.print(F("[INIT] HLK-LD2420 Radar ........ "));
    radarInit(RADAR_RX_PIN, RADAR_TX_PIN, RADAR_BAUD);
    Serial.println(radarIsOnline() ? F("✓ OK") : F("⏳ Waiting"));

    Serial.print(F("[INIT] VL53L0X ToF ............. "));
    tofInit();
    Serial.println(tofIsOnline() ? F("✓ OK") : F("✗ FAIL"));

    Serial.print(F("[INIT] MPU6050 IMU ............. "));
    imuInit();
    Serial.println(imuIsOnline() ? F("✓ OK") : F("✗ FAIL"));

    // ── Connect WiFi ────────────────────────────────────────
    Serial.println(F("\n── Network Setup ─────────────────────────"));
    connectWiFi();

    if (wifiConnected) {
        checkBackend();
    }

    // ── Status Summary ──────────────────────────────────────
    printStatus();

    // Blink LED to indicate ready
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, LOW);   // ON
        delay(100);
        digitalWrite(LED_PIN, HIGH);  // OFF
        delay(100);
    }

    Serial.println(F("\n[SYSTEM] ════════════════════════════════════"));
    Serial.println(F("[SYSTEM]  Entering main loop — sensors active"));
    Serial.println(F("[SYSTEM] ════════════════════════════════════\n"));
}

// ══════════════════════════════════════════════════════════════════════════════
//                               MAIN LOOP
// ══════════════════════════════════════════════════════════════════════════════

void loop() {
    unsigned long now = millis();

    // ── Read Sensors (5Hz) ──────────────────────────────────
    if (now - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
        lastSensorRead = now;

        radarData = radarRead();
        tofData   = tofRead();
        imuData   = imuRead();

        // Track passage count
        if (tofData.passageDetected) {
            tofPassageCount++;
        }

        // Compute crowd metrics
        computeCrowdMetrics();

        // LED feedback: ON during high risk
        digitalWrite(LED_PIN, (congestionRisk >= CRS_ELEVATED) ? LOW : HIGH);
    }

    // ── Serial Debug (1Hz) ──────────────────────────────────
    if (now - lastSerialPrint >= SERIAL_PRINT_INTERVAL_MS) {
        lastSerialPrint = now;
        printSensorData();
    }

    // ── Push to Backend (every 5s) ──────────────────────────
    if (now - lastBackendPush >= BACKEND_PUSH_INTERVAL_MS) {
        lastBackendPush = now;
        pushToBackend();
    }

    // ── WiFi Reconnect ──────────────────────────────────────
    if (!wifiConnected && (now - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS)) {
        lastWifiRetry = now;
        connectWiFi();
    }

    // Yield for ESP8266 background tasks
    yield();
    delay(5);
}

// ══════════════════════════════════════════════════════════════════════════════
//                            CROWD METRICS
// ══════════════════════════════════════════════════════════════════════════════

void computeCrowdMetrics() {
    estimatedHumans = 0;

    // ── Radar Contribution ──────────────────────────────────
    if (radarData.humanDetected) {
        estimatedHumans += radarData.estimatedCount;
    }

    // ── ToF Contribution (doorway counting) ─────────────────
    // Use passage count as a secondary indicator
    // Recent passages in last 30 seconds suggest active foot traffic
    // (passage count is cumulative, so use it as activity indicator)

    // ── IMU Contribution (vibration = foot traffic) ─────────
    if (imuData.significantMotion) {
        // Vibration correlates with nearby human activity
        if (imuData.vibrationMagnitude > 0.5)      estimatedHumans += 2;
        else if (imuData.vibrationMagnitude > 0.25) estimatedHumans += 1;
    }

    // ── Phone Camera (if connected via backend) ─────────────
    if (phonePersonCount > 0) {
        // Phone camera is most accurate — use as primary
        estimatedHumans = max(estimatedHumans, phonePersonCount);
    }

    estimatedHumans = constrain(estimatedHumans, 0, 100);

    // ── Crowd Density ───────────────────────────────────────
    crowdDensity = (float)estimatedHumans / ZONE_AREA_SQ_M;

    // ── CRS Calculation ─────────────────────────────────────
    //    CRS = α(D/C) + βG + γU + δT
    float demand      = min((float)estimatedHumans / 20.0f, 1.0f) * 100.0f;
    float capacity    = (float)MAX_CAPACITY;
    float growth      = radarData.isMoving ? 80.0f : 40.0f;

    // Use phone noise if available, otherwise use vibration as proxy
    float utilization;
    if (phoneNoiseDB > 0) {
        utilization = min(phoneNoiseDB / 80.0f, 1.0f) * 100.0f;
    } else {
        utilization = min(imuData.vibrationMagnitude * 200.0f, 100.0f);
    }

    float temporal    = 50.0f;  // Baseline (will be computed server-side with time)

    congestionRisk = (int)(
        CRS_ALPHA * (demand / capacity * 100.0f) +
        CRS_BETA  * growth +
        CRS_GAMMA * utilization +
        CRS_DELTA * temporal
    );
    congestionRisk = constrain(congestionRisk, 0, 100);

    // ── Activity Level ──────────────────────────────────────
    if (radarData.isMoving || imuData.vibrationMagnitude > 0.3 || phoneNoiseDB > 70) {
        activityLevel = "HIGH";
    } else if (radarData.humanDetected || imuData.significantMotion || phoneNoiseDB > 50) {
        activityLevel = "MED";
    } else {
        activityLevel = "LOW";
    }

    // ── Risk Level ──────────────────────────────────────────
    if (congestionRisk >= CRS_HIGH)     riskLevel = "CRITICAL";
    else if (congestionRisk >= CRS_ELEVATED) riskLevel = "HIGH";
    else if (congestionRisk >= CRS_NORMAL)   riskLevel = "ELEVATED";
    else                                      riskLevel = "NORMAL";
}

// ══════════════════════════════════════════════════════════════════════════════
//                              BACKEND SYNC
// ══════════════════════════════════════════════════════════════════════════════

void pushToBackend() {
    if (!wifiConnected) return;

    // Check WiFi is still connected
    if (WiFi.status() != WL_CONNECTED) {
        wifiConnected = false;
        return;
    }

    // Build JSON payload using ArduinoJson v7
    JsonDocument doc;

    doc["node_id"]    = NODE_ID;
    doc["timestamp"]  = millis();

    // Sensors object
    JsonObject sensors = doc["sensors"].to<JsonObject>();

    // Radar
    JsonObject radar = sensors["radar"].to<JsonObject>();
    radar["humanDetected"] = radarData.humanDetected;
    radar["distance_cm"]   = radarData.distance_cm;
    radar["movementState"] = radarData.movementState;
    radar["energyLevel"]   = radarData.energyLevel;

    // ToF
    JsonObject tof = sensors["tof"].to<JsonObject>();
    tof["distance_mm"]   = tofData.distance_mm;
    tof["valid"]         = tofData.valid;
    tof["rangeStatus"]   = tofData.rangeStatus;
    tof["objectNear"]    = tofData.objectNear;
    tof["passageCount"]  = tofPassageCount;

    // IMU
    JsonObject imu = sensors["imu"].to<JsonObject>();
    imu["accelX"]             = serialized(String(imuData.accelX, 3));
    imu["accelY"]             = serialized(String(imuData.accelY, 3));
    imu["accelZ"]             = serialized(String(imuData.accelZ, 3));
    imu["gyroX"]              = serialized(String(imuData.gyroX, 3));
    imu["gyroY"]              = serialized(String(imuData.gyroY, 3));
    imu["gyroZ"]              = serialized(String(imuData.gyroZ, 3));
    imu["temperature"]        = serialized(String(imuData.temperature, 1));
    imu["vibrationMagnitude"] = serialized(String(imuData.vibrationMagnitude, 4));

    // Audio placeholder (from phone when available)
    JsonObject audio = sensors["audio"].to<JsonObject>();
    audio["noiseLevel_dB"] = phoneNoiseDB;
    audio["peakAmplitude"]  = 0.0;
    audio["isCrowdNoise"]   = (phoneNoiseDB > 60.0);

    // Camera placeholder (from phone when available)
    JsonObject camera = sensors["camera"].to<JsonObject>();
    camera["personCount"]    = phonePersonCount;
    camera["frameTimestamp"]  = millis();
    camera["motionDetected"] = radarData.isMoving;

    // Computed object
    JsonObject computed = doc["computed"].to<JsonObject>();
    computed["estimatedHumans"]  = estimatedHumans;
    computed["crowdDensity"]     = serialized(String(crowdDensity, 4));
    computed["zoneArea"]         = ZONE_AREA_SQ_M;
    computed["capacity"]         = MAX_CAPACITY;
    computed["deviceMultiplier"] = 2.0;
    computed["eventBoost"]       = 0.0;
    computed["growthRate"]       = radarData.isMoving ? 0.8 : 0.3;
    computed["networkUtil"]      = 50.0;

    // Serialize
    String json;
    serializeJson(doc, json);

    // HTTP POST
    HTTPClient http;
    http.begin(wifiClient, BACKEND_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);

    int httpCode = http.POST(json);

    if (httpCode == 200 || httpCode == 201) {
        backendOnline = true;

        // Parse response to get phone data if available
        String response = http.getString();
        JsonDocument respDoc;
        if (deserializeJson(respDoc, response) == DeserializationError::Ok) {
            // Check if phone data was relayed back
            if (respDoc["phone_data"].is<JsonObject>()) {
                phonePersonCount = respDoc["phone_data"]["person_count"] | 0;
                phoneNoiseDB     = respDoc["phone_data"]["noise_db"] | 0.0f;
            }
        }
    } else {
        backendOnline = false;
        Serial.print(F("[BACKEND] Push failed, HTTP "));
        Serial.println(httpCode);
    }

    http.end();
}

// ══════════════════════════════════════════════════════════════════════════════
//                            WIFI CONNECTION
// ══════════════════════════════════════════════════════════════════════════════

void connectWiFi() {
    Serial.print(F("[WiFi] Connecting to "));
    Serial.print(WIFI_SSID);
    Serial.print(F(" "));

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        Serial.println(F(" ✓ Connected!"));
        Serial.print(F("[WiFi] IP: "));
        Serial.println(WiFi.localIP());
        Serial.print(F("[WiFi] RSSI: "));
        Serial.print(WiFi.RSSI());
        Serial.println(F(" dBm"));
    } else {
        wifiConnected = false;
        Serial.println(F(" ✗ FAILED"));
    }
}

void checkBackend() {
    Serial.print(F("[INIT] Backend Server .......... "));

    HTTPClient http;
    http.begin(wifiClient, String("http://") + BACKEND_HOST + ":" + String(BACKEND_PORT) + "/");
    http.setTimeout(3000);

    int code = http.GET();
    http.end();

    if (code > 0) {
        backendOnline = true;
        Serial.println(F("✓ OK"));
    } else {
        backendOnline = false;
        Serial.println(F("✗ Offline (will retry)"));
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                              SERIAL OUTPUT
// ══════════════════════════════════════════════════════════════════════════════

void printBanner() {
    Serial.println();
    Serial.println(F("╔══════════════════════════════════════════════════════════╗"));
    Serial.println(F("║                                                          ║"));
    Serial.println(F("║              ████████╗███████╗██╗     ███████╗           ║"));
    Serial.println(F("║              ╚══██╔══╝██╔════╝██║     ██╔════╝           ║"));
    Serial.println(F("║                 ██║   █████╗  ██║     █████╗             ║"));
    Serial.println(F("║                 ██║   ██╔══╝  ██║     ██╔══╝             ║"));
    Serial.println(F("║                 ██║   ███████╗███████╗███████╗           ║"));
    Serial.println(F("║                 ╚═╝   ╚══════╝╚══════╝╚══════╝           ║"));
    Serial.println(F("║                                                          ║"));
    Serial.println(F("║           CROWD DETECTION & TELECOM INTELLIGENCE         ║"));
    Serial.println(F("║                  ESP-12E Edition — v3.0                  ║"));
    Serial.println(F("║                                                          ║"));
    Serial.println(F("║  Sensors: HLK-LD2420 | VL53L0X | MPU6050                ║"));
    Serial.println(F("║  Companion: iOS / Android Phone (cam + mic + GPS)        ║"));
    Serial.println(F("║                                                          ║"));
    Serial.println(F("╚══════════════════════════════════════════════════════════╝"));
    Serial.println();
    Serial.print(F("[NODE] ID:       ")); Serial.println(NODE_ID);
    Serial.print(F("[NODE] Location: ")); Serial.println(NODE_LOCATION);
    Serial.print(F("[NODE] Chip ID:  ")); Serial.println(ESP.getChipId(), HEX);
    Serial.print(F("[NODE] Flash:    ")); Serial.print(ESP.getFlashChipSize() / 1024); Serial.println(F(" KB"));
    Serial.print(F("[NODE] Free RAM: ")); Serial.print(ESP.getFreeHeap()); Serial.println(F(" bytes"));
    Serial.println();
}

void printStatus() {
    Serial.println();
    Serial.println(F("┌──────────────────────────────────────────┐"));
    Serial.println(F("│              SYSTEM STATUS                │"));
    Serial.println(F("├──────────────────────────────────────────┤"));
    Serial.print(F("│  Radar (LD2420):   ")); Serial.println(radarIsOnline()  ? F("✓ Online            │") : F("✗ Offline           │"));
    Serial.print(F("│  ToF (VL53L0X):    ")); Serial.println(tofIsOnline()    ? F("✓ Online            │") : F("✗ Offline           │"));
    Serial.print(F("│  IMU (MPU6050):    ")); Serial.println(imuIsOnline()    ? F("✓ Online            │") : F("✗ Offline           │"));
    Serial.print(F("│  WiFi:             ")); Serial.println(wifiConnected    ? F("✓ Connected         │") : F("✗ Disconnected      │"));
    Serial.print(F("│  Backend:          ")); Serial.println(backendOnline    ? F("✓ Connected         │") : F("✗ Offline           │"));
    Serial.print(F("│  Phone Companion:  ")); Serial.println(F("⏳ Via Backend       │"));
    Serial.println(F("└──────────────────────────────────────────┘"));

    int sensorCount = (radarIsOnline()?1:0) + (tofIsOnline()?1:0) + (imuIsOnline()?1:0);
    Serial.print(F("\n[READY] "));
    Serial.print(sensorCount);
    Serial.println(F("/3 sensors active"));
}

void printSensorData() {
    unsigned long uptime = (millis() - bootTime) / 1000;

    Serial.print(F("["));
    Serial.print(uptime);
    Serial.print(F("s] "));

    // Radar
    Serial.print(F("Radar:"));
    if (radarData.humanDetected) {
        Serial.print(radarData.distance_cm);
        Serial.print(F("cm"));
        Serial.print(radarData.isMoving ? F("[M]") : F("[S]"));
        Serial.print(F(" E:"));
        Serial.print(radarData.energyLevel);
    } else {
        Serial.print(F("---"));
    }

    // ToF
    Serial.print(F(" | ToF:"));
    if (tofData.valid) {
        Serial.print(tofData.distance_mm);
        Serial.print(F("mm"));
        if (tofData.objectNear) Serial.print(F("!"));
    } else {
        Serial.print(F("---"));
    }
    Serial.print(F(" P:"));
    Serial.print(tofPassageCount);

    // IMU
    Serial.print(F(" | Vib:"));
    Serial.print(imuData.vibrationMagnitude, 2);
    Serial.print(F("g "));
    Serial.print(imuData.temperature, 0);
    Serial.print(F("°C"));

    // Phone
    if (phonePersonCount > 0 || phoneNoiseDB > 0) {
        Serial.print(F(" | 📱:"));
        Serial.print(phonePersonCount);
        Serial.print(F("p/"));
        Serial.print((int)phoneNoiseDB);
        Serial.print(F("dB"));
    }

    // Crowd
    Serial.print(F(" | Est:"));
    Serial.print(estimatedHumans);
    Serial.print(F(" CRS:"));
    Serial.print(congestionRisk);
    Serial.print(F("["));
    Serial.print(riskLevel);
    Serial.print(F("]"));

    Serial.println();
}
