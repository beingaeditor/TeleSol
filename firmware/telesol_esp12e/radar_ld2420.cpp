// ============================================================
// HLK-LD2420 24GHz Radar — Digital Output Driver (OT1/OT2)
// ============================================================
//
// This version of the LD2420 uses digital output pins:
//   OT1 → HIGH when human presence detected, LOW otherwise
//   OT2 → Secondary output (motion/static differentiation)
//
// No UART TX available on this module variant.
// RX pin is input-only (for configuration commands).
//
// Connection:
//   OT1 → GPIO14 (D5) — presence detection
//   OT2 → GPIO12 (D6) — motion type
//   3V3 → 3.3V (this variant runs on 3.3V!)
//   GND → GND
// ============================================================

#include "radar_ld2420.h"

static int ot1Pin = -1;
static int ot2Pin = -1;
static bool radarOnline = false;
static RadarData currentData;

// Timing for presence tracking
static unsigned long presenceStartTime = 0;
static unsigned long lastPresenceTime = 0;
static bool wasPresent = false;
static int presenceCount = 0;

void radarInit(int rxPin, int txPin, long baud) {
    // rxPin = OT1 (D5/GPIO14), txPin = OT2 (D6/GPIO12)
    ot1Pin = rxPin;
    ot2Pin = txPin;

    pinMode(ot1Pin, INPUT);
    pinMode(ot2Pin, INPUT);

    // Initialize data
    currentData.humanDetected  = false;
    currentData.distance_cm    = 0;
    currentData.movementState  = 0;
    currentData.energyLevel    = 0;
    currentData.isMoving       = false;
    currentData.estimatedCount = 0;

    // Read initial state
    delay(100);
    bool ot1 = digitalRead(ot1Pin);
    radarOnline = true;  // Digital pins always readable

    Serial.print(F("[Radar] OT1=D5 OT2=D6 mode, initial state: "));
    Serial.println(ot1 ? F("PRESENCE") : F("CLEAR"));
}

RadarData radarRead() {
    if (ot1Pin < 0) return currentData;

    bool ot1 = digitalRead(ot1Pin);  // Presence
    bool ot2 = digitalRead(ot2Pin);  // Motion type

    currentData.humanDetected = ot1;

    if (ot1) {
        lastPresenceTime = millis();

        if (!wasPresent) {
            // New presence event
            presenceStartTime = millis();
            presenceCount++;
            wasPresent = true;
        }

        // Duration of current presence
        unsigned long duration = millis() - presenceStartTime;

        // Estimate distance based on duration (closer = stronger/longer signal)
        // This is approximate — LD2420 doesn't give distance in OT mode
        if (duration > 5000)      currentData.distance_cm = 50;   // Very close
        else if (duration > 2000) currentData.distance_cm = 150;  // Medium
        else                      currentData.distance_cm = 300;  // Far

        // OT2 typically differentiates motion type
        currentData.isMoving = ot2;
        currentData.movementState = ot2 ? 1 : 2;  // 1=moving, 2=static

        // Energy level estimate from duration
        currentData.energyLevel = constrain((int)(duration / 100), 1, 100);

        // Estimate count from presence pattern
        // Longer sustained presence = more people likely
        if (duration > 10000 && currentData.energyLevel > 60)
            currentData.estimatedCount = 3;
        else if (duration > 5000)
            currentData.estimatedCount = 2;
        else
            currentData.estimatedCount = 1;

    } else {
        wasPresent = false;
        currentData.distance_cm    = 0;
        currentData.movementState  = 0;
        currentData.energyLevel    = 0;
        currentData.isMoving       = false;
        currentData.estimatedCount = 0;
    }

    return currentData;
}

bool radarIsOnline() {
    return radarOnline;
}
