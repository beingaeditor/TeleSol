// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Main Tab View
// ════════════════════════════════════════════════════════════════

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var backend: BackendService
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "gauge.with.dots.needle.bottom.50percent")
                    Text("Dashboard")
                }
                .tag(0)

            CameraView()
                .tabItem {
                    Image(systemName: "camera.fill")
                    Text("Camera")
                }
                .tag(1)

            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Settings")
                }
                .tag(2)
        }
        .accentColor(.cyan)
        .preferredColorScheme(.dark)
    }
}

#Preview {
    ContentView()
        .environmentObject(BackendService())
        .environmentObject(CameraService())
        .environmentObject(AudioService())
        .environmentObject(LocationService())
}
