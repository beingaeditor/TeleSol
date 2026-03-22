// ============================================================
// MAIN ARDUINO SKETCH - ESP32 SENSOR HUB
// TeleSol - Predictive Telecom Congestion Intelligence
// ============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_VL53L0X.h>
#include <MPU6050_light.h>
#include <driver/i2s.h>
#include "config.h"
#include "sensors/radar.h"
#include "sensors/tof.h"
#include "sensors/microphone.h"
#include "sensors/imu.h"
#include "display/oled.h"

// ---- Forward declarations ----
int estimateHumans(RadarData radar, ToFData tof, AudioData audio);
String classifyActivity(IMUData imu, AudioData audio);
void sendToBackend(StaticJsonDocument<512>& doc);
void connectWiFi();

// ---- Status LED ----
void blinkLED(int times, int delayMs) {
    for (int i = 0; i < times; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(delayMs);
        digitalWrite(LED_PIN, LOW);
        delay(delayMs);
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("\n[TeleSol] Sensor Hub starting...");

    pinMode(LED_PIN, OUTPUT);
    blinkLED(3, 100);

    // Initialize I2C bus (shared by ToF, IMU, OLED)
    Wire.begin(I2C_SDA, I2C_SCL);

    // Initialize WiFi
    connectWiFi();

    // Initialize all sensors
    Serial.println("[Init] Initializing sensors...");
    initRadar(RADAR_RX_PIN, RADAR_TX_PIN, RADAR_BAUD);
    initToF();
    initMicrophone();
    initIMU();

    // Initialize OLED display
    initOLED();

    Serial.println("[Init] All systems ready!");
    blinkLED(2, 200);
}

void loop() {
    // 1. Read all sensors
    RadarData radar = readRadar();
    ToFData tof = readToF();
    AudioData audio = readAudio();
    IMUData imu = readIMU();

    // 2. Process and estimate
    int estimatedHumans = estimateHumans(radar, tof, audio);
    float crowdDensity = estimatedHumans / ZONE_AREA;
    String activityLevel = classifyActivity(imu, audio);

    // 3. Update local OLED display
    updateDisplay(estimatedHumans, crowdDensity, activityLevel);

    // 4. Build JSON payload
    StaticJsonDocument<512> doc;
    doc["node_id"] = NODE_ID;
    doc["timestamp"] = millis();

    JsonObject sensors = doc.createNestedObject("sensors");

    JsonObject radarObj = sensors.createNestedObject("radar");
    radarObj["humanDetected"] = radar.humanDetected;
    radarObj["distance_cm"] = radar.distance_cm;
    radarObj["movementState"] = radar.movementState;
    radarObj["energyLevel"] = radar.energyLevel;

    JsonObject tofObj = sensors.createNestedObject("tof");
    tofObj["distance_mm"] = tof.distance_mm;
    tofObj["valid"] = tof.valid;
    tofObj["rangeStatus"] = (int)tof.rangeStatus;

    JsonObject audioObj = sensors.createNestedObject("audio");
    audioObj["noiseLevel_dB"] = audio.noiseLevel_dB;
    audioObj["peakAmplitude"] = audio.peakAmplitude;
    audioObj["isCrowdNoise"] = audio.isCrowdNoise;

    JsonObject imuObj = sensors.createNestedObject("imu");
    imuObj["accelX"] = imu.accelX;
    imuObj["accelY"] = imu.accelY;
    imuObj["accelZ"] = imu.accelZ;
    imuObj["gyroX"] = imu.gyroX;
    imuObj["gyroY"] = imu.gyroY;
    imuObj["gyroZ"] = imu.gyroZ;
    imuObj["temperature"] = imu.temperature;
    imuObj["vibrationMagnitude"] = imu.vibrationMagnitude;

    JsonObject computed = doc.createNestedObject("computed");
    computed["estimatedHumans"] = estimatedHumans;
    computed["crowdDensity"] = crowdDensity;
    computed["activityLevel"] = activityLevel;

    // 5. Send to backend
    if (WiFi.status() == WL_CONNECTED) {
        sendToBackend(doc);
        digitalWrite(LED_PIN, HIGH);
        delay(50);
        digitalWrite(LED_PIN, LOW);
    } else {
        Serial.println("[WiFi] Disconnected, reconnecting...");
        connectWiFi();
    }

    // 6. Serial debug output
    Serial.printf("[Data] Humans=%d Density=%.2f Activity=%s Radar=%s ToF=%dmm Noise=%.1fdB Vibr=%.3f\n",
        estimatedHumans, crowdDensity, activityLevel.c_str(),
        radar.humanDetected ? "YES" : "NO",
        tof.distance_mm, audio.noiseLevel_dB, imu.vibrationMagnitude);

    // 7. Wait for next cycle
    delay(2000);
}

// ---- Helper Functions ----

void connectWiFi() {
    Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
        delay(500);
        Serial.print(".");
        retries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n[WiFi] Connection failed — will retry next cycle");
    }
}

int estimateHumans(RadarData radar, ToFData tof, AudioData audio) {
    int count = 0;

    // Radar: primary detection
    if (radar.humanDetected) {
        // Use energy level as rough population proxy
        count = max(1, (int)round(radar.energyLevel / 25.0));
    }

    // ToF: corroborate presence (close range, <2m = person nearby)
    if (tof.valid && tof.distance_mm > 0 && tof.distance_mm < 2000) {
        if (count == 0) count = 1;
    }

    // Audio: if crowd noise detected, bump estimate
    if (audio.isCrowdNoise && count < 3) {
        count = max(count, 2);
    }

    return count;
}

String classifyActivity(IMUData imu, AudioData audio) {
    // Classify based on vibration and noise levels
    float vib = imu.vibrationMagnitude;
    float noise = audio.noiseLevel_dB;

    if (vib > 0.5 && noise > 70.0) return "high";
    if (vib > 0.2 || noise > 55.0) return "moderate";
    if (vib > 0.05 || noise > 35.0) return "low";
    return "idle";
}

void sendToBackend(StaticJsonDocument<512>& doc) {
    HTTPClient http;
    http.begin(BACKEND_URL);
    http.addHeader("Content-Type", "application/json");

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
        Serial.printf("[HTTP] POST -> %d\n", httpCode);
        if (httpCode == 200) {
            String response = http.getString();
            // Parse CRS from response for OLED display
            StaticJsonDocument<256> resDoc;
            if (deserializeJson(resDoc, response) == DeserializationError::Ok) {
                float crs = resDoc["crs"] | 0.0;
                const char* level = resDoc["level"] | "unknown";
                Serial.printf("[CRS] Score=%.1f Level=%s\n", crs, level);
            }
        }
    } else {
        Serial.printf("[HTTP] POST failed: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
}
