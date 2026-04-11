// ════════════════════════════════════════════════════════════════
// TeleSol iOS Companion — App Entry Point
// ════════════════════════════════════════════════════════════════

import SwiftUI

@main
struct TelesolApp: App {
    @StateObject private var backendService = BackendService()
    @StateObject private var cameraService = CameraService()
    @StateObject private var audioService = AudioService()
    @StateObject private var locationService = LocationService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(backendService)
                .environmentObject(cameraService)
                .environmentObject(audioService)
                .environmentObject(locationService)
                .onAppear {
                    backendService.register(
                        deviceName: UIDevice.current.name,
                        osVersion: UIDevice.current.systemVersion
                    )
                }
        }
    }
}
