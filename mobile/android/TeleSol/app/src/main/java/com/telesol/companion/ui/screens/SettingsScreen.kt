// ════════════════════════════════════════════════════════════════
// TeleSol Android — Settings Screen
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.telesol.companion.data.BackendService

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(backendService: BackendService) {
    val isConnected by backendService.isConnected.collectAsState()
    val isRegistered by backendService.isRegistered.collectAsState()
    val isStreaming by backendService.isStreaming.collectAsState()
    val espConnected by backendService.espConnected.collectAsState()
    val streamCount by backendService.streamCount.collectAsState()

    var editableURL by remember { mutableStateOf(backendService.backendURL) }
    var showSaveSnackbar by remember { mutableStateOf(false) }

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
        // ── Server Configuration ─────────────────────────────
        SectionHeader("Server")
        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Backend URL", color = Color.Gray, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                OutlinedTextField(
                    value = editableURL,
                    onValueChange = { editableURL = it },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.Cyan,
                        unfocusedBorderColor = Color.Gray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    singleLine = true,
                    textStyle = LocalTextStyle.current.copy(fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                )
                Button(
                    onClick = {
                        backendService.backendURL = editableURL
                        backendService.disconnect()
                        backendService.register()
                        showSaveSnackbar = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Cyan),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Save & Reconnect", color = Color.White, fontFamily = FontFamily.Monospace)
                }
            }
        }

        // ── Connection Status ────────────────────────────────
        SectionHeader("Status")
        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                StatusRow("Backend", isConnected)
                StatusRow("Registered", isRegistered)
                StatusRow("ESP-12E", espConnected)
                StatusRow("Streaming", isStreaming)
                HorizontalDivider(color = Color.Gray.copy(alpha = 0.3f))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Stream Count", color = Color.Gray, fontSize = 14.sp)
                    Text("$streamCount", color = Color.White, fontFamily = FontFamily.Monospace)
                }
            }
        }

        // ── About ────────────────────────────────────────────
        SectionHeader("About")
        Card(
            colors = CardDefaults.cardColors(containerColor = cardBg),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoRow("Device", android.os.Build.MODEL)
                InfoRow("Android", android.os.Build.VERSION.RELEASE)
                InfoRow("App Version", "1.0.0")
                InfoRow("Platform", "ESP-12E Companion")
            }
        }

        // ── Actions ──────────────────────────────────────────
        SectionHeader("Actions")
        Button(
            onClick = { backendService.disconnect() },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.8f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.LinkOff, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Disconnect from Backend", color = Color.White, fontFamily = FontFamily.Monospace)
        }
    }

    if (showSaveSnackbar) {
        LaunchedEffect(Unit) {
            kotlinx.coroutines.delay(2000)
            showSaveSnackbar = false
        }
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        title.uppercase(),
        color = Color.Gray,
        fontFamily = FontFamily.Monospace,
        fontSize = 12.sp,
        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
    )
}

@Composable
fun StatusRow(label: String, active: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = Color.White, fontSize = 14.sp)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(if (active) Color.Green else Color.Red))
            Text(
                if (active) "Active" else "Inactive",
                color = if (active) Color.Green else Color.Red,
                fontFamily = FontFamily.Monospace, fontSize = 12.sp
            )
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = Color.Gray, fontSize = 14.sp)
        Text(value, color = Color.White, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
    }
}
