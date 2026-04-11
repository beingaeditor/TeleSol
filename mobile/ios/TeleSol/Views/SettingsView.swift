// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Settings View
// Backend URL config, sensor permissions, app info
// ════════════════════════════════════════════════════════════════

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var backend: BackendService
    @EnvironmentObject var location: LocationService
    @State private var editableURL: String = ""
    @State private var showingSaveAlert = false

    var body: some View {
        NavigationView {
            List {
                // ── Backend Configuration ────────────────────
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Backend URL")
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)

                        TextField("http://192.168.1.50:8000", text: $editableURL)
                            .font(.system(.body, design: .monospaced))
                            .textFieldStyle(.roundedBorder)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .keyboardType(.URL)

                        Button("Save & Reconnect") {
                            backend.backendURL = editableURL
                            backend.disconnect()
                            backend.register(
                                deviceName: UIDevice.current.name,
                                osVersion: UIDevice.current.systemVersion
                            )
                            showingSaveAlert = true
                        }
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.cyan)
                    }
                } header: {
                    Text("Server")
                }

                // ── Connection Status ────────────────────────
                Section {
                    statusRow(label: "Backend", connected: backend.isConnected)
                    statusRow(label: "Registered", connected: backend.isRegistered)
                    statusRow(label: "ESP-12E", connected: backend.espConnected)
                    statusRow(label: "Streaming", connected: backend.isStreaming)

                    HStack {
                        Text("Stream Count")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(backend.streamCount)")
                            .font(.system(.body, design: .monospaced))
                    }
                } header: {
                    Text("Status")
                }

                // ── Permissions ──────────────────────────────
                Section {
                    permissionRow(name: "Camera", granted: true, icon: "camera.fill")
                    permissionRow(name: "Microphone", granted: true, icon: "mic.fill")
                    permissionRow(name: "Location", granted: location.isAuthorized, icon: "location.fill")
                } header: {
                    Text("Permissions")
                } footer: {
                    Text("Grant permissions in Settings > TeleSol if denied.")
                }

                // ── Device Info ──────────────────────────────
                Section {
                    infoRow(label: "Device", value: UIDevice.current.name)
                    infoRow(label: "iOS Version", value: UIDevice.current.systemVersion)
                    infoRow(label: "App Version", value: "1.0.0")
                    infoRow(label: "Platform", value: "ESP-12E Companion")
                } header: {
                    Text("About")
                }

                // ── Danger Zone ──────────────────────────────
                Section {
                    Button("Disconnect from Backend") {
                        backend.disconnect()
                    }
                    .foregroundColor(.red)
                } header: {
                    Text("Actions")
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                editableURL = backend.backendURL
            }
            .alert("Saved", isPresented: $showingSaveAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Backend URL updated. Reconnecting...")
            }
        }
    }

    // MARK: - Helper Views
    private func statusRow(label: String, connected: Bool) -> some View {
        HStack {
            Text(label)
            Spacer()
            HStack(spacing: 4) {
                Circle()
                    .fill(connected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                Text(connected ? "Active" : "Inactive")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(connected ? .green : .red)
            }
        }
    }

    private func permissionRow(name: String, granted: Bool, icon: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(granted ? .cyan : .gray)
            Text(name)
            Spacer()
            Text(granted ? "Granted" : "Denied")
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(granted ? .green : .red)
        }
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.system(.body, design: .monospaced))
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(BackendService())
        .environmentObject(LocationService())
}
