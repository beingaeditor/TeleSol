// ============================================================
// MPU6050 6-Axis IMU — I2C Driver
// ============================================================
//
// Detects vibration and movement patterns for crowd sensing:
//   - Floor/structure vibration from foot traffic
//   - Device orientation changes
//   - Temperature monitoring
//
// I2C Address: 0x68 (no conflict with VL53L0X @ 0x29)
// ============================================================

#include "imu_mpu6050.h"
#include <MPU6050_light.h>
#include <Wire.h>

static MPU6050 mpu(Wire);
static bool imuOnline = false;

// Vibration threshold for "significant motion"
#define VIBRATION_THRESHOLD 0.15  // g (above normal noise floor)

void imuInit() {
    byte status = mpu.begin();
    if (status == 0) {
        Serial.println(F("[IMU] MPU6050 initialized, calibrating..."));
        delay(100);
        mpu.calcOffsets();  // Auto-calibrate gyro + accel offsets
        imuOnline = true;
        Serial.println(F("[IMU] Calibration complete"));
    } else {
        Serial.print(F("[IMU] MPU6050 init FAILED, status="));
        Serial.println(status);
    }
}

IMUData imuRead() {
    IMUData data;
    data.accelX = 0;
    data.accelY = 0;
    data.accelZ = 0;
    data.gyroX  = 0;
    data.gyroY  = 0;
    data.gyroZ  = 0;
    data.temperature = 0;
    data.vibrationMagnitude = 0;
    data.significantMotion  = false;

    if (!imuOnline) return data;

    mpu.update();

    data.accelX = mpu.getAccX();
    data.accelY = mpu.getAccY();
    data.accelZ = mpu.getAccZ();
    data.gyroX  = mpu.getGyroX();
    data.gyroY  = mpu.getGyroY();
    data.gyroZ  = mpu.getGyroZ();
    data.temperature = mpu.getTemp();

    // Vibration = deviation from 1g (gravity)
    float totalAccel = sqrt(
        data.accelX * data.accelX +
        data.accelY * data.accelY +
        data.accelZ * data.accelZ
    );
    data.vibrationMagnitude = fabs(totalAccel - 1.0);
    data.significantMotion  = (data.vibrationMagnitude > VIBRATION_THRESHOLD);

    return data;
}

bool imuIsOnline() {
    return imuOnline;
}
