#include "imu.h"

IMUData readIMU() {
    IMUData data;
    // TODO: Implement I2C read for MPU6050
    data.accelX = 0.0;
    data.accelY = 0.0;
    data.accelZ = 0.0;
    data.gyroX = 0.0;
    data.gyroY = 0.0;
    data.gyroZ = 0.0;
    data.temperature = 0.0;
    data.vibrationMagnitude = 0.0;
    return data;
}
