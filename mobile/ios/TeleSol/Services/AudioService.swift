// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Audio Noise Level Service
// ════════════════════════════════════════════════════════════════

import Foundation
import AVFoundation

class AudioService: ObservableObject {
    // MARK: - Published State
    @Published var isMonitoring = false
    @Published var noiseLevel: Double = 0.0      // Current dB level
    @Published var peakLevel: Double = 0.0       // Peak dB since monitoring started
    @Published var averageLevel: Double = 0.0    // Running average
    @Published var isCrowdNoise = false          // Above crowd threshold

    // MARK: - Private
    private var audioRecorder: AVAudioRecorder?
    private var timer: Timer?
    private var sampleCount: Int = 0
    private var sumLevels: Double = 0.0

    // Thresholds
    private let crowdNoiseThreshold: Double = 60.0  // dB

    // MARK: - Start Monitoring
    func startMonitoring() {
        guard !isMonitoring else { return }

        // Request microphone permission
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            guard granted else {
                print("[Audio] Microphone permission denied")
                return
            }
            DispatchQueue.main.async {
                self?.setupRecorder()
            }
        }
    }

    private func setupRecorder() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .mixWithOthers])
            try session.setActive(true)
        } catch {
            print("[Audio] Session setup failed: \(error)")
            return
        }

        // Record to /dev/null — we only need metering data
        let url = URL(fileURLWithPath: "/dev/null")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatAppleLossless),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.min.rawValue,
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: url, settings: settings)
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.record()

            // Sample level every 100ms
            timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                self?.updateMetering()
            }

            isMonitoring = true
        } catch {
            print("[Audio] Recorder init failed: \(error)")
        }
    }

    // MARK: - Metering Update
    private func updateMetering() {
        guard let recorder = audioRecorder else { return }
        recorder.updateMeters()

        // averagePower returns dBFS (-160 to 0), convert to approximate SPL dB
        let avgPower = recorder.averagePower(forChannel: 0)

        // Rough conversion: dBFS → estimated SPL
        // Typical offset is ~100 dB (device-dependent)
        let estimatedDB = max(0, avgPower + 100)

        noiseLevel = estimatedDB

        // Update stats
        sampleCount += 1
        sumLevels += estimatedDB
        averageLevel = sumLevels / Double(sampleCount)

        if estimatedDB > peakLevel {
            peakLevel = estimatedDB
        }

        isCrowdNoise = estimatedDB > crowdNoiseThreshold
    }

    // MARK: - Stop Monitoring
    func stopMonitoring() {
        timer?.invalidate()
        timer = nil
        audioRecorder?.stop()
        audioRecorder = nil
        isMonitoring = false
    }

    // MARK: - Reset Stats
    func resetStats() {
        peakLevel = 0
        averageLevel = 0
        sampleCount = 0
        sumLevels = 0
    }

    deinit {
        stopMonitoring()
    }
}
