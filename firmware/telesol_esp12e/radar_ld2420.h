// ============================================================
// HLK-LD2420 24GHz Radar — Digital Output Driver Header
// ============================================================
// Uses OT1/OT2 digital outputs (not UART)

#ifndef RADAR_LD2420_H
#define RADAR_LD2420_H

#include <Arduino.h>

struct RadarData {
    bool humanDetected;
    int  distance_cm;       // Estimated from presence duration
    int  movementState;     // 0=none, 1=moving, 2=static
    int  energyLevel;       // Estimated 0-100
    bool isMoving;          // OT2 state
    int  estimatedCount;    // Estimated humans nearby
};

// rxPin = OT1 pin (presence), txPin = OT2 pin (motion type)
void radarInit(int rxPin, int txPin, long baud);
RadarData radarRead();
bool radarIsOnline();

#endif
