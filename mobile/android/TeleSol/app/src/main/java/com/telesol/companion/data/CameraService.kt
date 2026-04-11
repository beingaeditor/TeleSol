// ════════════════════════════════════════════════════════════════
// TeleSol Android — Camera Service (CameraX)
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.data

import android.content.Context
import android.util.Size
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.DetectedObject
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraService(private val context: Context) {

    // ── State ────────────────────────────────────────────────
    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning

    private val _personCount = MutableStateFlow(0)
    val personCount: StateFlow<Int> = _personCount

    private val _motionDetected = MutableStateFlow(false)
    val motionDetected: StateFlow<Boolean> = _motionDetected

    // ── Camera ───────────────────────────────────────────────
    private var cameraProvider: ProcessCameraProvider? = null
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    var previewUseCase: Preview? = null
        private set

    // ── ML Kit Object Detection ──────────────────────────────
    private val objectDetector by lazy {
        val options = ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.STREAM_MODE)
            .enableMultipleObjects()
            .enableClassification()
            .build()
        ObjectDetection.getClient(options)
    }

    // ── Motion Detection ─────────────────────────────────────
    private var previousLuminance: Double = 0.0
    private var frameCount: Int = 0

    // ── Start Camera ─────────────────────────────────────────
    fun startCamera(lifecycleOwner: LifecycleOwner, surfaceProvider: Preview.SurfaceProvider) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            // Preview use case
            previewUseCase = Preview.Builder()
                .setTargetResolution(Size(640, 480))
                .build()
                .also { it.setSurfaceProvider(surfaceProvider) }

            // Image analysis use case
            val imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(Size(320, 240))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { analysis ->
                    analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                        processFrame(imageProxy)
                    }
                }

            // Bind to lifecycle
            try {
                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    previewUseCase,
                    imageAnalysis
                )
                _isRunning.value = true
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }, ContextCompat.getMainExecutor(context))
    }

    // ── Process Frame ────────────────────────────────────────
    @androidx.camera.core.ExperimentalGetImage
    private fun processFrame(imageProxy: ImageProxy) {
        frameCount++

        // Only process every 10th frame
        if (frameCount % 10 != 0) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val inputImage = InputImage.fromMediaImage(
                mediaImage,
                imageProxy.imageInfo.rotationDegrees
            )

            // Person detection via ML Kit
            objectDetector.process(inputImage)
                .addOnSuccessListener { detectedObjects ->
                    // Count objects classified as "Person" (category index 0)
                    val persons = detectedObjects.count { obj ->
                        obj.labels.any { label ->
                            label.text.equals("Person", ignoreCase = true) ||
                            label.index == 0
                        }
                    }
                    _personCount.value = maxOf(persons, detectedObjects.size)
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }

            // Simple motion detection via luminance change
            val luminance = calculateLuminance(imageProxy)
            _motionDetected.value = Math.abs(luminance - previousLuminance) > 5.0
            previousLuminance = luminance
        } else {
            imageProxy.close()
        }
    }

    // ── Luminance Calculation (motion heuristic) ─────────────
    private fun calculateLuminance(imageProxy: ImageProxy): Double {
        val buffer = imageProxy.planes[0].buffer
        val data = ByteArray(buffer.remaining())
        buffer.get(data)
        var sum = 0L
        for (byte in data) {
            sum += (byte.toInt() and 0xFF)
        }
        return if (data.isNotEmpty()) sum.toDouble() / data.size else 0.0
    }

    // ── Stop Camera ──────────────────────────────────────────
    fun stopCamera() {
        cameraProvider?.unbindAll()
        _isRunning.value = false
    }

    fun cleanup() {
        cameraExecutor.shutdown()
    }
}
