// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Dashboard View
// Shows live ESP sensor data + fused CRS score
// ════════════════════════════════════════════════════════════════

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var backend: BackendService
    @EnvironmentObject var audio: AudioService
    @EnvironmentObject var camera: CameraService
    @EnvironmentObject var location: LocationService

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {

                    // ── Connection Status ────────────────────
                    connectionCard

                    // ── CRS Score ────────────────────────────
                    crsCard

                    // ── Sensor Grid ──────────────────────────
                    sensorGrid

                    // ── Streaming Controls ───────────────────
                    streamingCard

                    // ── Phone Sensors ────────────────────────
                    phoneSensorsCard
                }
                .padding()
            }
            .background(Color(hex: "0D1117").ignoresSafeArea())
            .navigationTitle("TeleSol")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - Connection Status Card
    private var connectionCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(backend.isConnected ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                    Text(backend.isConnected ? "Connected" : "Disconnected")
                        .font(.system(.subheadline, design: .monospaced))
                        .foregroundColor(backend.isConnected ? .green : .red)
                }

                HStack(spacing: 6) {
                    Circle()
                        .fill(backend.espConnected ? Color.cyan : Color.gray)
                        .frame(width: 8, height: 8)
                    Text(backend.espConnected ? "ESP-12E Online" : "ESP-12E Offline")
                        .font(.system(.caption, design: .monospaced))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing) {
                Text("Streams: \(backend.streamCount)")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(.secondary)

                if let error = backend.errorMessage {
                    Text(error)
                        .font(.caption2)
                        .foregroundColor(.orange)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .background(Color(hex: "161B22").cornerRadius(12))
    }

    // MARK: - CRS Score Card
    private var crsCard: some View {
        VStack(spacing: 8) {
            Text("CONGESTION RISK SCORE")
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)

            Text(String(format: "%.0f", backend.lastCRS))
                .font(.system(size: 64, weight: .bold, design: .monospaced))
                .foregroundColor(crsColor)

            Text(backend.lastLevel.uppercased())
                .font(.system(.title3, design: .monospaced))
                .foregroundColor(crsColor)
                .padding(.horizontal, 16)
                .padding(.vertical, 4)
                .background(crsColor.opacity(0.15).cornerRadius(8))

            // CRS Progress Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(crsColor)
                        .frame(width: geo.size.width * min(backend.lastCRS / 100.0, 1.0), height: 8)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(hex: "161B22").cornerRadius(12))
    }

    // MARK: - Sensor Grid
    private var sensorGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: 12),
            GridItem(.flexible(), spacing: 12),
        ], spacing: 12) {
            sensorTile(icon: "dot.radiowaves.left.and.right", label: "Radar",
                       value: "\(backend.dashboardData?.liveData?.radarDistance ?? 0) cm",
                       color: .cyan)

            sensorTile(icon: "ruler", label: "ToF Distance",
                       value: "\(backend.dashboardData?.liveData?.tofDistance ?? 0) mm",
                       color: .purple)

            sensorTile(icon: "waveform.path.ecg", label: "Vibration",
                       value: String(format: "%.3f g", backend.dashboardData?.liveData?.vibration ?? 0),
                       color: .orange)

            sensorTile(icon: "thermometer", label: "Temperature",
                       value: String(format: "%.1f°C", backend.dashboardData?.liveData?.temperature ?? 0),
                       color: .red)

            sensorTile(icon: "person.3.fill", label: "Est. People",
                       value: "\(backend.dashboardData?.liveData?.radarHumans ?? 0)",
                       color: .green)

            sensorTile(icon: "speaker.wave.2.fill", label: "Noise",
                       value: String(format: "%.0f dB", audio.noiseLevel),
                       color: .yellow)
        }
    }

    private func sensorTile(icon: String, label: String, value: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.system(.title3, design: .monospaced))
                .foregroundColor(.white)

            Text(label)
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(hex: "161B22").cornerRadius(12))
    }

    // MARK: - Streaming Controls
    private var streamingCard: some View {
        VStack(spacing: 12) {
            Text("DATA STREAMING")
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)

            Button(action: {
                if backend.isStreaming {
                    backend.stopStreaming()
                    audio.stopMonitoring()
                    camera.stopCamera()
                    location.stopTracking()
                } else {
                    audio.startMonitoring()
                    camera.startCamera()
                    location.startTracking()

                    backend.startStreaming(
                        noiseProvider: { [weak audio] in audio?.noiseLevel ?? 0 },
                        personProvider: { [weak camera] in camera?.personCount ?? 0 },
                        locationProvider: { [weak location] in
                            (location?.latitude, location?.longitude, location?.accuracy)
                        }
                    )
                }
            }) {
                HStack {
                    Image(systemName: backend.isStreaming ? "stop.circle.fill" : "play.circle.fill")
                    Text(backend.isStreaming ? "Stop Streaming" : "Start Streaming")
                }
                .font(.system(.body, design: .monospaced))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    (backend.isStreaming ? Color.red : Color.cyan)
                        .cornerRadius(12)
                )
            }
        }
        .padding()
        .background(Color(hex: "161B22").cornerRadius(12))
    }

    // MARK: - Phone Sensors Card
    private var phoneSensorsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PHONE SENSORS")
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)

            HStack {
                sensorStatus(icon: "camera.fill", name: "Camera",
                             active: camera.isRunning, detail: "\(camera.personCount) people")
                Spacer()
                sensorStatus(icon: "mic.fill", name: "Mic",
                             active: audio.isMonitoring, detail: String(format: "%.0f dB", audio.noiseLevel))
                Spacer()
                sensorStatus(icon: "location.fill", name: "GPS",
                             active: location.isTracking, detail: location.isAuthorized ? "OK" : "Denied")
            }
        }
        .padding()
        .background(Color(hex: "161B22").cornerRadius(12))
    }

    private func sensorStatus(icon: String, name: String, active: Bool, detail: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(active ? .green : .gray)
            Text(name)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(detail)
                .font(.system(.caption2, design: .monospaced))
                .foregroundColor(active ? .white : .gray)
        }
    }

    // MARK: - Helpers
    private var crsColor: Color {
        switch backend.lastLevel {
        case "critical": return .red
        case "high": return .orange
        case "elevated": return .yellow
        default: return .green
        }
    }
}

// MARK: - Hex Color Extension
extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var hexNumber: UInt64 = 0
        scanner.scanHexInt64(&hexNumber)
        let r = Double((hexNumber & 0xFF0000) >> 16) / 255.0
        let g = Double((hexNumber & 0x00FF00) >> 8) / 255.0
        let b = Double(hexNumber & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

#Preview {
    DashboardView()
        .environmentObject(BackendService())
        .environmentObject(CameraService())
        .environmentObject(AudioService())
        .environmentObject(LocationService())
}
