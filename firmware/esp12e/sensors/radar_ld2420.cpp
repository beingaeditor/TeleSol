// ============================================================
// HLK-LD2420 24GHz Radar — SoftwareSerial Driver
// ============================================================
//
// The LD2420 outputs simple text-based status on its UART:
//   "ON"                → target present
//   "OFF"               → no target
//   "Range XXX"         → distance in cm
//   "mov XX" / "occ XX" → moving/static energy level
//
// On ESP8266 we use SoftwareSerial since the single hardware
// UART is reserved for Serial debug output.
// ============================================================

#include "radar_ld2420.h"
#include <SoftwareSerial.h>

static SoftwareSerial* radarSerial = nullptr;
static bool            radarOnline = false;
static unsigned long   lastDataTime = 0;
static RadarData       currentData;
static String          lineBuf = "";

// Internal parser
static void parseRadarLine(const String& line);

void radarInit(int rxPin, int txPin, long baud) {
    radarSerial = new SoftwareSerial(rxPin, txPin);
    radarSerial->begin(baud);

    // Initialize data
    currentData.humanDetected = false;
    currentData.distance_cm   = 0;
    currentData.movementState = 0;
    currentData.energyLevel   = 0;
    currentData.isMoving      = false;
    currentData.estimatedCount = 0;

    // Flush any stale data
    delay(100);
    while (radarSerial->available()) radarSerial->read();

    // Wait up to 2s for first data
    unsigned long start = millis();
    while (millis() - start < 2000) {
        if (radarSerial->available() > 0) {
            radarOnline = true;
            lastDataTime = millis();
            Serial.println(F("[Radar] HLK-LD2420 detected on SoftwareSerial"));
            return;
        }
        delay(50);
    }

    // Assume connected even without immediate data
    radarOnline = true;
    Serial.println(F("[Radar] HLK-LD2420 init (waiting for data)"));
}

RadarData radarRead() {
    if (!radarSerial) return currentData;

    // Non-blocking read: consume all available chars
    while (radarSerial->available()) {
        char c = radarSerial->read();

        if (c == '\n' || c == '\r') {
            if (lineBuf.length() > 0) {
                parseRadarLine(lineBuf);
                lineBuf = "";
                lastDataTime = millis();
                radarOnline = true;
            }
        } else {
            lineBuf += c;
            // Prevent buffer overflow
            if (lineBuf.length() > 80) lineBuf = "";
        }
    }

    // Timeout: no data for 5 seconds → clear presence
    if (millis() - lastDataTime > 5000) {
        currentData.humanDetected  = false;
        currentData.distance_cm    = 0;
        currentData.energyLevel    = 0;
        currentData.isMoving       = false;
        currentData.estimatedCount = 0;
    }

    return currentData;
}

bool radarIsOnline() {
    return radarOnline && (millis() - lastDataTime < 10000);
}

// ── Line Parser ──────────────────────────────────────────────

static void parseRadarLine(const String& raw) {
    String line = raw;
    line.trim();
    String lower = line;
    lower.toLowerCase();

    // LD2420 simple protocol
    if (lower == "on" || lower.indexOf("presence") >= 0 || lower.indexOf("occupy") >= 0) {
        currentData.humanDetected = true;
    }
    else if (lower == "off" || lower.indexOf("no target") >= 0 || lower.indexOf("none") >= 0) {
        currentData.humanDetected  = false;
        currentData.distance_cm    = 0;
        currentData.energyLevel    = 0;
        currentData.isMoving       = false;
        currentData.movementState  = 0;
        currentData.estimatedCount = 0;
        return;
    }
    else if (lower.startsWith("range") || lower.startsWith("distance") || lower.startsWith("r ")) {
        int idx = lower.lastIndexOf(' ');
        if (idx > 0) {
            int dist = lower.substring(idx + 1).toInt();
            if (dist > 0 && dist < 2000) {
                currentData.distance_cm = dist;
                currentData.humanDetected = true;
            }
        }
    }
    else if (lower.startsWith("mov") || lower.indexOf("moving") >= 0) {
        currentData.isMoving      = true;
        currentData.movementState = 1;
        currentData.humanDetected = true;
        int idx = lower.lastIndexOf(' ');
        if (idx > 0) {
            currentData.energyLevel = constrain(lower.substring(idx + 1).toInt(), 0, 100);
        }
    }
    else if (lower.startsWith("occ") || lower.startsWith("sta") || lower.indexOf("static") >= 0) {
        currentData.isMoving      = false;
        currentData.movementState = 2;
        currentData.humanDetected = true;
        int idx = lower.lastIndexOf(' ');
        if (idx > 0) {
            currentData.energyLevel = constrain(lower.substring(idx + 1).toInt(), 0, 100);
        }
    }
    else {
        // Try parsing as plain number (distance)
        int val = line.toInt();
        if (val > 0 && val < 2000) {
            currentData.distance_cm   = val;
            currentData.humanDetected = true;
        }
    }

    // Estimate human count from energy level
    if (currentData.humanDetected) {
        if (currentData.energyLevel > 80)      currentData.estimatedCount = 4;
        else if (currentData.energyLevel > 60) currentData.estimatedCount = 3;
        else if (currentData.energyLevel > 40) currentData.estimatedCount = 2;
        else if (currentData.energyLevel > 15) currentData.estimatedCount = 1;
        else                                    currentData.estimatedCount = 1;
    } else {
        currentData.estimatedCount = 0;
    }
}
