// Dual I2C Sensor Test — VL53L0X + MPU6050 together
// Diagnoses bus conflicts when both share SDA/SCL

#include <Wire.h>
#include <Adafruit_VL53L0X.h>
#include <MPU6050_light.h>

Adafruit_VL53L0X lox;
MPU6050 mpu(Wire);

bool vl53_ok = false;
bool mpu_ok = false;

void scanBus() {
    Serial.println("--- I2C Bus Scan ---");
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        byte err = Wire.endTransmission();
        if (err == 0) {
            Serial.print("  Device at 0x");
            Serial.println(addr, HEX);
        }
    }
    Serial.println("--- End Scan ---\n");
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n=== Dual Sensor Test ===\n");
    
    // Init I2C
    Wire.begin(4, 5);  // SDA=D2, SCL=D1
    Wire.setClock(100000);  // Try 100kHz (slower, more stable)
    delay(100);
    
    // Scan first
    Serial.println("[1] Initial bus scan:");
    scanBus();
    
    // Try VL53L0X FIRST (it can be finicky)
    Serial.print("[2] Init VL53L0X... ");
    delay(100);
    if (lox.begin()) {
        vl53_ok = true;
        Serial.println("OK!");
    } else {
        Serial.println("FAILED");
        Serial.println("    Trying with address 0x29 explicitly...");
        if (lox.begin(0x29)) {
            vl53_ok = true;
            Serial.println("    OK on retry!");
        } else {
            Serial.println("    Still failed.");
        }
    }
    
    // Scan again after VL53L0X init
    Serial.println("\n[3] Bus scan after VL53L0X init:");
    scanBus();
    
    // Now try MPU6050
    Serial.print("[4] Init MPU6050... ");
    byte status = mpu.begin();
    if (status == 0) {
        mpu_ok = true;
        Serial.println("OK!");
        mpu.calcOffsets();
        Serial.println("    Calibrated.");
    } else {
        Serial.print("FAILED (status=");
        Serial.print(status);
        Serial.println(")");
    }
    
    // Final scan
    Serial.println("\n[5] Final bus scan:");
    scanBus();
    
    Serial.println("=== Results ===");
    Serial.print("  VL53L0X: "); Serial.println(vl53_ok ? "WORKING" : "FAILED");
    Serial.print("  MPU6050: "); Serial.println(mpu_ok ? "WORKING" : "FAILED");
    Serial.println("================\n");
}

void loop() {
    if (vl53_ok) {
        VL53L0X_RangingMeasurementData_t m;
        lox.rangingTest(&m, false);
        Serial.print("ToF: ");
        if (m.RangeStatus != 4) {
            Serial.print(m.RangeMilliMeter);
            Serial.print("mm");
        } else {
            Serial.print("out of range");
        }
    } else {
        Serial.print("ToF: N/A");
    }
    
    Serial.print(" | ");
    
    if (mpu_ok) {
        mpu.update();
        Serial.print("IMU: ");
        Serial.print(mpu.getTemp(), 1);
        Serial.print("C  Accel:");
        Serial.print(mpu.getAccX(), 2);
        Serial.print(",");
        Serial.print(mpu.getAccY(), 2);
        Serial.print(",");
        Serial.print(mpu.getAccZ(), 2);
    } else {
        Serial.print("IMU: N/A");
    }
    
    Serial.println();
    delay(500);
}
