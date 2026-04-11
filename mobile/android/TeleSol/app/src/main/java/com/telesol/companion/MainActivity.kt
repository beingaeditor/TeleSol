// ════════════════════════════════════════════════════════════════
// TeleSol Android — Main Activity
// Jetpack Compose with Bottom Navigation
// ════════════════════════════════════════════════════════════════

package com.telesol.companion

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.sp
import com.telesol.companion.data.BackendService
import com.telesol.companion.data.CameraService
import com.telesol.companion.data.AudioService
import com.telesol.companion.data.LocationService
import com.telesol.companion.ui.screens.DashboardScreen
import com.telesol.companion.ui.screens.CameraScreen
import com.telesol.companion.ui.screens.SettingsScreen

class MainActivity : ComponentActivity() {

    private lateinit var backendService: BackendService
    private lateinit var cameraService: CameraService
    private lateinit var audioService: AudioService
    private lateinit var locationService: LocationService

    // Permission launcher
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Permissions handled — services will check individually
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize services
        backendService = BackendService(this)
        cameraService = CameraService(this)
        audioService = AudioService(this)
        locationService = LocationService(this)

        // Request all permissions upfront
        permissionLauncher.launch(arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ))

        // Register with backend
        backendService.register()

        setContent {
            TelesolTheme {
                MainScreen(
                    backendService = backendService,
                    cameraService = cameraService,
                    audioService = audioService,
                    locationService = locationService
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        backendService.disconnect()
        backendService.cleanup()
        cameraService.cleanup()
        audioService.cleanup()
    }
}

// ── Navigation Items ─────────────────────────────────────────

sealed class NavItem(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : NavItem("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Camera : NavItem("camera", "Camera", Icons.Default.CameraAlt)
    object Settings : NavItem("settings", "Settings", Icons.Default.Settings)
}

// ── Main Screen with Bottom Nav ──────────────────────────────

@Composable
fun MainScreen(
    backendService: BackendService,
    cameraService: CameraService,
    audioService: AudioService,
    locationService: LocationService
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val navItems = listOf(NavItem.Dashboard, NavItem.Camera, NavItem.Settings)

    val darkBg = Color(0xFF0D1117)

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF161B22)
            ) {
                navItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            Icon(item.icon, contentDescription = item.title,
                                tint = if (selectedTab == index) Color.Cyan else Color.Gray)
                        },
                        label = {
                            Text(item.title,
                                color = if (selectedTab == index) Color.Cyan else Color.Gray,
                                fontFamily = FontFamily.Monospace, fontSize = 10.sp)
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = Color.Cyan.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(darkBg)
        ) {
            when (selectedTab) {
                0 -> DashboardScreen(backendService, audioService, cameraService, locationService)
                1 -> CameraScreen(cameraService)
                2 -> SettingsScreen(backendService)
            }
        }
    }
}

// ── Theme ────────────────────────────────────────────────────

@Composable
fun TelesolTheme(content: @Composable () -> Unit) {
    val darkColors = darkColorScheme(
        primary = Color.Cyan,
        onPrimary = Color.White,
        surface = Color(0xFF0D1117),
        onSurface = Color.White,
        background = Color(0xFF0D1117),
        onBackground = Color.White,
    )

    MaterialTheme(
        colorScheme = darkColors,
        content = content
    )
}
