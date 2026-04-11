// ════════════════════════════════════════════════════════════════
// TeleSol Android — Backend Communication Service
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.data

import android.content.Context
import android.content.SharedPreferences
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import com.google.gson.Gson
import com.telesol.companion.data.models.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class BackendService(private val context: Context) {

    // ── State ────────────────────────────────────────────────
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected

    private val _isRegistered = MutableStateFlow(false)
    val isRegistered: StateFlow<Boolean> = _isRegistered

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming

    private val _lastCRS = MutableStateFlow(0.0)
    val lastCRS: StateFlow<Double> = _lastCRS

    private val _lastLevel = MutableStateFlow("normal")
    val lastLevel: StateFlow<String> = _lastLevel

    private val _espConnected = MutableStateFlow(false)
    val espConnected: StateFlow<Boolean> = _espConnected

    private val _streamCount = MutableStateFlow(0)
    val streamCount: StateFlow<Int> = _streamCount

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    // ── Config ───────────────────────────────────────────────
    private val prefs: SharedPreferences = context.getSharedPreferences("telesol_prefs", Context.MODE_PRIVATE)
    var backendURL: String
        get() = prefs.getString("backend_url", "http://192.168.1.50:8000") ?: "http://192.168.1.50:8000"
        set(value) = prefs.edit().putString("backend_url", value).apply()

    private val deviceId: String by lazy {
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var streamJob: Job? = null

    // ── Registration ─────────────────────────────────────────
    fun register() {
        val registration = MobileRegistration(
            deviceId = deviceId,
            deviceName = "${Build.MANUFACTURER} ${Build.MODEL}",
            osType = "android",
            osVersion = Build.VERSION.RELEASE
        )

        val body = gson.toJson(registration).toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("$backendURL/api/mobile/register")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                _isConnected.value = false
                _errorMessage.value = "Registration failed: ${e.message}"
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    _isRegistered.value = true
                    _isConnected.value = true
                    _errorMessage.value = null
                } else {
                    _errorMessage.value = "Registration failed: HTTP ${response.code}"
                }
                response.close()
            }
        })
    }

    // ── Stream Data ──────────────────────────────────────────
    fun sendStream(
        noiseDb: Double,
        personCount: Int,
        motionDetected: Boolean,
        latitude: Double?,
        longitude: Double?,
        accuracy: Double?
    ) {
        if (!_isRegistered.value) return

        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val batteryLevel = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        val payload = MobileStreamPayload(
            deviceId = deviceId,
            timestamp = System.currentTimeMillis(),
            noiseDb = noiseDb,
            isCrowdNoise = noiseDb > 60.0,
            personCount = personCount,
            motionDetected = motionDetected,
            gpsLatitude = latitude,
            gpsLongitude = longitude,
            gpsAccuracy = accuracy,
            batteryLevel = batteryLevel
        )

        val body = gson.toJson(payload).toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("$backendURL/api/mobile/stream")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                _isConnected.value = false
                _errorMessage.value = e.message
            }

            override fun onResponse(call: Call, response: Response) {
                _isConnected.value = true
                _streamCount.value += 1

                response.body?.string()?.let { responseBody ->
                    try {
                        val resp = gson.fromJson(responseBody, StreamResponse::class.java)
                        _lastCRS.value = resp.fusedCrs
                        _lastLevel.value = resp.fusedLevel
                        _espConnected.value = resp.espConnected
                    } catch (_: Exception) {}
                }
                response.close()
            }
        })
    }

    // ── Auto-Streaming ───────────────────────────────────────
    fun startStreaming(
        noiseProvider: () -> Double,
        personProvider: () -> Int,
        locationProvider: () -> Triple<Double?, Double?, Double?>
    ) {
        _isStreaming.value = true
        streamJob = scope.launch {
            while (isActive) {
                val noise = noiseProvider()
                val persons = personProvider()
                val (lat, lng, acc) = locationProvider()
                sendStream(noise, persons, persons > 0, lat, lng, acc)
                delay(3000)  // Stream every 3 seconds
            }
        }
    }

    fun stopStreaming() {
        streamJob?.cancel()
        streamJob = null
        _isStreaming.value = false
    }

    // ── Disconnect ───────────────────────────────────────────
    fun disconnect() {
        stopStreaming()
        val body = gson.toJson(mapOf("device_id" to deviceId)).toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("$backendURL/api/mobile/disconnect")
            .post(body)
            .build()
        try { client.newCall(request).execute().close() } catch (_: Exception) {}
    }

    fun cleanup() {
        scope.cancel()
    }
}
