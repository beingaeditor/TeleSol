// ============================================================
// HLK-LD2420 24GHz Radar Sensor — ESP8266 SoftwareSerial
// TeleSol v3.0
// ============================================================

#ifndef RADAR_LD2420_H
#define RADAR_LD2420_H

#include <Arduino.h>

struct RadarData {
    bool     humanDetected;    // Target present?
    uint16_t distance_cm;      // Distance to target in cm
    uint8_t  movementState;    // 0=none, 1=moving, 2=static, 3=both
    uint8_t  energyLevel;      // Signal strength 0-100
    bool     isMoving;         // Moving target detected
    uint8_t  estimatedCount;   // Rough human count estimate
};

// Initialize radar on SoftwareSerial
void radarInit(int rxPin, int txPin, long baud);

// Read latest radar data (non-blocking)
RadarData radarRead();

// Check if radar is responding
bool radarIsOnline();

#endif // RADAR_LD2420_H
