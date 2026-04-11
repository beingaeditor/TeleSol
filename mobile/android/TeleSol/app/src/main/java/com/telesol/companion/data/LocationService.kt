// ════════════════════════════════════════════════════════════════
// TeleSol Android — Location Service (FusedLocationProvider)
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Looper
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class LocationService(private val context: Context) {

    // ── State ────────────────────────────────────────────────
    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking

    private val _latitude = MutableStateFlow<Double?>(null)
    val latitude: StateFlow<Double?> = _latitude

    private val _longitude = MutableStateFlow<Double?>(null)
    val longitude: StateFlow<Double?> = _longitude

    private val _accuracy = MutableStateFlow<Double?>(null)
    val accuracy: StateFlow<Double?> = _accuracy

    // ── Private ──────────────────────────────────────────────
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY, 5000  // 5 second interval
    ).apply {
        setMinUpdateDistanceMeters(5f)  // 5 meter minimum movement
        setWaitForAccurateLocation(false)
    }.build()

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                _latitude.value = location.latitude
                _longitude.value = location.longitude
                _accuracy.value = location.accuracy.toDouble()
            }
        }
    }

    // ── Start Tracking ───────────────────────────────────────
    fun startTracking() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            return
        }

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
        _isTracking.value = true
    }

    // ── Stop Tracking ────────────────────────────────────────
    fun stopTracking() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        _isTracking.value = false
    }
}
