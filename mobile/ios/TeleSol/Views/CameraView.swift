// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Camera Preview View
// Live camera feed with person detection overlay
// ════════════════════════════════════════════════════════════════

import SwiftUI
import AVFoundation

struct CameraView: View {
    @EnvironmentObject var camera: CameraService
    @EnvironmentObject var backend: BackendService

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // ── Camera Preview ──────────────────────────
                ZStack {
                    CameraPreviewView(session: camera.captureSession)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(borderColor, lineWidth: 2)
                        )

                    // Person count overlay
                    VStack {
                        HStack {
                            Spacer()
                            personCountBadge
                                .padding(12)
                        }
                        Spacer()

                        // Motion indicator
                        if camera.motionDetected {
                            HStack {
                                Image(systemName: "figure.walk.motion")
                                Text("Motion Detected")
                            }
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.orange.opacity(0.8).cornerRadius(8))
                            .padding()
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .aspectRatio(4/3, contentMode: .fit)
                .padding()

                // ── Camera Controls ─────────────────────────
                VStack(spacing: 16) {
                    // Status
                    HStack(spacing: 20) {
                        statusItem(icon: "camera.fill",
                                   label: "Camera",
                                   value: camera.isRunning ? "Active" : "Off",
                                   color: camera.isRunning ? .green : .gray)

                        statusItem(icon: "person.crop.rectangle",
                                   label: "Detected",
                                   value: "\(camera.personCount)",
                                   color: .cyan)

                        statusItem(icon: "arrow.triangle.2.circlepath",
                                   label: "Motion",
                                   value: camera.motionDetected ? "Yes" : "No",
                                   color: camera.motionDetected ? .orange : .gray)
                    }

                    // Toggle button
                    Button(action: {
                        if camera.isRunning {
                            camera.stopCamera()
                        } else {
                            camera.startCamera()
                        }
                    }) {
                        HStack {
                            Image(systemName: camera.isRunning ? "video.slash.fill" : "video.fill")
                            Text(camera.isRunning ? "Stop Camera" : "Start Camera")
                        }
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            (camera.isRunning ? Color.red : Color.cyan).cornerRadius(12)
                        )
                    }
                }
                .padding()
                .background(Color(hex: "161B22"))

                Spacer()
            }
            .background(Color(hex: "0D1117").ignoresSafeArea())
            .navigationTitle("Camera")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - Person Count Badge
    private var personCountBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "person.fill")
            Text("\(camera.personCount)")
                .font(.system(.title2, design: .monospaced))
        }
        .foregroundColor(.white)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            (camera.personCount > 0 ? Color.cyan : Color.gray)
                .opacity(0.8)
                .cornerRadius(12)
        )
    }

    private var borderColor: Color {
        if camera.personCount >= 5 { return .red }
        if camera.personCount >= 2 { return .orange }
        if camera.personCount >= 1 { return .cyan }
        return .gray.opacity(0.3)
    }

    private func statusItem(icon: String, label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(value)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(.white)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - UIKit Camera Preview Wrapper
struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        previewLayer.frame = view.bounds
        view.layer.addSublayer(previewLayer)
        context.coordinator.previewLayer = previewLayer
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.previewLayer?.frame = uiView.bounds
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {
        var previewLayer: AVCaptureVideoPreviewLayer?
    }
}

#Preview {
    CameraView()
        .environmentObject(CameraService())
        .environmentObject(BackendService())
}
