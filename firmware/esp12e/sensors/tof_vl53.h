// ============================================================
// VL53L0X / VL53L1X Time-of-Flight Sensor — I2C
// TeleSol v3.0
// ============================================================

#ifndef TOF_VL53_H
#define TOF_VL53_H

#include <Arduino.h>

struct ToFData {
    uint16_t distance_mm;     // Measured distance in millimeters
    bool     valid;           // Measurement is valid
    uint8_t  rangeStatus;     // Sensor range status code
    bool     objectNear;      // Object within close range (<500mm)
    bool     passageDetected; // Transition detected (person passing)
};

// Initialize VL53L0X on I2C bus (Wire must be started first)
void tofInit();

// Read distance measurement
ToFData tofRead();

// Check if sensor is responding
bool tofIsOnline();

#endif // TOF_VL53_H
