// ============================================================
// CAMERA NODE MAIN SKETCH - ESP32-CAM
// ============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "person_counter.h"

void setup() {
    Serial.begin(115200);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    // ...init camera, etc...
}

void loop() {
    CameraData cam = readCamera();
    // Build JSON payload
    StaticJsonDocument<256> doc;
    doc["node_id"] = NODE_ID;
    doc["timestamp"] = millis();
    JsonObject sensors = doc.createNestedObject("sensors");
    sensors["camera"]["personCount"] = cam.personCount;
    sensors["camera"]["motionDetected"] = cam.motionDetected;
    sensors["camera"]["frameTimestamp"] = cam.frameTimestamp;
    // Send to backend
    if (WiFi.status() == WL_CONNECTED) {
        sendToBackend(doc);
    }
    delay(5000);
}
// ...existing code for camera init, readCamera, sendToBackend...
