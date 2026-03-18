#include "radar.h"

RadarData readRadar() {
    RadarData data;
    // TODO: Implement UART read for HLK-LD2410
    data.humanDetected = false;
    data.distance_cm = 0;
    data.movementState = 0;
    data.energyLevel = 0;
    return data;
}
