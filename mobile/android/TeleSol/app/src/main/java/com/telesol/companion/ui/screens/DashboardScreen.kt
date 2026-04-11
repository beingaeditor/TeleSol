// ════════════════════════════════════════════════════════════════
// TeleSol Android — Dashboard Screen (Jetpack Compose)
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.telesol.companion.data.BackendService
import com.telesol.companion.data.AudioService
import com.telesol.companion.data.CameraService
import com.telesol.companion.data.LocationService

@Composable
fun DashboardScreen(
    backendService: BackendService,
    audioService: AudioService,
    cameraService: CameraService,
    locationService: LocationService
) {
    val isConnected by backendService.isConnected.collectAsState()
    val isStreaming by backendService.isStreaming.collectAsState()
    val lastCRS by backendService.lastCRS.collectAsState()
    val lastLevel by backendService.lastLevel.collectAsState()
    val espConnected by backendService.espConnected.collectAsState()
    val streamCount by backendService.streamCount.collectAsState()
    val noiseLevel by audioService.noiseLevel.collectAsState()
    val personCount by cameraService.personCount.collectAsState()
    val isTracking by locationService.isTracking.collectAsState()

    val darkBg = Color(0xFF0D1117)
    val cardBg = Color(0xFF161B22)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // ── Connection Status ────────────────────────────────
        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(if (isConnected) Color.Green else Color.Red))
                        Text(if (isConnected) "Connected" else "Disconnected",
                            color = if (isConnected) Color.Green else Color.Red,
                            fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(if (espConnected) Color.Cyan else Color.Gray))
                        Text(if (espConnected) "ESP-12E Online" else "ESP-12E Offline",
                            color = Color.Gray, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    }
                }
                Text("Streams: $streamCount", color = Color.Gray,
                    fontFamily = FontFamily.Monospace, fontSize = 12.sp)
            }
        }

        // ── CRS Score ────────────────────────────────────────
        val crsColor = when (lastLevel) {
            "critical" -> Color.Red
            "high" -> Color(0xFFFF9800)
            "elevated" -> Color.Yellow
            else -> Color.Green
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("CONGESTION RISK SCORE", color = Color.Gray,
                    fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text("${lastCRS.toInt()}", color = crsColor,
                    fontFamily = FontFamily.Monospace, fontSize = 56.sp, fontWeight = FontWeight.Bold)
                Text(lastLevel.uppercase(), color = crsColor,
                    fontFamily = FontFamily.Monospace, fontSize = 18.sp)
                Spacer(modifier = Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { (lastCRS / 100.0).toFloat().coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                    color = crsColor,
                    trackColor = Color.Gray.copy(alpha = 0.3f)
                )
            }
        }

        // ── Sensor Grid ──────────────────────────────────────
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SensorTile(Modifier.weight(1f), Icons.Default.Sensors, "Radar", "Active", Color.Cyan, cardBg)
            SensorTile(Modifier.weight(1f), Icons.Default.Straighten, "ToF", "Active", Color(0xFF9C27B0), cardBg)
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SensorTile(Modifier.weight(1f), Icons.Default.Vibration, "Vibration", "0.00 g", Color(0xFFFF9800), cardBg)
            SensorTile(Modifier.weight(1f), Icons.Default.VolumeUp, "Noise", "${noiseLevel.toInt()} dB", Color.Yellow, cardBg)
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SensorTile(Modifier.weight(1f), Icons.Default.People, "People", "$personCount", Color.Green, cardBg)
            SensorTile(Modifier.weight(1f), Icons.Default.Thermostat, "Temp", "--°C", Color.Red, cardBg)
        }

        // ── Streaming Control ────────────────────────────────
        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("DATA STREAMING", color = Color.Gray,
                    fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        if (isStreaming) {
                            backendService.stopStreaming()
                            audioService.stopMonitoring()
                            cameraService.stopCamera()
                            locationService.stopTracking()
                        } else {
                            audioService.startMonitoring()
                            locationService.startTracking()
                            backendService.startStreaming(
                                noiseProvider = { audioService.noiseLevel.value },
                                personProvider = { cameraService.personCount.value },
                                locationProvider = {
                                    Triple(
                                        locationService.latitude.value,
                                        locationService.longitude.value,
                                        locationService.accuracy.value
                                    )
                                }
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isStreaming) Color.Red else Color.Cyan
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        if (isStreaming) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null, tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        if (isStreaming) "Stop Streaming" else "Start Streaming",
                        color = Color.White, fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

@Composable
fun SensorTile(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    label: String,
    value: String,
    color: Color,
    bgColor: Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = bgColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(28.dp))
            Text(value, color = Color.White, fontFamily = FontFamily.Monospace,
                fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text(label, color = Color.Gray, fontFamily = FontFamily.Monospace, fontSize = 11.sp)
        }
    }
}
