// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Backend Communication Service
// ════════════════════════════════════════════════════════════════

import Foundation
import Combine
import UIKit

class BackendService: ObservableObject {
    // MARK: - Published State
    @Published var isConnected = false
    @Published var isRegistered = false
    @Published var isStreaming = false
    @Published var lastCRS: Double = 0.0
    @Published var lastLevel: String = "normal"
    @Published var espConnected = false
    @Published var errorMessage: String?
    @Published var streamCount: Int = 0
    @Published var dashboardData: DashboardData?

    // MARK: - Configuration
    @Published var backendURL: String {
        didSet {
            UserDefaults.standard.set(backendURL, forKey: "backend_url")
        }
    }

    // MARK: - Private
    private var deviceId: String
    private var streamTimer: Timer?
    private var wsTask: URLSessionWebSocketTask?
    private let session = URLSession.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Init
    init() {
        self.backendURL = UserDefaults.standard.string(forKey: "backend_url") ?? "http://192.168.1.50:8000"
        self.deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
    }

    // MARK: - Registration
    func register(deviceName: String, osVersion: String) {
        let registration = MobileRegistration(
            deviceId: deviceId,
            deviceName: deviceName,
            osType: "ios",
            osVersion: osVersion,
            appVersion: "1.0.0"
        )

        guard let url = URL(string: "\(backendURL)/api/mobile/register") else {
            errorMessage = "Invalid backend URL"
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        do {
            request.httpBody = try JSONEncoder().encode(registration)
        } catch {
            errorMessage = "Failed to encode registration: \(error)"
            return
        }

        session.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.errorMessage = "Registration failed: \(error.localizedDescription)"
                    self?.isConnected = false
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse,
                      httpResponse.statusCode == 200 else {
                    self?.errorMessage = "Registration failed: bad response"
                    return
                }

                self?.isRegistered = true
                self?.isConnected = true
                self?.errorMessage = nil

                // Connect to WebSocket for live updates
                self?.connectWebSocket()
            }
        }.resume()
    }

    // MARK: - Stream Data to Backend
    func sendStream(noiseDb: Double, personCount: Int, motionDetected: Bool,
                    latitude: Double?, longitude: Double?, accuracy: Double?) {
        guard isRegistered else { return }

        let payload = MobileStreamPayload(
            deviceId: deviceId,
            timestamp: Int64(Date().timeIntervalSince1970 * 1000),
            noiseDb: noiseDb,
            peakAmplitude: 0.0,
            isCrowdNoise: noiseDb > 60.0,
            personCount: personCount,
            motionDetected: motionDetected,
            gpsLatitude: latitude,
            gpsLongitude: longitude,
            gpsAccuracy: accuracy,
            batteryLevel: Int(UIDevice.current.batteryLevel * 100)
        )

        guard let url = URL(string: "\(backendURL)/api/mobile/stream") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 5

        do {
            request.httpBody = try JSONEncoder().encode(payload)
        } catch { return }

        session.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.isConnected = false
                    self?.errorMessage = error.localizedDescription
                    return
                }

                self?.isConnected = true
                self?.streamCount += 1

                if let data = data,
                   let resp = try? JSONDecoder().decode(StreamResponse.self, from: data) {
                    self?.lastCRS = resp.fusedCrs
                    self?.lastLevel = resp.fusedLevel
                    self?.espConnected = resp.espConnected
                }
            }
        }.resume()
    }

    // MARK: - Auto-Streaming
    func startStreaming(noiseProvider: @escaping () -> Double,
                        personProvider: @escaping () -> Int,
                        locationProvider: @escaping () -> (Double?, Double?, Double?)) {
        isStreaming = true
        streamTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            let noise = noiseProvider()
            let persons = personProvider()
            let (lat, lng, acc) = locationProvider()
            self?.sendStream(
                noiseDb: noise,
                personCount: persons,
                motionDetected: persons > 0,
                latitude: lat,
                longitude: lng,
                accuracy: acc
            )
        }
    }

    func stopStreaming() {
        streamTimer?.invalidate()
        streamTimer = nil
        isStreaming = false
    }

    // MARK: - WebSocket (live dashboard data)
    private func connectWebSocket() {
        guard let url = URL(string: backendURL.replacingOccurrences(of: "http", with: "ws") + "/ws") else { return }

        wsTask = session.webSocketTask(with: url)
        wsTask?.resume()
        receiveWebSocketMessage()
    }

    private func receiveWebSocketMessage() {
        wsTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let json = try? JSONDecoder().decode(WebSocketMessage.self, from: data) {
                        DispatchQueue.main.async {
                            self?.dashboardData = json.data
                        }
                    }
                default:
                    break
                }
                self?.receiveWebSocketMessage()  // Continue listening

            case .failure:
                DispatchQueue.main.async {
                    self?.isConnected = false
                }
                // Reconnect after delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                    self?.connectWebSocket()
                }
            }
        }
    }

    // MARK: - Disconnect
    func disconnect() {
        stopStreaming()
        wsTask?.cancel(with: .goingAway, reason: nil)

        guard let url = URL(string: "\(backendURL)/api/mobile/disconnect") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["device_id": deviceId])
        session.dataTask(with: request).resume()
    }
}

// WebSocket message wrapper
struct WebSocketMessage: Codable {
    let type: String
    let data: DashboardData?
}
