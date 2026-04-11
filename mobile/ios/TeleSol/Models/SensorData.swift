// ════════════════════════════════════════════════════════════════
// TeleSol iOS — Data Models
// ════════════════════════════════════════════════════════════════

import Foundation

// MARK: - Outbound: Phone → Backend

struct MobileRegistration: Codable {
    let deviceId: String
    let deviceName: String
    let osType: String
    let osVersion: String
    let appVersion: String

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case deviceName = "device_name"
        case osType = "os_type"
        case osVersion = "os_version"
        case appVersion = "app_version"
    }
}

struct MobileStreamPayload: Codable {
    let deviceId: String
    let timestamp: Int64
    let noiseDb: Double
    let peakAmplitude: Double
    let isCrowdNoise: Bool
    let personCount: Int
    let motionDetected: Bool
    let gpsLatitude: Double?
    let gpsLongitude: Double?
    let gpsAccuracy: Double?
    let batteryLevel: Int?

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case timestamp
        case noiseDb = "noise_db"
        case peakAmplitude = "peak_amplitude"
        case isCrowdNoise = "is_crowd_noise"
        case personCount = "person_count"
        case motionDetected = "motion_detected"
        case gpsLatitude = "gps_latitude"
        case gpsLongitude = "gps_longitude"
        case gpsAccuracy = "gps_accuracy"
        case batteryLevel = "battery_level"
    }
}

// MARK: - Inbound: Backend → Phone

struct StreamResponse: Codable {
    let status: String
    let deviceId: String
    let fusedCrs: Double
    let fusedLevel: String
    let espConnected: Bool
    let timestamp: String

    enum CodingKeys: String, CodingKey {
        case status
        case deviceId = "device_id"
        case fusedCrs = "fused_crs"
        case fusedLevel = "fused_level"
        case espConnected = "esp_connected"
        case timestamp
    }
}

struct RegisterResponse: Codable {
    let status: String
    let deviceId: String
    let message: String
    let backendVersion: String
    let timestamp: String

    enum CodingKeys: String, CodingKey {
        case status
        case deviceId = "device_id"
        case message
        case backendVersion = "backend_version"
        case timestamp
    }
}

// MARK: - Dashboard Data (WebSocket)

struct DashboardData: Codable {
    let stats: DashboardStats?
    let liveData: LiveSensorData?
    let crs: CRSData?

    enum CodingKeys: String, CodingKey {
        case stats
        case liveData
        case crs
    }
}

struct DashboardStats: Codable {
    let totalNodes: Int?
    let activeNodes: Int?
    let activeDevices: Int?
    let riskScore: Double?
    let lastUpdate: String?
    let phoneConnected: Bool?
}

struct LiveSensorData: Codable {
    let radarHumans: Int?
    let radarDistance: Int?
    let radarEnergy: Int?
    let noiseLevel: Double?
    let tofDistance: Int?
    let vibration: Double?
    let temperature: Double?
    let cameraPeopleCount: Int?
    let crowdDensity: Double?
}

struct CRSData: Codable {
    let crs: Double?
    let level: String?
}
