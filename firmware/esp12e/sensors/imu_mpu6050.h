// ============================================================
// MPU6050 6-Axis IMU — I2C
// TeleSol v3.0
// ============================================================

#ifndef IMU_MPU6050_H
#define IMU_MPU6050_H

#include <Arduino.h>

struct IMUData {
    float accelX, accelY, accelZ;   // Acceleration (g)
    float gyroX,  gyroY,  gyroZ;    // Gyroscope (°/s)
    float temperature;               // Die temperature (°C)
    float vibrationMagnitude;         // Vibration = |accel| - 1.0g
    bool  significantMotion;          // Above vibration threshold
};

// Initialize MPU6050 on I2C bus (Wire must be started first)
void imuInit();

// Read all axes + temperature
IMUData imuRead();

// Check if sensor is responding
bool imuIsOnline();

#endif // IMU_MPU6050_H
