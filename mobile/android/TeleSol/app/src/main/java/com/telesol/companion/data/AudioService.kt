// ════════════════════════════════════════════════════════════════
// TeleSol Android — Audio Noise Level Service
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.app.ActivityCompat
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.sqrt

class AudioService(private val context: Context) {

    // ── State ────────────────────────────────────────────────
    private val _isMonitoring = MutableStateFlow(false)
    val isMonitoring: StateFlow<Boolean> = _isMonitoring

    private val _noiseLevel = MutableStateFlow(0.0)
    val noiseLevel: StateFlow<Double> = _noiseLevel

    private val _peakLevel = MutableStateFlow(0.0)
    val peakLevel: StateFlow<Double> = _peakLevel

    private val _isCrowdNoise = MutableStateFlow(false)
    val isCrowdNoise: StateFlow<Boolean> = _isCrowdNoise

    // ── Private ──────────────────────────────────────────────
    private var audioRecord: AudioRecord? = null
    private var monitorJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val sampleRate = 44100
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val crowdNoiseThreshold = 60.0  // dB

    // ── Start Monitoring ─────────────────────────────────────
    fun startMonitoring() {
        if (_isMonitoring.value) return

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            return
        }

        val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) return

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            channelConfig,
            audioFormat,
            bufferSize * 2
        )

        if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
            audioRecord?.release()
            audioRecord = null
            return
        }

        audioRecord?.startRecording()
        _isMonitoring.value = true

        monitorJob = scope.launch {
            val buffer = ShortArray(bufferSize)

            while (isActive && _isMonitoring.value) {
                val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                if (read > 0) {
                    // Calculate RMS
                    var sumSquares = 0.0
                    var peak = 0
                    for (i in 0 until read) {
                        val sample = buffer[i].toInt()
                        sumSquares += sample.toDouble() * sample.toDouble()
                        if (abs(sample) > peak) peak = abs(sample)
                    }
                    val rms = sqrt(sumSquares / read)

                    // Convert to approximate dB SPL
                    // Short.MAX_VALUE = 32767, reference = 1.0
                    val db = if (rms > 0) {
                        20 * log10(rms) + 25  // Calibration offset
                    } else {
                        0.0
                    }

                    val clampedDb = db.coerceIn(0.0, 120.0)

                    _noiseLevel.value = clampedDb
                    if (clampedDb > _peakLevel.value) {
                        _peakLevel.value = clampedDb
                    }
                    _isCrowdNoise.value = clampedDb > crowdNoiseThreshold
                }

                delay(100)  // 10 samples per second
            }
        }
    }

    // ── Stop Monitoring ──────────────────────────────────────
    fun stopMonitoring() {
        monitorJob?.cancel()
        monitorJob = null
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        _isMonitoring.value = false
    }

    // ── Reset ────────────────────────────────────────────────
    fun resetStats() {
        _peakLevel.value = 0.0
    }

    fun cleanup() {
        stopMonitoring()
        scope.cancel()
    }
}
