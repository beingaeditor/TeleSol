#include "oled.h"
#include <Adafruit_SSD1306.h>
#include "config.h"

Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);

void updateDisplay(int estimatedHumans, float crowdDensity, String activityLevel) {
    // TODO: Implement OLED display update
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("Humans: "); display.println(estimatedHumans);
    display.print("Density: "); display.println(crowdDensity, 2);
    display.print("Activity: "); display.println(activityLevel);
    display.display();
}
