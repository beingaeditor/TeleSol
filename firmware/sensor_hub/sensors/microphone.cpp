#include "microphone.h"

AudioData readAudio() {
    AudioData data;
    // TODO: Implement I2S read and dB calculation for INMP441
    data.noiseLevel_dB = 0.0;
    data.peakAmplitude = 0.0;
    data.isCrowdNoise = false;
    return data;
}
