#include "tof.h"

ToFData readToF() {
    ToFData data;
    // TODO: Implement I2C read for VL53L0X
    data.distance_mm = 0;
    data.valid = false;
    data.rangeStatus = 0;
    return data;
}
