// HLK-LD2420 Radar Diagnostic — tries multiple baud rates
// Prints raw data from radar to find the correct baud

#include <SoftwareSerial.h>

#define RX_PIN 14  // D5 — ESP receives FROM radar
#define TX_PIN 12  // D6 — ESP sends TO radar

SoftwareSerial radarSerial(RX_PIN, TX_PIN);

long baudRates[] = {115200, 256000, 9600, 57600, 38400, 19200};
int numBauds = 6;
int currentBaud = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n=== HLK-LD2420 Radar Diagnostic ===");
    Serial.println("RX=D5(GPIO14) TX=D6(GPIO12)");
    Serial.println("Make sure radar VCC is on VIN (5V)!\n");
    
    // Start with first baud rate
    tryBaud(baudRates[0]);
}

void tryBaud(long baud) {
    Serial.print("\n>> Trying baud: ");
    Serial.println(baud);
    radarSerial.begin(baud);
    delay(200);
    // Flush
    while (radarSerial.available()) radarSerial.read();
}

void loop() {
    static unsigned long lastSwitch = millis();
    static unsigned long lastPrint = millis();
    static int bytesReceived = 0;
    static String lineBuffer = "";
    
    // Read any available data
    while (radarSerial.available()) {
        char c = radarSerial.read();
        bytesReceived++;
        
        if (c == '\n' || c == '\r') {
            if (lineBuffer.length() > 0) {
                Serial.print("  [");
                Serial.print(baudRates[currentBaud]);
                Serial.print("] DATA: \"");
                Serial.print(lineBuffer);
                Serial.println("\"");
                lineBuffer = "";
            }
        } else if (c >= 32 && c < 127) {
            // Printable ASCII
            lineBuffer += c;
            if (lineBuffer.length() > 100) lineBuffer = "";
        } else {
            // Non-printable — show hex
            if (lineBuffer.length() == 0) {
                Serial.print("  [");
                Serial.print(baudRates[currentBaud]);
                Serial.print("] HEX: ");
            }
            if (c < 16) Serial.print("0");
            Serial.print(c, HEX);
            Serial.print(" ");
        }
    }
    
    // Print status every 2 seconds
    if (millis() - lastPrint > 2000) {
        lastPrint = millis();
        Serial.print("  [");
        Serial.print(baudRates[currentBaud]);
        Serial.print("] bytes received: ");
        Serial.println(bytesReceived);
    }
    
    // Switch baud rate every 8 seconds if no meaningful data
    if (millis() - lastSwitch > 8000) {
        lastSwitch = millis();
        currentBaud = (currentBaud + 1) % numBauds;
        bytesReceived = 0;
        lineBuffer = "";
        tryBaud(baudRates[currentBaud]);
    }
    
    delay(10);
}
