#include <Wire.h>
#include <Adafruit_VL53L0X.h>

Adafruit_VL53L0X lox = Adafruit_VL53L0X();

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("VL53L0X Test");

  // Start I2C (ESP8266 custom pins)
  Wire.begin(D2, D1);

  if (!lox.begin()) {
    Serial.println("Failed to find VL53L0X sensor!");
    while (1);
  }

  Serial.println("Sensor initialized!");
}

void loop() {
  VL53L0X_RangingMeasurementData_t measure;

  lox.rangingTest(&measure, false); // false = no debug

  if (measure.RangeStatus != 4) {  // valid reading
    Serial.print("Distance: ");
    Serial.print(measure.RangeMilliMeter);
    Serial.println(" mm");
  } else {
    Serial.println("Out of range");
  }

  delay(500);
}