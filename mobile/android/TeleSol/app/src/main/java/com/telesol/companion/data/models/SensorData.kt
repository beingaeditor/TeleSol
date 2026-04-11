// ════════════════════════════════════════════════════════════════
// TeleSol Android — Data Models
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.data.models

import com.google.gson.annotations.SerializedName

// ── Outbound: Phone → Backend ───────────────────────────────

data class MobileRegistration(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_name") val deviceName: String,
    @SerializedName("os_type") val osType: String = "android",
    @SerializedName("os_version") val osVersion: String,
    @SerializedName("app_version") val appVersion: String = "1.0.0"
)

data class MobileStreamPayload(
    @SerializedName("device_id") val deviceId: String,
    val timestamp: Long,
    @SerializedName("noise_db") val noiseDb: Double = 0.0,
    @SerializedName("peak_amplitude") val peakAmplitude: Double = 0.0,
    @SerializedName("is_crowd_noise") val isCrowdNoise: Boolean = false,
    @SerializedName("person_count") val personCount: Int = 0,
    @SerializedName("motion_detected") val motionDetected: Boolean = false,
    @SerializedName("gps_latitude") val gpsLatitude: Double? = null,
    @SerializedName("gps_longitude") val gpsLongitude: Double? = null,
    @SerializedName("gps_accuracy") val gpsAccuracy: Double? = null,
    @SerializedName("battery_level") val batteryLevel: Int? = null
)

// ── Inbound: Backend → Phone ────────────────────────────────

data class StreamResponse(
    val status: String,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("fused_crs") val fusedCrs: Double,
    @SerializedName("fused_level") val fusedLevel: String,
    @SerializedName("esp_connected") val espConnected: Boolean,
    val timestamp: String
)

data class RegisterResponse(
    val status: String,
    @SerializedName("device_id") val deviceId: String,
    val message: String,
    @SerializedName("backend_version") val backendVersion: String,
    val timestamp: String
)

// ── Dashboard Data ──────────────────────────────────────────

data class DashboardData(
    val stats: DashboardStats?,
    val liveData: LiveSensorData?,
    val crs: CRSData?
)

data class DashboardStats(
    val totalNodes: Int?,
    val activeNodes: Int?,
    val activeDevices: Int?,
    val riskScore: Double?,
    val lastUpdate: String?,
    val phoneConnected: Boolean?
)

data class LiveSensorData(
    val radarHumans: Int?,
    val radarDistance: Int?,
    val radarEnergy: Int?,
    val noiseLevel: Double?,
    val tofDistance: Int?,
    val vibration: Double?,
    val temperature: Double?,
    val cameraPeopleCount: Int?,
    val crowdDensity: Double?
)

data class CRSData(
    val crs: Double?,
    val level: String?
)
