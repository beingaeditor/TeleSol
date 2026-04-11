// ════════════════════════════════════════════════════════════════
// TeleSol Android — Camera Screen (Jetpack Compose + CameraX)
// ════════════════════════════════════════════════════════════════

package com.telesol.companion.ui.screens

import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.telesol.companion.data.CameraService

@Composable
fun CameraScreen(cameraService: CameraService) {
    val isRunning by cameraService.isRunning.collectAsState()
    val personCount by cameraService.personCount.collectAsState()
    val motionDetected by cameraService.motionDetected.collectAsState()

    val darkBg = Color(0xFF0D1117)
    val cardBg = Color(0xFF161B22)
    val lifecycleOwner = LocalLifecycleOwner.current

    Column(
        modifier = Modifier.fillMaxSize().background(darkBg).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // ── Camera Preview ───────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 3f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Black)
        ) {
            if (isRunning) {
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).also { previewView ->
                            cameraService.startCamera(lifecycleOwner, previewView.surfaceProvider)
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.VideocamOff, contentDescription = null,
                            tint = Color.Gray, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Camera Off", color = Color.Gray, fontFamily = FontFamily.Monospace)
                    }
                }
            }

            // Person count badge
            Box(
                modifier = Modifier.align(Alignment.TopEnd).padding(12.dp)
            ) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (personCount > 0) Color.Cyan.copy(alpha = 0.85f)
                                        else Color.Gray.copy(alpha = 0.7f)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null,
                            tint = Color.White, modifier = Modifier.size(20.dp))
                        Text("$personCount", color = Color.White,
                            fontFamily = FontFamily.Monospace, fontSize = 20.sp,
                            fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Motion indicator
            if (motionDetected) {
                Box(
                    modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFF9800).copy(alpha = 0.85f)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.DirectionsWalk, contentDescription = null,
                                tint = Color.White, modifier = Modifier.size(16.dp))
                            Text("Motion Detected", color = Color.White,
                                fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // ── Status Row ───────────────────────────────────────
        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatusItem(Icons.Default.Videocam, "Camera",
                    if (isRunning) "Active" else "Off",
                    if (isRunning) Color.Green else Color.Gray)
                StatusItem(Icons.Default.CropFree, "Detected",
                    "$personCount", Color.Cyan)
                StatusItem(Icons.Default.SyncAlt, "Motion",
                    if (motionDetected) "Yes" else "No",
                    if (motionDetected) Color(0xFFFF9800) else Color.Gray)
            }
        }

        // ── Toggle Button ────────────────────────────────────
        Button(
            onClick = {
                if (isRunning) cameraService.stopCamera()
                // Note: startCamera needs lifecycle + surface, handled via AndroidView
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isRunning) Color.Red else Color.Cyan
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(
                if (isRunning) Icons.Default.VideocamOff else Icons.Default.Videocam,
                contentDescription = null, tint = Color.White
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                if (isRunning) "Stop Camera" else "Start Camera",
                color = Color.White, fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
fun StatusItem(icon: ImageVector, label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.height(4.dp))
        Text(value, color = Color.White, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
        Text(label, color = Color.Gray, fontSize = 11.sp)
    }
}
