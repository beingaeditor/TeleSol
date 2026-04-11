// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Camera Service (AVFoundation)
// ════════════════════════════════════════════════════════════════

import Foundation
import AVFoundation
import UIKit
import Vision

class CameraService: NSObject, ObservableObject {
    // MARK: - Published State
    @Published var isRunning = false
    @Published var personCount: Int = 0
    @Published var motionDetected = false
    @Published var lastFrame: UIImage?

    // MARK: - Capture Session
    let captureSession = AVCaptureSession()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let processingQueue = DispatchQueue(label: "com.telesol.camera", qos: .userInteractive)

    // MARK: - Motion Detection
    private var previousPixelBuffer: CVPixelBuffer?
    private var frameCount: Int = 0
    private let processEveryN = 10  // Process 1 in 10 frames for performance

    // MARK: - Vision (Person Detection)
    private lazy var personDetectionRequest: VNDetectHumanRectanglesRequest = {
        let request = VNDetectHumanRectanglesRequest { [weak self] request, error in
            guard let results = request.results as? [VNHumanObservation] else { return }
            DispatchQueue.main.async {
                self?.personCount = results.count
            }
        }
        return request
    }()

    // MARK: - Setup
    func startCamera() {
        guard !isRunning else { return }

        captureSession.beginConfiguration()
        captureSession.sessionPreset = .medium

        // Camera input
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: camera),
              captureSession.canAddInput(input) else {
            captureSession.commitConfiguration()
            return
        }
        captureSession.addInput(input)

        // Video output
        videoOutput.setSampleBufferDelegate(self, queue: processingQueue)
        videoOutput.alwaysDiscardsLateVideoFrames = true
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        }

        captureSession.commitConfiguration()

        processingQueue.async { [weak self] in
            self?.captureSession.startRunning()
            DispatchQueue.main.async {
                self?.isRunning = true
            }
        }
    }

    func stopCamera() {
        processingQueue.async { [weak self] in
            self?.captureSession.stopRunning()
            DispatchQueue.main.async {
                self?.isRunning = false
            }
        }
    }
}

// MARK: - Frame Processing
extension CameraService: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        frameCount += 1

        // Only process every Nth frame
        guard frameCount % processEveryN == 0 else { return }

        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        // ── Person Detection via Vision Framework ──────────────
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: [:])
        try? handler.perform([personDetectionRequest])

        // ── Simple Motion Detection ────────────────────────────
        if let prev = previousPixelBuffer {
            let motion = computeMotionDelta(current: pixelBuffer, previous: prev)
            DispatchQueue.main.async { [weak self] in
                self?.motionDetected = motion > 0.02  // 2% pixel change threshold
            }
        }
        previousPixelBuffer = pixelBuffer

        // ── Preview frame (downsampled) ────────────────────────
        if frameCount % (processEveryN * 3) == 0 {
            let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
            let context = CIContext()
            if let cgImage = context.createCGImage(ciImage, from: ciImage.extent) {
                let uiImage = UIImage(cgImage: cgImage)
                DispatchQueue.main.async { [weak self] in
                    self?.lastFrame = uiImage
                }
            }
        }
    }

    // Basic motion detection: compare pixel luminance between frames
    private func computeMotionDelta(current: CVPixelBuffer, previous: CVPixelBuffer) -> Double {
        CVPixelBufferLockBaseAddress(current, .readOnly)
        CVPixelBufferLockBaseAddress(previous, .readOnly)
        defer {
            CVPixelBufferUnlockBaseAddress(current, .readOnly)
            CVPixelBufferUnlockBaseAddress(previous, .readOnly)
        }

        guard let curBase = CVPixelBufferGetBaseAddress(current),
              let prevBase = CVPixelBufferGetBaseAddress(previous) else { return 0 }

        let width = CVPixelBufferGetWidth(current)
        let height = CVPixelBufferGetHeight(current)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(current)

        var diffSum: Int = 0
        let totalPixels = width * height
        let step = 8  // Sample every 8th pixel for performance

        for y in stride(from: 0, to: height, by: step) {
            let curRow = curBase.advanced(by: y * bytesPerRow)
            let prevRow = prevBase.advanced(by: y * bytesPerRow)

            for x in stride(from: 0, to: width * 4, by: step * 4) {
                let curPixel = curRow.load(fromByteOffset: x, as: UInt8.self)
                let prevPixel = prevRow.load(fromByteOffset: x, as: UInt8.self)
                let diff = abs(Int(curPixel) - Int(prevPixel))
                if diff > 25 { diffSum += 1 }  // Count significant changes
            }
        }

        let sampledPixels = (width / step) * (height / step)
        return sampledPixels > 0 ? Double(diffSum) / Double(sampledPixels) : 0
    }
}
