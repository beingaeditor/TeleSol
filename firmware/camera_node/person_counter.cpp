#include "person_counter.h"

CameraData readCamera() {
    CameraData data;
    // TODO: Implement camera frame capture, person counting, motion detection
    data.personCount = 0;
    data.frameTimestamp = millis();
    data.motionDetected = false;
    return data;
}
