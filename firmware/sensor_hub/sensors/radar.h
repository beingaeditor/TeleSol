// HLK-LD2410 Radar Sensor
#ifndef RADAR_H
#define RADAR_H
#include <Arduino.h>

struct RadarData {
    bool humanDetected;
    uint16_t distance_cm;
    uint8_t movementState;
    uint8_t energyLevel;
};

RadarData readRadar();

#endif // RADAR_H
