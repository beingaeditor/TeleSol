// ============================================================
// VL53L0X / VL53L1X Time-of-Flight — I2C Driver
// ============================================================
//
// Measures distance up to ~2m (VL53L0X) or ~4m (VL53L1X).
// Used for passage/doorway people counting:
//   - Detects when a person walks through a doorway
//   - Tracks near→far transitions as "passage events"
//
// I2C Address: 0x29 (default, no conflict with MPU6050 @ 0x68)
// ============================================================

#include "tof_vl53.h"
#include <Adafruit_VL53L0X.h>

static Adafruit_VL53L0X lox;
static bool tofOnline = false;

// Passage detection state machine
static uint16_t prevDistance = 0;
static bool     wasNear = false;
static uint8_t  passageCount = 0;
static unsigned long lastPassageTime = 0;

// Thresholds
#define NEAR_THRESHOLD_MM   500   // Object "near" if < 500mm
#define FAR_THRESHOLD_MM    1200  // Object "far" if > 1200mm
#define PASSAGE_COOLDOWN_MS 1000  // Min time between passage events

void tofInit() {
    if (lox.begin()) {
        tofOnline = true;
        // Configure for long range mode
        lox.configSensor(Adafruit_VL53L0X::VL53L0X_SENSE_LONG_RANGE);
        Serial.println(F("[ToF] VL53L0X initialized — long range mode"));
    } else {
        Serial.println(F("[ToF] VL53L0X init FAILED — check wiring (SDA=D2, SCL=D1)"));
    }
}

ToFData tofRead() {
    ToFData data;
    data.distance_mm     = 0;
    data.valid           = false;
    data.rangeStatus     = 255;
    data.objectNear      = false;
    data.passageDetected = false;

    if (!tofOnline) return data;

    VL53L0X_RangingMeasurementData_t measure;
    lox.rangingTest(&measure, false);

    data.rangeStatus = measure.RangeStatus;

    // Status 4 = phase failure / out of range
    if (measure.RangeStatus != 4) {
        data.distance_mm = measure.RangeMilliMeter;
        data.valid       = true;

        // Near detection
        data.objectNear = (data.distance_mm < NEAR_THRESHOLD_MM);

        // Passage detection: near → far transition = someone walked through
        bool isNear = data.distance_mm < NEAR_THRESHOLD_MM;
        bool isFar  = data.distance_mm > FAR_THRESHOLD_MM;

        if (wasNear && isFar && (millis() - lastPassageTime > PASSAGE_COOLDOWN_MS)) {
            data.passageDetected = true;
            passageCount++;
            lastPassageTime = millis();
        }

        wasNear = isNear;
        prevDistance = data.distance_mm;
    }

    return data;
}

bool tofIsOnline() {
    return tofOnline;
}
